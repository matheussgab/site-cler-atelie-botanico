// Onde o painel grava. As duas opções expõem a mesma interface:
//   read(path)          → texto do arquivo ou null
//   transact(mutate)    → mutate(read) devolve { files: {path: string|Buffer}, deletes: [path], message }
import fs from 'node:fs/promises';
import path from 'node:path';

export class StorageConflict extends Error {}

// Produção: cada alteração vira um commit no GitHub; a Vercel republica o site sozinha.
export function githubStorage({ token, repo, branch = 'main' }) {
  async function api(method, endpoint, body, accept = 'application/vnd.github+json') {
    const response = await fetch(`https://api.github.com/repos/${repo}${endpoint}`, {
      method,
      headers: {
        Accept: accept,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'cler-admin',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 404 && method === 'GET') return null;
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const error = new Error(`GitHub ${method} ${endpoint}: ${response.status} ${detail.slice(0, 300)}`);
      error.status = response.status;
      throw error;
    }
    return accept.includes('raw') ? response.text() : response.json();
  }

  const head = async () => (await api('GET', `/git/ref/heads/${branch}`)).object.sha;
  const readAt = (ref, file) => api('GET', `/contents/${file.split('/').map(encodeURIComponent).join('/')}?ref=${ref}`, null, 'application/vnd.github.raw+json');

  return {
    mode: 'github',
    read: async file => readAt(await head(), file),
    async transact(mutate) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const parent = await head();
        const { tree: { sha: baseTree } } = await api('GET', `/git/commits/${parent}`);
        const cache = new Map();
        const read = file => {
          if (!cache.has(file)) cache.set(file, readAt(parent, file));
          return cache.get(file);
        };
        const result = await mutate(read);
        const tree = [];
        for (const [file, content] of Object.entries(result.files)) {
          if (Buffer.isBuffer(content)) {
            const blob = await api('POST', '/git/blobs', { content: content.toString('base64'), encoding: 'base64' });
            tree.push({ path: file, mode: '100644', type: 'blob', sha: blob.sha });
          } else {
            tree.push({ path: file, mode: '100644', type: 'blob', content });
          }
        }
        for (const file of result.deletes || []) tree.push({ path: file, mode: '100644', type: 'blob', sha: null });
        const newTree = await api('POST', '/git/trees', { base_tree: baseTree, tree });
        const commit = await api('POST', '/git/commits', { message: result.message, tree: newTree.sha, parents: [parent] });
        try {
          await api('PATCH', `/git/refs/heads/${branch}`, { sha: commit.sha, force: false });
          return result;
        } catch (error) {
          if (error.status !== 422) throw error; // outra alteração entrou antes: refaz sobre a versão nova
        }
      }
      throw new StorageConflict('O catálogo foi alterado ao mesmo tempo em outro lugar. Tente de novo.');
    },
  };
}

// Desenvolvimento: grava direto nos arquivos do projeto (depois é só fazer commit).
export function fileStorage(root) {
  let queue = Promise.resolve();
  const resolve = file => {
    const full = path.resolve(root, file);
    if (!full.startsWith(path.resolve(root) + path.sep)) throw new Error(`Caminho fora do projeto: ${file}`);
    return full;
  };
  const read = file => fs.readFile(resolve(file), 'utf8').catch(error => (error.code === 'ENOENT' ? null : Promise.reject(error)));
  return {
    mode: 'local',
    read,
    transact(mutate) {
      const run = queue.then(async () => {
        const result = await mutate(read);
        for (const [file, content] of Object.entries(result.files)) await fs.writeFile(resolve(file), content);
        for (const file of result.deletes || []) await fs.rm(resolve(file), { force: true });
        return result;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
}
