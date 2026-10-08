// Servidor local: site em http://127.0.0.1:4173/ e painel em /admin/, gravando direto nos arquivos.
// Uso: npm run admin   (senha: ADMIN_PASSWORD ou "cler-local")
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAdmin } from '../lib/admin.js';
import { fileStorage } from '../lib/storage.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'Site');
const port = Number(process.env.PORT) || 4173;
const password = process.env.ADMIN_PASSWORD || 'cler-local';
const storage = fileStorage(root);
const MAX_BODY = 8 * 1024 * 1024;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('too large');
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null;
}

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let file = path.join(site, decodeURIComponent(url.pathname));
  if (file !== site && !file.startsWith(site + path.sep)) return res.writeHead(403).end();
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
  }
}

http.createServer(async (req, res) => {
  if (!req.url.startsWith('/api/admin')) return serveStatic(req, res);
  let body = null;
  try { body = await readBody(req); } catch { body = null; }
  const result = await handleAdmin({ method: req.method, headers: req.headers, body }, { storage, password, secure: false });
  res.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8', ...result.headers }).end(JSON.stringify(result.body));
}).listen(port, '127.0.0.1', () => {
  console.log(`Site:   http://127.0.0.1:${port}/`);
  console.log(`Painel: http://127.0.0.1:${port}/admin/  (senha: ${process.env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD' : password})`);
  console.log('As alterações gravam direto em data/, Site/index.html, Site/script.js e Site/assets/.');
});
