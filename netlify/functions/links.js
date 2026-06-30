const { json, now, code, parseBody, normalizeUrl, adminOk, readData, writeData } = require('./_shared');

exports.handler = async (event) => {
  try {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (!adminOk(event)) return json(401, { error: 'Wrong admin password' });

  const data = await readData();
  data.links ||= [];
  data.scans ||= [];

  if (event.httpMethod === 'GET') {
    const links = data.links.map(link => ({
      ...link,
      scanCount: data.scans.filter(s => s.code === link.code).length,
      lastScanAt: [...data.scans].reverse().find(s => s.code === link.code)?.at || null
    })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return json(200, { links });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody(event);
    let targetUrl;
    try { targetUrl = normalizeUrl(body.targetUrl); }
    catch (e) { return json(400, { error: e.message }); }
    const link = {
      code: body.code ? String(body.code).trim().replace(/[^a-z0-9-]/gi, '').slice(0, 32) : code(),
      name: String(body.name || 'Untitled QR').trim().slice(0, 80),
      targetUrl,
      notes: String(body.notes || '').trim().slice(0, 1000),
      active: body.active !== false,
      createdAt: now(),
      updatedAt: now()
    };
    if (!link.code) link.code = code();
    if (data.links.some(x => x.code === link.code)) return json(409, { error: 'Code already exists' });
    data.links.push(link);
    await writeData(data);
    return json(201, { link });
  }

  if (event.httpMethod === 'PUT') {
    const body = parseBody(event);
    const codeValue = String(body.code || '').trim();
    const link = data.links.find(x => x.code === codeValue);
    if (!link) return json(404, { error: 'QR link not found' });
    if ('name' in body) link.name = String(body.name || '').trim().slice(0, 80) || link.name;
    if ('targetUrl' in body) {
      try { link.targetUrl = normalizeUrl(body.targetUrl); }
      catch (e) { return json(400, { error: e.message }); }
    }
    if ('notes' in body) link.notes = String(body.notes || '').trim().slice(0, 1000);
    if ('active' in body) link.active = Boolean(body.active);
    link.updatedAt = now();
    await writeData(data);
    return json(200, { link });
  }

  if (event.httpMethod === 'DELETE') {
    const codeValue = event.queryStringParameters?.code || parseBody(event).code;
    const before = data.links.length;
    data.links = data.links.filter(x => x.code !== codeValue);
    data.scans = data.scans.filter(x => x.code !== codeValue);
    if (data.links.length === before) return json(404, { error: 'QR link not found' });
    await writeData(data);
    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
  } catch (e) {
    return json(500, { error: String(e && e.message || e) });
  }
};
