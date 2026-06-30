const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const db = path.join(root, '.local-db.json');
try { fs.unlinkSync(db); } catch (_) {}
process.chdir(root);
process.env.ADMIN_PASSWORD = 'testpass';

const links = require('../netlify/functions/links');
const scans = require('../netlify/functions/scans');
const scan = require('../netlify/functions/scan');

function event(method, body, queryStringParameters = {}, headers = {}) {
  return {
    httpMethod: method,
    body: body ? JSON.stringify(body) : null,
    queryStringParameters,
    headers: { 'x-admin-password': 'testpass', 'user-agent': 'Mozilla/5.0 iPhone Safari/605.1', ...headers },
    path: '/.netlify/functions/test'
  };
}

(async () => {
  let res = await links.handler(event('POST', { name: 'Test QR', targetUrl: 'example.com', code: 'test-001', notes: 'hello' }));
  assert.strictEqual(res.statusCode, 201, res.body);
  const created = JSON.parse(res.body).link;
  assert.strictEqual(created.code, 'test-001');
  assert.strictEqual(created.targetUrl, 'https://example.com/');

  res = await links.handler(event('GET'));
  assert.strictEqual(res.statusCode, 200, res.body);
  assert.strictEqual(JSON.parse(res.body).links.length, 1);

  res = await scan.handler({ httpMethod: 'GET', queryStringParameters: { code: 'test-001' }, headers: { 'user-agent': 'Mozilla/5.0 iPhone Safari/605.1', 'x-nf-client-connection-ip': '1.2.3.4' }, path: '/q/test-001' });
  assert.strictEqual(res.statusCode, 302, res.body);
  assert.strictEqual(res.headers.location, 'https://example.com/');

  res = await scans.handler(event('GET'));
  assert.strictEqual(res.statusCode, 200, res.body);
  const scanData = JSON.parse(res.body).scans;
  assert.strictEqual(scanData.length, 1);
  assert.strictEqual(scanData[0].code, 'test-001');
  assert.strictEqual(scanData[0].device, 'Phone');

  res = await links.handler(event('PUT', { code: 'test-001', notes: 'updated', active: false }));
  assert.strictEqual(res.statusCode, 200, res.body);
  assert.strictEqual(JSON.parse(res.body).link.active, false);

  res = await scan.handler({ httpMethod: 'GET', queryStringParameters: { code: 'test-001' }, headers: {}, path: '/q/test-001' });
  assert.strictEqual(res.statusCode, 404, res.body);

  console.log('QR tracker smoke test passed');
})();
