// Função da Vercel para /api/admin. Variáveis de ambiente:
//   ADMIN_PASSWORD  senha do painel
//   GITHUB_TOKEN    token fine-grained com "Contents: Read and write" só neste repositório
//   GITHUB_REPO     opcional, padrão matheussgab/site-cler-atelie-botanico
//   GITHUB_BRANCH   opcional, padrão main
import { handleAdmin } from '../lib/admin.js';
import { githubStorage } from '../lib/storage.js';

export default async function handler(req, res) {
  let body = null;
  try { body = req.body ?? null; } catch { body = null; } // JSON inválido
  const { GITHUB_TOKEN: token, GITHUB_REPO: repo, GITHUB_BRANCH: branch, ADMIN_PASSWORD: password } = process.env;
  const storage = token ? githubStorage({ token, repo: repo || 'matheussgab/site-cler-atelie-botanico', branch: branch || 'main' }) : null;
  const result = await handleAdmin({ method: req.method, headers: req.headers, body }, { storage, password, secure: true });
  for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
  res.status(result.status).json(result.body);
}
