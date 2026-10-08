// Regenera os cartões de Site/index.html e o array PRODUCTS de Site/script.js a partir de data/products.json.
// Uso: node scripts/build-catalog.js          (grava)
//      node scripts/build-catalog.js --check  (só confere se está sincronizado)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATHS, parseCatalog, renderHTML, renderScript } from '../lib/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const check = process.argv.includes('--check');

const products = parseCatalog(read(PATHS.data));
const missing = products.filter(product => !fs.existsSync(path.join(root, 'Site', product.image)));
if (missing.length) {
  console.error(`Fotos não encontradas: ${missing.map(product => product.image).join(', ')}`);
  process.exit(1);
}

const outdated = [];
for (const [file, render] of [[PATHS.html, renderHTML], [PATHS.script, renderScript]]) {
  const current = read(file);
  const next = render(current, products);
  if (current === next) continue;
  outdated.push(file);
  if (!check) fs.writeFileSync(path.join(root, file), next);
}

if (check && outdated.length) {
  console.error(`Fora de sincronia com ${PATHS.data}: ${outdated.join(', ')}. Rode: node scripts/build-catalog.js`);
  process.exit(1);
}
console.log(check ? `Catálogo sincronizado (${products.length} produtos).` : `Catálogo gerado (${products.length} produtos)${outdated.length ? `: ${outdated.join(', ')}` : ', nada mudou'}.`);
