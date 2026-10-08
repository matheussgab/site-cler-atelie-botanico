'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const API = '/api/admin';
  const MAX_SIDE = 1600;

  let products = [];
  let groups = {};
  let editing = null;   // produto em edição; null = novo
  let photo = null;     // { data, url } da foto escolhida, ainda não enviada
  let busy = false;
  const localPreviews = new Map(); // fotos recém-enviadas, até a Vercel publicar

  const formatPrice = cents => `R$ ${Math.floor(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${String(cents % 100).padStart(2, '0')}`;
  const priceInput = cents => `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;

  // Aceita "179,90", "179.90", "R$ 1.234,50", "180".
  function parsePrice(value) {
    let clean = value.replace(/R\$|\s/g, '');
    if (clean.includes(',')) clean = clean.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) clean = clean.replace(/\./g, '');
    if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
    const cents = Math.round(Number(clean) * 100);
    return cents > 0 ? cents : null;
  }

  async function request(method, body) {
    const response = await fetch(API, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json', 'X-Requested-With': 'cler-admin' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({ error: 'Resposta inesperada do servidor.' }));
    if (response.status === 401 && body?.op !== 'login') showLogin(data.error);
    if (!response.ok) throw Object.assign(new Error(data.error || 'Erro inesperado.'), { status: response.status });
    return data;
  }

  function show(view) {
    $('#loading').hidden = true;
    $('#login-view').hidden = view !== 'login';
    $('#list-view').hidden = view !== 'list';
    $('#logout').hidden = view !== 'list';
  }

  function showLogin(message = '') {
    if ($('#editor').open) $('#editor').close();
    show('login');
    $('#login-error').textContent = message === 'Entre com a senha.' ? '' : message;
    $('#password').focus();
  }

  function setStatus(message, isError = false) {
    $('#status').textContent = message;
    $('#status').classList.toggle('is-error', isError);
  }

  function setBusy(value) {
    busy = value;
    document.querySelectorAll('#editor button, #new-product').forEach(button => { button.disabled = value; });
    $('#save').textContent = value ? 'Publicando…' : 'Salvar e publicar';
    renderList();
  }

  async function load() {
    try {
      const data = await request('GET');
      products = data.products;
      groups = data.groups;
      $('#mode-note').hidden = data.mode !== 'local';
      $('#mode-note').textContent = 'Modo local: as alterações ficam só neste computador até você fazer commit e push.';
      renderGroups();
      renderList();
      show('list');
    } catch (error) {
      if (error.status !== 401) { show('login'); $('#login-error').textContent = error.message; }
    }
  }

  function thumb(product) {
    const box = document.createElement('div');
    box.className = 'thumb';
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.src = localPreviews.get(product.image) || `/${product.image}`;
    img.addEventListener('error', () => { box.textContent = 'Foto em publicação'; }, { once: true });
    box.append(img);
    return box;
  }

  function button(label, className, onClick, ariaLabel) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.textContent = label;
    if (ariaLabel) element.setAttribute('aria-label', ariaLabel);
    element.disabled = busy;
    element.addEventListener('click', onClick);
    return element;
  }

  function renderList() {
    const list = $('#product-list');
    list.replaceChildren();
    $('#list-count').textContent = `${products.length} ${products.length === 1 ? 'produto publicado' : 'produtos publicados'} no site`;
    $('#empty').hidden = products.length > 0;
    products.forEach((product, index) => {
      const item = document.createElement('li');
      item.className = 'product-item';
      const info = document.createElement('div');
      info.className = 'product-info';
      const name = document.createElement('strong');
      name.textContent = product.name;
      const meta = document.createElement('span');
      meta.textContent = `${groups[product.group]?.label || product.group} · ${product.category}`;
      const price = document.createElement('span');
      price.className = 'price';
      price.textContent = formatPrice(product.price);
      info.append(name, meta, price);

      const actions = document.createElement('div');
      actions.className = 'item-actions';
      const up = button('↑', 'icon-btn', () => move(index, -1), `Mover ${product.name} para cima`);
      const down = button('↓', 'icon-btn', () => move(index, 1), `Mover ${product.name} para baixo`);
      up.disabled ||= index === 0;
      down.disabled ||= index === products.length - 1;
      actions.append(up, down,
        button('Editar', 'btn btn-outline', () => openEditor(product)),
        button('Remover', 'link danger', () => removeProduct(product)));
      item.append(thumb(product), info, actions);
      list.append(item);
    });
  }

  function renderGroups() {
    $('#f-group').replaceChildren(...Object.entries(groups).map(([value, group]) => new Option(group.label, value)));
  }

  function addSpecRow([label, value] = ['', '']) {
    const row = $('#spec-row').content.firstElementChild.cloneNode(true);
    row.querySelector('.spec-label').value = label;
    row.querySelector('.spec-value').value = value;
    $('#specs-list').append(row);
    $('#add-spec').hidden = $('#specs-list').children.length >= 10;
    return row;
  }

  function setPhotoPreview(url) {
    $('#photo-preview').hidden = !url;
    $('#photo-empty').hidden = Boolean(url);
    if (url) $('#photo-preview').src = url;
    else $('#photo-preview').removeAttribute('src');
  }

  function openEditor(product = null) {
    editing = product;
    photo = null;
    $('#product-form').reset();
    $('#form-error').textContent = '';
    $('#editor-title').textContent = product ? 'Editar produto' : 'Novo produto';
    $('#specs-list').replaceChildren();
    const group = product?.group || Object.keys(groups)[0];
    $('#f-name').value = product?.name || '';
    $('#f-group').value = group;
    $('#f-group').dataset.previous = group;
    $('#f-category').value = product?.category || groups[group].category;
    $('#f-price').value = product ? priceInput(product.price) : '';
    $('#f-description').value = product?.description || '';
    $('#f-alt').value = product?.alt || '';
    (product?.specs.length ? product.specs : [['', '']]).forEach(spec => addSpecRow(spec));
    setPhotoPreview(product ? (localPreviews.get(product.image) || `/${product.image}`) : null);
    document.body.classList.add('locked');
    $('#editor').showModal();
    $('#f-name').focus();
  }

  function closeEditor() {
    if (busy) return;
    $('#editor').close();
  }

  // Reduz a foto para no máximo 1600 px e converte para JPG antes de enviar.
  async function preparePhoto(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = '#fcfaf5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const url = canvas.toDataURL('image/jpeg', 0.86);
    return { url, data: url.slice(url.indexOf(',') + 1) };
  }

  function readForm() {
    const price = parsePrice($('#f-price').value);
    if (!price) throw new Error('Informe o preço no formato 179,90.');
    const specs = [...$('#specs-list').children]
      .map(row => [row.querySelector('.spec-label').value.trim(), row.querySelector('.spec-value').value.trim()])
      .filter(([label, value]) => label || value);
    if (specs.some(([label, value]) => !label || !value)) throw new Error('Cada especificação precisa de nome e valor.');
    const fields = { name: '#f-name', category: '#f-category', description: '#f-description', alt: '#f-alt' };
    for (const [key, selector] of Object.entries(fields)) {
      if (!$(selector).value.trim()) {
        $(selector).focus();
        throw new Error(`Preencha o campo “${$(selector).closest('label').querySelector('span').textContent}”.`);
      }
    }
    if (!editing && !photo) throw new Error('Escolha uma foto do produto.');
    return {
      id: editing?.id || '',
      name: $('#f-name').value,
      group: $('#f-group').value,
      category: $('#f-category').value,
      price,
      description: $('#f-description').value,
      alt: $('#f-alt').value,
      specs,
    };
  }

  async function mutate(body, success) {
    setBusy(true);
    setStatus('Publicando…');
    try {
      const data = await request('POST', body);
      products = data.products;
      setStatus(`${success} ${data.notice}`);
      return true;
    } catch (error) {
      if (error.status !== 401) setStatus(error.message, true);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (busy) return;
    $('#form-error').textContent = '';
    let product;
    try { product = readForm(); } catch (error) { $('#form-error').textContent = error.message; return; }
    const before = new Set(products.map(item => item.image));
    try {
      await mutate({ op: 'save', product, image: photo ? { data: photo.data } : null }, `“${product.name.trim()}” salvo.`);
      const saved = products.find(item => !before.has(item.image));
      if (photo && saved) localPreviews.set(saved.image, photo.url);
      renderList();
      $('#editor').close();
    } catch (error) {
      if (error.status !== 401) $('#form-error').textContent = error.message;
    }
  }

  async function removeProduct(product) {
    if (busy || !confirm(`Remover “${product.name}” do site?\n\nO produto sai do catálogo e da sacola de quem já tinha adicionado.`)) return;
    await mutate({ op: 'delete', id: product.id }, `“${product.name}” removido.`).catch(() => {});
  }

  async function move(index, offset) {
    if (busy) return;
    const ids = products.map(product => product.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    await mutate({ op: 'reorder', ids }, 'Ordem atualizada.').catch(() => {});
  }

  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = event.submitter || $('#login-form button');
    submit.disabled = true;
    $('#login-error').textContent = '';
    try {
      await request('POST', { op: 'login', password: $('#password').value });
      $('#password').value = '';
      await load();
    } catch (error) {
      $('#login-error').textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  $('#logout').addEventListener('click', async () => {
    await request('POST', { op: 'logout' }).catch(() => {});
    showLogin();
  });

  $('#new-product').addEventListener('click', () => openEditor());
  $('#add-spec').addEventListener('click', () => addSpecRow().querySelector('input').focus());
  $('#specs-list').addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-spec]');
    if (!remove) return;
    remove.closest('.spec-row').remove();
    $('#add-spec').hidden = false;
  });
  $('#f-group').addEventListener('change', () => {
    const previous = groups[$('#f-group').dataset.previous]?.category;
    if (!$('#f-category').value.trim() || $('#f-category').value === previous) $('#f-category').value = groups[$('#f-group').value].category;
    $('#f-group').dataset.previous = $('#f-group').value;
  });
  $('#photo-input').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    $('#form-error').textContent = '';
    try {
      photo = await preparePhoto(file);
      setPhotoPreview(photo.url);
    } catch {
      photo = null;
      $('#form-error').textContent = 'Não foi possível ler essa imagem. Envie em JPG ou PNG.';
    }
  });
  $('#product-form').addEventListener('submit', saveProduct);
  document.querySelectorAll('[data-close]').forEach(element => element.addEventListener('click', closeEditor));
  $('#editor').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  $('#editor').addEventListener('close', () => document.body.classList.remove('locked'));

  load();
})();
