'use strict';
    (() => {
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

      /* catalog:start */const PRODUCTS = [
  {
    "id": "girassol",
    "name": "Colar Girassol 3D",
    "group": "biojoias",
    "category": "Biojoia botânica autoral",
    "price": 17990,
    "image": "assets/colar-girassol.jpg",
    "alt": "Colar de girassol amarelo com cordão trançado sobre madeira",
    "description": "A presença do girassol em uma biojoia que guarda a forma e os detalhes da flor. Um pequeno encontro com a natureza para acompanhar os seus dias.",
    "specs": [
      [
        "Cordão",
        "Encerado ajustável, trançado"
      ],
      [
        "Comprimento",
        "80 cm"
      ],
      [
        "Pingente",
        "7 cm"
      ]
    ]
  },
  {
    "id": "cosmos",
    "name": "Colar Flor de Cosmos Laranja",
    "group": "biojoias",
    "category": "Biojoia botânica autoral",
    "price": 12990,
    "image": "assets/colar-cosmos.jpg",
    "alt": "Colar com flor de cosmos laranja e corrente em aço inox",
    "description": "Uma flor de cosmos laranja preservada em sua delicadeza e transformada em colar. Cor e natureza em uma criação autoral.",
    "specs": [
      [
        "Corrente",
        "Aço inox"
      ],
      [
        "Comprimento",
        "45 cm"
      ],
      [
        "Pingente",
        "4 cm"
      ]
    ]
  },
  {
    "id": "orquidea-lilas",
    "name": "Colar Flor de Orquídea Lilás",
    "group": "biojoias",
    "category": "Biojoia botânica autoral",
    "price": 13990,
    "image": "assets/colar-orquidea-lilas.jpg",
    "alt": "Colar de orquídea lilás sobre fundo verde suave",
    "description": "A forma singular da orquídea lilás em uma peça botânica para levar consigo. Cada detalhe celebra a beleza da flor.",
    "specs": [
      [
        "Corrente",
        "Aço inox"
      ],
      [
        "Comprimento",
        "45 cm"
      ],
      [
        "Pingente",
        "4 cm"
      ]
    ]
  },
  {
    "id": "orquidea-translucida",
    "name": "Colar Orquídea Translúcida",
    "group": "biojoias",
    "category": "Biojoia botânica autoral",
    "price": 14999,
    "image": "assets/colar-orquidea-translucida.jpg",
    "alt": "Colar com orquídea translúcida e centro amarelado sobre linho",
    "description": "A delicadeza de uma orquídea translúcida, preservada em uma biojoia de presença suave. Uma criação que revela a flor em seus pequenos detalhes.",
    "specs": [
      [
        "Corrente",
        "Aço inox"
      ],
      [
        "Comprimento",
        "45 cm"
      ],
      [
        "Pingente",
        "5 cm"
      ]
    ]
  },
  {
    "id": "sakura",
    "name": "Conjunto Cerejeira Sakura 3D",
    "group": "biojoias",
    "category": "Biojoia botânica autoral",
    "price": 29000,
    "image": "assets/conjunto-sakura.jpg",
    "alt": "Conjunto de colar e brincos com flores rosadas de cerejeira Sakura",
    "description": "Flores de cerejeira Sakura em um conjunto de colar e brincos. Delicadeza botânica em peças que se encontram na mesma composição.",
    "specs": [
      [
        "Inclui",
        "Colar e par de brincos"
      ],
      [
        "Corrente",
        "Prata 925 · 45 cm"
      ],
      [
        "Brincos",
        "Base tarraxa em prata 925"
      ]
    ]
  },
  {
    "id": "presilha",
    "name": "Presilha com Flores Naturais",
    "group": "acessorios",
    "category": "Acessório botânico",
    "price": 12000,
    "image": "assets/presilha-flores.jpg",
    "alt": "Referência de presilhas com pequenas flores naturais e exemplos de uso no cabelo",
    "description": "Flores naturais diversas em uma presilha delicada para compor o cabelo. A fotografia apresenta referências de composições; o valor corresponde a uma presilha.",
    "specs": [
      [
        "Base",
        "Bico de pato em metal"
      ],
      [
        "Flores",
        "Naturais diversas"
      ],
      [
        "Tamanho",
        "7 cm"
      ],
      [
        "Unidade",
        "1 presilha"
      ]
    ]
  },
  {
    "id": "luminaria",
    "name": "Luminária Cenário de Jardim",
    "group": "decoracao",
    "category": "Decoração botânica",
    "price": 45000,
    "image": "assets/luminaria-jardim.jpg",
    "alt": "Luminária com base em madeira e flores em um pequeno cenário de jardim",
    "description": "Um pequeno cenário de jardim ganha luz e presença em uma peça decorativa botânica. Madeira e elementos naturais em uma composição para habitar os seus espaços.",
    "specs": [
      [
        "Base",
        "Madeira"
      ],
      [
        "Dimensões",
        "30 × 20 cm"
      ]
    ]
  },
  {
    "id": "teste",
    "name": "teste",
    "group": "biojoias",
    "category": "Biojoia botânica autoral",
    "price": 30000,
    "image": "assets/teste-muz0or5x.jpg",
    "alt": "teste",
    "description": "teste",
    "specs": []
  }
];/* catalog:end */
      const productById = new Map(PRODUCTS.map(product => [product.id, product]));

      const WHATSAPP_NUMBER = '555192049433'; // WhatsApp oficial: +55 51 9204-9433
      const STORAGE_KEY = 'cler.boutique.cart.v1';
      const MAX_QUANTITY = 99;
      const normalizeCart = value => {
        if (!Array.isArray(value)) return [];
        const normalized = new Map();
        for (const row of value) {
          if (!row || !productById.has(row.id) || !Number.isSafeInteger(row.quantity) || row.quantity < 1) continue;
          normalized.set(row.id, Math.min(MAX_QUANTITY, (normalized.get(row.id) || 0) + row.quantity));
        }
        return [...normalized].map(([id, quantity]) => ({id, quantity}));
      };
      let cart = [];
      try { cart = normalizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { cart = []; }
      let selectedProduct = null;
      let selectedQuantity = 1;
      let toastTimer;
      let storageWarningShown = false;
      const subtotal = () => cart.reduce((sum, item) => sum + productById.get(item.id).price * item.quantity, 0);
      const itemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

      function showToast(message) {
        const toast = $('#toast');
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
      }
      function saveCart() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
        catch {
          if (!storageWarningShown) {
            storageWarningShown = true;
            showToast('Seu navegador não permitiu salvar a sacola. Ela funciona enquanto esta página estiver aberta.');
          }
        }
        renderCart();
      }

      // Um único diálogo por vez. O <dialog> nativo trata foco, Tab e Escape.
      const dialogOrigins = new WeakMap();
      function openDialog(dialog, origin = document.activeElement) {
        const previouslyOpen = $('dialog[open]');
        const returnTo = previouslyOpen ? (dialogOrigins.get(previouslyOpen) || origin) : origin;
        if (previouslyOpen) previouslyOpen.close();
        dialogOrigins.set(dialog, returnTo);
        dialog.showModal();
        dialog.scrollTop = 0;
        document.body.classList.add('locked');
        $('#open-menu').setAttribute('aria-expanded', String(dialog.id === 'mobile-menu'));
      }
      $$('dialog').forEach(dialog => {
        dialog.addEventListener('close', () => {
          if (!$('dialog[open]')) {
            document.body.classList.remove('locked');
            const origin = dialogOrigins.get(dialog);
            if (origin?.isConnected) origin.focus({preventScroll:true});
          }
          $('#open-menu').setAttribute('aria-expanded', String($('#mobile-menu').open));
        });
        let startedOnBackdrop = false;
        dialog.addEventListener('pointerdown', event => { startedOnBackdrop = event.target === dialog; });
        dialog.addEventListener('click', event => {
          if (event.target !== dialog || !startedOnBackdrop) return;
          const bounds = dialog.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
        });
      });
      document.addEventListener('click', event => {
        const close = event.target.closest('[data-close]');
        if (close) close.closest('dialog').close();
        const gallery = event.target.closest('[data-gallery]');
        if (gallery) {
          $('#lightbox-image').src = gallery.dataset.gallery;
          $('#lightbox-image').alt = gallery.dataset.caption;
          $('#lightbox-caption').textContent = gallery.dataset.caption;
          openDialog($('#gallery-dialog'), gallery);
        }
      });
      $('#open-menu').addEventListener('click', () => openDialog($('#mobile-menu')));
      $$('#mobile-menu a[href^="#"]').forEach(link => link.addEventListener('click', () => $('#mobile-menu').close()));
      $('#open-cart').addEventListener('click', () => { renderCart(); openDialog($('#cart-dialog')); });

      function renderProducts(filter = 'all') {
        const cards = $$('.product-card');
        cards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.group !== filter; });
        $('.collection-invite').hidden = filter !== 'all';
        const count = cards.filter(card => !card.hidden).length;
        $('#collection-count').textContent = `${count} ${count === 1 ? 'criação autoral' : 'criações autorais'}`;
      }
      $$('.filter-btn').forEach(button => button.addEventListener('click', () => {
        $$('.filter-btn').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        renderProducts(button.dataset.filter);
      }));
      $('#products-grid').addEventListener('click', event => {
        const button = event.target.closest('[data-product]');
        if (button) { event.preventDefault(); openProduct(button.dataset.product, button); }
      });
      function updateProductQuantity() {
        $('#detail-quantity').value = selectedQuantity;
        $('#detail-minus').disabled = selectedQuantity <= 1;
        $('#detail-plus').disabled = selectedQuantity >= MAX_QUANTITY;
        setWhatsAppLink($('#buy-now'), productMessage(selectedProduct, selectedQuantity));
      }
      function openProduct(id, origin) {
        selectedProduct = productById.get(id);
        if (!selectedProduct) return;
        selectedQuantity = 1;
        $('#detail-image').src = selectedProduct.image;
        $('#detail-image').alt = selectedProduct.alt;
        $('#detail-category').textContent = selectedProduct.category;
        $('#product-title').textContent = selectedProduct.name;
        $('#detail-price').textContent = money(selectedProduct.price);
        $('#detail-description').textContent = selectedProduct.description;
        $('#detail-specs').innerHTML = selectedProduct.specs.map(([key,value]) => `<div><dt>${escapeHTML(key)}</dt><dd>${escapeHTML(value)}</dd></div>`).join('');
        updateProductQuantity();
        openDialog($('#product-dialog'), origin);
      }
      $('#detail-minus').addEventListener('click', () => { selectedQuantity = Math.max(1, selectedQuantity - 1); updateProductQuantity(); });
      $('#detail-plus').addEventListener('click', () => { selectedQuantity = Math.min(MAX_QUANTITY, selectedQuantity + 1); updateProductQuantity(); });
      function addSelectedProduct() {
        if (!selectedProduct) return false;
        const existing = cart.find(item => item.id === selectedProduct.id);
        if ((existing?.quantity || 0) + selectedQuantity > MAX_QUANTITY) {
          showToast('Para quantidades acima de 99 unidades, converse diretamente com o ateliê.');
          return false;
        }
        if (existing) existing.quantity += selectedQuantity;
        else cart.push({id:selectedProduct.id,quantity:selectedQuantity});
        saveCart();
        return true;
      }
      $('#add-to-cart').addEventListener('click', () => {
        if (!addSelectedProduct()) return;
        openDialog($('#cart-dialog'));
        showToast('Criação adicionada à sua sacola.');
      });

      function renderCart() {
        const count = itemCount();
        $('#bag-count').textContent = count;
        $('#open-cart').setAttribute('aria-label', `Abrir sacola, ${count} ${count === 1 ? 'item' : 'itens'}`);
        $('#cart-subtotal').textContent = money(subtotal());
        updateCartLink();
        $('#cart-footer').hidden = cart.length === 0;
        if (!cart.length) {
          $('#cart-items').innerHTML = '<div class="cart-empty"><span class="icon icon-bag" aria-hidden="true"></span><h3>Sua próxima história<br>ainda está por aqui.</h3><p>Explore as criações botânicas e encontre aquela que conversa com você.</p><button class="btn btn-outline" id="empty-browse">Conhecer as criações</button></div>';
          $('#empty-browse').addEventListener('click', () => { $('#cart-dialog').close(); $('#colecoes').scrollIntoView({behavior:scrollBehavior()}); });
          return;
        }
        $('#cart-items').innerHTML = cart.map(item => {
          const product = productById.get(item.id);
          return `<article class="cart-item"><img src="${product.image}" alt="${escapeHTML(product.alt)}"><div><h3>${product.name}</h3><span class="cart-item-price">${money(product.price * item.quantity)}${item.quantity > 1 ? ` <span class="muted">(${money(product.price)} un.)</span>` : ''}</span><div class="cart-item-actions"><div class="quantity-control"><button data-cart-action="decrease" data-id="${item.id}" aria-label="Diminuir quantidade de ${escapeHTML(product.name)}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button><output aria-label="Quantidade de ${escapeHTML(product.name)}">${item.quantity}</output><button data-cart-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade de ${escapeHTML(product.name)}" ${item.quantity >= MAX_QUANTITY ? 'disabled' : ''}>+</button></div><button class="remove-item" data-cart-action="remove" data-id="${item.id}" aria-label="Remover ${escapeHTML(product.name)} da sacola">Remover</button></div></div></article>`;
        }).join('');
      }
      $('#cart-items').addEventListener('click', event => {
        const button = event.target.closest('[data-cart-action]');
        if (!button) return;
        const item = cart.find(row => row.id === button.dataset.id);
        if (!item) return;
        const action = button.dataset.cartAction;
        const id = item.id;
        if (action === 'remove') cart = cart.filter(row => row.id !== id);
        if (action === 'increase') item.quantity = Math.min(MAX_QUANTITY, item.quantity + 1);
        if (action === 'decrease') item.quantity = Math.max(1, item.quantity - 1);
        saveCart();
        const replacement = $(`[data-id="${id}"][data-cart-action="${action}"]:not(:disabled)`)
          || $(`[data-id="${id}"][data-cart-action]:not(:disabled)`)
          || $('#cart-items button') || $('#cart-dialog [data-close]');
        replacement?.focus({preventScroll:true});
      });


      function whatsappURL(message) {
        return /^55[1-9][0-9]{9,10}$/.test(WHATSAPP_NUMBER)
          ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}` : '';
      }
      function setWhatsAppLink(link, message) {
        const url = whatsappURL(message);
        link.href = url || '#contato';
        link.dataset.whatsappReady = String(Boolean(url));
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      function productMessage(product, quantity) {
        return `Olá, Cler! Gostaria de consultar esta criação:\n\n${quantity} × ${product.name} — ${money(product.price)} por unidade\nSubtotal: ${money(product.price * quantity)}\n\nPodem confirmar a disponibilidade, o frete e as formas de pagamento?`;
      }
      function updateCartLink() {
        const lines = cart.map(item => {
          const product = productById.get(item.id);
          return `${item.quantity} × ${product.name} — ${money(product.price)} por unidade — ${money(product.price * item.quantity)}`;
        });
        setWhatsAppLink($('#request-cart'), `Olá, Cler! Gostaria de consultar as criações da minha sacola:\n\n${lines.join('\n')}\n\nSubtotal dos produtos: ${money(subtotal())}\nFrete não incluído.\n\nPodem confirmar a disponibilidade, o frete e as formas de pagamento?`);
      }
      $$('[data-whatsapp]').forEach(link => setWhatsAppLink(link, `Olá, Cler! Gostaria de conversar sobre: ${link.dataset.whatsapp}.`));
      document.addEventListener('click', event => {
        const link = event.target.closest('[data-whatsapp-ready="false"]');
        if (link && !link.hasAttribute('data-product')) {
          event.preventDefault();
          showToast('O contato do ateliê estará disponível em breve.');
        }
      });
      window.addEventListener('storage', event => {
        if (event.storageArea !== localStorage || (event.key !== STORAGE_KEY && event.key !== null)) return;
        try { cart = normalizeCart(JSON.parse(event.newValue || '[]')); } catch { cart = []; }
        renderCart();
      });
      function scrollBehavior() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }
      const updateHeader = () => $('#site-header').classList.toggle('scrolled', window.scrollY > 20);
      window.addEventListener('scroll', updateHeader, {passive:true});
      updateHeader();
      renderProducts();
      renderCart();
      $('#open-menu').hidden = false;
      $('#open-cart').hidden = false;
      $('.collection-tools').hidden = false;
      $$('[data-product]').forEach(link => { link.setAttribute('aria-haspopup', 'dialog'); link.setAttribute('aria-label', `Ver detalhes de ${productById.get(link.dataset.product).name}`); });
    })();
