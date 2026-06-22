const { now, readData, writeData, clientInfo } = require('./_shared');

exports.handler = async (event) => {
  const code = event.queryStringParameters?.code || (event.path || '').split('/').pop();
  const data = await readData();
  data.links ||= [];
  data.scans ||= [];
  const link = data.links.find(x => x.code === code);

  if (!link || link.active === false) {
    return {
      statusCode: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: '<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>QR not found</title><body style="font-family:system-ui;padding:32px;background:#f7f3eb"><h1>QR not found</h1><p>This QR code is inactive or does not exist.</p></body>'
    };
  }

  const info = clientInfo(event);
  data.scans.push({
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    code: link.code,
    linkName: link.name,
    targetUrl: link.targetUrl,
    at: now(),
    ...info
  });
  await writeData(data);

  return {
    statusCode: 302,
    headers: {
      location: link.targetUrl,
      'cache-control': 'no-store'
    },
    body: ''
  };
};
