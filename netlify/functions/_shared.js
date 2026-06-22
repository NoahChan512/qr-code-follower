const fs = require('fs/promises');
const path = require('path');
let blobs = null;
try { blobs = require('@netlify/blobs'); } catch (_) { blobs = null; }

const LOCAL_DB = path.join(process.cwd(), '.local-db.json');
const STORE_NAME = 'qr-tracker';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, x-admin-password',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

function now() { return new Date().toISOString(); }

function code() {
  return Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
}

function parseBody(event) {
  if (!event.body) return {};
  try { return JSON.parse(event.body); } catch (_) { return {}; }
}

function normalizeUrl(url) {
  const value = String(url || '').trim();
  if (!value) throw new Error('Missing URL');
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const u = new URL(withScheme);
  return u.toString();
}

function adminOk(event) {
  const expected = process.env.ADMIN_PASSWORD || 'changeme';
  const got = event.headers['x-admin-password'] || event.headers['X-Admin-Password'] || '';
  return String(got) === String(expected);
}

async function readLocal() {
  try { return JSON.parse(await fs.readFile(LOCAL_DB, 'utf8')); }
  catch (_) { return { links: [], scans: [] }; }
}

async function writeLocal(data) {
  await fs.writeFile(LOCAL_DB, JSON.stringify(data, null, 2));
}

async function readData() {
  if (process.env.NETLIFY && blobs) {
    const store = blobs.getStore(STORE_NAME);
    return (await store.get('data.json', { type: 'json' })) || { links: [], scans: [] };
  }
  return readLocal();
}

async function writeData(data) {
  if (process.env.NETLIFY && blobs) {
    const store = blobs.getStore(STORE_NAME);
    await store.setJSON('data.json', data);
    return;
  }
  await writeLocal(data);
}

function clientInfo(event) {
  const h = event.headers || {};
  const ipRaw = h['x-nf-client-connection-ip'] || h['client-ip'] || h['x-forwarded-for'] || '';
  const ip = String(ipRaw).split(',')[0].trim();
  const ua = h['user-agent'] || '';
  const country = h['x-country'] || h['x-nf-geo-country'] || '';
  const referrer = h.referer || h.referrer || '';
  let device = 'Unknown';
  if (/iphone|android.*mobile/i.test(ua)) device = 'Phone';
  else if (/ipad|tablet/i.test(ua)) device = 'Tablet';
  else if (/macintosh|windows|linux/i.test(ua)) device = 'Desktop';
  let browser = 'Unknown';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome\//i.test(ua)) browser = 'Chrome';
  else if (/safari\//i.test(ua)) browser = 'Safari';
  else if (/firefox\//i.test(ua)) browser = 'Firefox';
  return { ip, country, referrer, userAgent: ua, device, browser };
}

module.exports = {
  json, now, code, parseBody, normalizeUrl, adminOk,
  readData, writeData, clientInfo
};
