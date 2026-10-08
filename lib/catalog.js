// Catálogo da Cler: data/products.json é a fonte; este módulo valida os produtos
// e regenera os trechos marcados de Site/index.html e Site/script.js.

export const PATHS = {
  data: 'data/products.json',
  html: 'Site/index.html',
  script: 'Site/script.js',
  css: 'Site/layout.css',
  assets: 'Site/assets/',
};

export const GROUPS = {
  biojoias: { label: 'Biojoias', category: 'Biojoia botânica autoral' },
  acessorios: { label: 'Acessórios', category: 'Acessório botânico' },
  decoracao: { label: 'Decoração', category: 'Decoração botânica' },
};

const MAX_PRODUCTS = 60;
const MAX_SPECS = 10;
const MAX_PRICE = 10_000_000; // R$ 100.000,00

const CARDS_START = '<!-- catalog:cards:start -->';
const CARDS_END = '<!-- catalog:cards:end -->';
const SCRIPT_START = '/* catalog:start */';
const SCRIPT_END = '/* catalog:end */';

export class CatalogError extends Error {}

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

// "R$ 1.234,50" com espaço comum, igual aos cartões já publicados.
export function formatPrice(cents) {
  const reais = Math.floor(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${reais},${String(cents % 100).padStart(2, '0')}`;
}

export function slugify(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');
}

function text(value, field, max, { optional = false } = {}) {
  const clean = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!clean && !optional) throw new CatalogError(`Preencha o campo "${field}".`);
  if (clean.length > max) throw new CatalogError(`"${field}" pode ter no máximo ${max} caracteres.`);
  return clean;
}

export function validateProduct(input) {
  if (!input || typeof input !== 'object') throw new CatalogError('Produto inválido.');
  const id = String(input.id || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 48) throw new CatalogError('Identificador do produto inválido.');
  if (!Object.hasOwn(GROUPS, input.group)) throw new CatalogError('Escolha um grupo válido.');
  const price = input.price;
  if (!Number.isSafeInteger(price) || price < 1 || price > MAX_PRICE) throw new CatalogError('Informe um preço válido.');
  if (typeof input.image !== 'string' || !/^assets\/[a-z0-9-]+\.jpg$/.test(input.image)) throw new CatalogError('Foto do produto inválida.');
  const width = input.width, height = input.height;
  if (![width, height].every(n => Number.isSafeInteger(n) && n > 0 && n <= 10000)) throw new CatalogError('Dimensões da foto inválidas.');
  if (!Array.isArray(input.specs) || input.specs.length > MAX_SPECS) throw new CatalogError(`Use no máximo ${MAX_SPECS} especificações.`);
  const specs = input.specs.map(row => {
    if (!Array.isArray(row) || row.length !== 2) throw new CatalogError('Especificação inválida.');
    return [text(row[0], 'Especificação', 40), text(row[1], 'Valor da especificação', 120)];
  });
  return {
    id,
    name: text(input.name, 'Nome', 80),
    group: input.group,
    category: text(input.category, 'Categoria', 60),
    price,
    image: input.image,
    width,
    height,
    alt: text(input.alt, 'Descrição da foto', 200),
    description: text(input.description, 'Descrição', 700),
    specs,
  };
}

export function validateCatalog(products) {
  if (!Array.isArray(products)) throw new CatalogError('Catálogo inválido.');
  if (products.length > MAX_PRODUCTS) throw new CatalogError(`O catálogo comporta no máximo ${MAX_PRODUCTS} produtos.`);
  const list = products.map(validateProduct);
  const ids = new Set();
  for (const product of list) {
    if (ids.has(product.id)) throw new CatalogError(`Produto repetido: ${product.id}.`);
    ids.add(product.id);
  }
  return list;
}

export const parseCatalog = source => validateCatalog(JSON.parse(source));
export const serializeCatalog = products => JSON.stringify(products, null, 2) + '\n';

function card(product) {
  const price = formatPrice(product.price);
  return `<article class="product-card" data-group="${product.group}"><a aria-label="Consultar ${escapeHTML(product.name)}, ${price}" data-product="${product.id}" data-whatsapp="${escapeHTML(product.name)}" href="#contato"><div class="product-image"><img alt="${escapeHTML(product.alt)}" decoding="async" height="${product.height}" loading="lazy" src="${product.image}" width="${product.width}"/><span aria-hidden="true" class="product-open">+</span></div><h3>${escapeHTML(product.name)}</h3><span class="product-category">${escapeHTML(product.category)}</span><span class="product-price">${price}</span></a></article>`;
}

const countLabel = count => `${count} ${count === 1 ? 'criação autoral' : 'criações autorais'}`;

function replaceBetween(source, start, end, content, file) {
  const from = source.indexOf(start), to = source.indexOf(end);
  if (from < 0 || to < from) throw new Error(`Marcadores do catálogo não encontrados em ${file}.`);
  return source.slice(0, from + start.length) + content + source.slice(to);
}

// No Windows o Git entrega CRLF; no GitHub os arquivos estão com LF. Mantém o que o arquivo já usa.
function keepLineEndings(source, transform) {
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  return transform(source.replace(/\r\n/g, '\n')).replace(/\n/g, eol);
}

export function renderHTML(html, products) {
  return keepLineEndings(html, source => {
    const cards = products.length ? `\n${products.map(card).join('\n')}\n` : '\n';
    const withCards = replaceBetween(source, CARDS_START, CARDS_END, cards, PATHS.html);
    const countPattern = /(id="collection-count">)[^<]*(<\/span>)/;
    if (!countPattern.test(withCards)) throw new Error(`Contador do catálogo não encontrado em ${PATHS.html}.`);
    return withCards.replace(countPattern, `$1${countLabel(products.length)}$2`);
  });
}

export function renderScript(script, products) {
  const data = products.map(({ id, name, group, category, price, image, alt, description, specs }) => ({ id, name, group, category, price, image, alt, description, specs }));
  return keepLineEndings(script, source => replaceBetween(source, SCRIPT_START, SCRIPT_END, `const PRODUCTS = ${JSON.stringify(data, null, 2)};`, PATHS.script));
}

// Lê altura e largura de um JPEG (marcadores SOF), sem depender do navegador.
export function jpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset++; continue; }
    const marker = buffer[offset + 1];
    if (marker === 0xff) { offset++; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSOF) return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    offset += 2 + length;
  }
  return null;
}
