// API do painel do catálogo. Independente de servidor: recebe { method, headers, body }
// e devolve { status, headers, body }. Usada por api/admin.js (Vercel) e scripts/admin-local.js.
import crypto from 'node:crypto';
import {
  CatalogError, GROUPS, PATHS, jpegSize, parseCatalog, renderHTML, renderScript,
  serializeCatalog, slugify, validateCatalog, validateProduct,
} from './catalog.js';
import { StorageConflict } from './storage.js';

const COOKIE = 'cler_admin';
const SESSION_DAYS = 7;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const sha256 = value => crypto.createHash('sha256').update(value).digest();
const sign = (password, payload) => crypto.createHmac('sha256', sha256(`cler-admin-session:${password}`)).update(payload).digest('base64url');
const sameBytes = (a, b) => a.length === b.length && crypto.timingSafeEqual(a, b);

function sessionCookie(password, secure) {
  const expires = Date.now() + SESSION_DAYS * 864e5;
  const token = `${expires}.${sign(password, String(expires))}`;
  return `${COOKIE}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`;
}

function hasSession(headers, password) {
  const match = String(headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;
  const [expires, signature] = match[1].split('.');
  if (!expires || !signature || !(Number(expires) > Date.now())) return false;
  return sameBytes(Buffer.from(signature), Buffer.from(sign(password, expires)));
}

const reply = (status, body, headers = {}) => ({ status, body, headers: { 'Cache-Control': 'no-store', ...headers } });
const fail = (status, error) => reply(status, { error });

// Gera todos os arquivos derivados do catálogo e apaga fotos que deixaram de ser usadas.
async function publish(read, products, removedImages, message, extraFiles = {}) {
  const list = validateCatalog(products);
  const [html, script, css] = await Promise.all([read(PATHS.html), read(PATHS.script), read(PATHS.css)]);
  const files = {
    [PATHS.data]: serializeCatalog(list),
    [PATHS.html]: renderHTML(html, list),
    [PATHS.script]: renderScript(script, list),
    ...extraFiles,
  };
  const stillUsed = image => list.some(product => product.image === image)
    || [files[PATHS.html], files[PATHS.script], css || ''].some(source => source.includes(image));
  const deletes = [...new Set(removedImages)].filter(image => image && !stillUsed(image)).map(image => `Site/${image}`);
  return { files, deletes, message, products: list };
}

function decodeImage(image) {
  if (!image) return null;
  if (typeof image.data !== 'string') throw new CatalogError('Foto inválida.');
  const buffer = Buffer.from(image.data, 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) throw new CatalogError('A foto ficou grande demais. Tente outra imagem.');
  const size = jpegSize(buffer);
  if (!size) throw new CatalogError('A foto precisa estar em JPG.');
  return { buffer, ...size };
}

function uniqueId(name, products) {
  const base = slugify(name) || 'produto';
  const taken = new Set(products.map(product => product.id));
  let id = base, n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
}

async function save(read, { product: input, image: rawImage }) {
  const products = parseCatalog(await read(PATHS.data));
  const image = decodeImage(rawImage);
  const isNew = !input?.id;
  const index = isNew ? -1 : products.findIndex(product => product.id === input.id);
  if (!isNew && index < 0) throw new CatalogError('Esse produto não existe mais. Recarregue a página.');
  if (isNew && !image) throw new CatalogError('Envie uma foto do produto.');

  const current = isNew ? null : products[index];
  const id = isNew ? uniqueId(input?.name, products) : current.id;
  const extraFiles = {};
  let photo = current ? { image: current.image, width: current.width, height: current.height } : null;
  if (image) {
    photo = { image: `assets/${id}-${Date.now().toString(36)}.jpg`, width: image.width, height: image.height };
    extraFiles[`Site/${photo.image}`] = image.buffer;
  }
  const product = validateProduct({ ...input, id, ...photo });
  if (isNew) products.push(product); else products[index] = product;

  const removed = image && current ? [current.image] : [];
  const verb = isNew ? 'adiciona' : 'atualiza';
  return publish(read, products, removed, `Catálogo: ${verb} ${product.name}`, extraFiles);
}

async function remove(read, { id }) {
  const products = parseCatalog(await read(PATHS.data));
  const product = products.find(item => item.id === id);
  if (!product) throw new CatalogError('Esse produto já foi removido. Recarregue a página.');
  return publish(read, products.filter(item => item !== product), [product.image], `Catálogo: remove ${product.name}`);
}

async function reorder(read, { ids }) {
  const products = parseCatalog(await read(PATHS.data));
  const byId = new Map(products.map(product => [product.id, product]));
  if (!Array.isArray(ids) || ids.length !== products.length || new Set(ids).size !== ids.length || !ids.every(id => byId.has(id))) {
    throw new CatalogError('O catálogo mudou enquanto você editava. Recarregue a página.');
  }
  return publish(read, ids.map(id => byId.get(id)), [], 'Catálogo: reordena produtos');
}

const OPERATIONS = { save, delete: remove, reorder };

export async function handleAdmin({ method, headers = {}, body }, { storage, password, secure = true }) {
  if (!password) return fail(503, 'Painel não configurado: defina ADMIN_PASSWORD.');
  if (!storage) return fail(503, 'Painel não configurado: defina GITHUB_TOKEN.');

  if (method === 'GET') {
    if (!hasSession(headers, password)) return fail(401, 'Entre com a senha.');
    try {
      const products = parseCatalog(await storage.read(PATHS.data));
      return reply(200, { products, groups: GROUPS, mode: storage.mode });
    } catch (error) {
      console.error(error);
      return fail(500, 'Não foi possível carregar o catálogo. Tente de novo em instantes.');
    }
  }
  if (method !== 'POST') return fail(405, 'Método não permitido.');
  // Bloqueia envios de outros sites: o painel sempre manda este cabeçalho.
  if (headers['x-requested-with'] !== 'cler-admin') return fail(403, 'Requisição recusada.');
  const op = body?.op;

  if (op === 'login') {
    const ok = typeof body.password === 'string' && sameBytes(sha256(body.password), sha256(password));
    if (!ok) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return fail(401, 'Senha incorreta.');
    }
    return reply(200, { ok: true }, { 'Set-Cookie': sessionCookie(password, secure) });
  }
  if (op === 'logout') {
    return reply(200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}` });
  }
  if (!hasSession(headers, password)) return fail(401, 'Sua sessão expirou. Entre de novo.');
  if (!Object.hasOwn(OPERATIONS, op)) return fail(400, 'Operação desconhecida.');

  try {
    const result = await storage.transact(read => OPERATIONS[op](read, body));
    const notice = storage.mode === 'github'
      ? 'Publicado. O site atualiza em cerca de 1 minuto.'
      : 'Arquivos atualizados no computador. Faça commit e push para publicar.';
    return reply(200, { products: result.products, notice });
  } catch (error) {
    if (error instanceof CatalogError || error instanceof StorageConflict) return fail(400, error.message);
    console.error(error);
    return fail(500, 'Não foi possível salvar agora. Tente de novo em instantes.');
  }
}
