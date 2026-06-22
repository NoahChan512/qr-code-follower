const { json, adminOk, readData } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (!adminOk(event)) return json(401, { error: 'Wrong admin password' });
  const data = await readData();
  const code = event.queryStringParameters?.code;
  let scans = data.scans || [];
  if (code) scans = scans.filter(s => s.code === code);
  scans = scans.sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 500);
  return json(200, { scans });
};
