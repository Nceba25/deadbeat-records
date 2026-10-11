/* Shared layout, record browsing, product detail, and persistent cart behavior. */
(function () {
  'use strict';

  const records = window.RECORDS || [];
  const collections = window.COLLECTIONS || [];
  const cartStorageKey = 'deadbeat-records-cart';
  let memoryCart = {};

  function formatPrice(amount) {
    return `R ${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function renderShell() {
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');
    if (header) {
      header.innerHTML = `
        <div class="site-header">
          <div class="container header-inner">
            <button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button>
            <a class="brand" href="./index.html" aria-label="Deadbeat Records home">
              <img src="./assets/logo.svg" alt="" onerror="this.hidden=true">
              <span class="brand-wordmark">DEADBEAT<small>RECORDS</small></span>
            </a>
            <nav class="primary-nav" aria-label="Main navigation">
              <a class="nav-link" href="./index.html">Home</a>
              <a class="nav-link" href="./shop.html">Shop</a>
              <details class="collection-menu">
                <summary class="nav-link">Collections</summary>
                <div class="collection-menu-list"></div>
              </details>
              <a class="nav-link" href="./about.html">Our story</a>
            </nav>
            <div class="header-actions">
              <form class="search-form" action="./shop.html" method="get" role="search" aria-label="Search records">
                <input type="search" name="q" placeholder="Search records" aria-label="Search records">
                <button type="submit" aria-label="Submit search">⌕</button>
              </form>
              <a class="cart-link" href="./cart.html" aria-label="Shopping bag, 0 items">Bag <span class="cart-count" aria-live="polite">0</span></a>
            </div>
          </div>
        </div>`;
      const activeLink = header.querySelector(`.nav-link[href="./${currentPage}"]`);
      if (activeLink) activeLink.setAttribute('aria-current', 'page');
      const query = new URLSearchParams(location.search).get('q');
      if (query) header.querySelector('input[name="q"]').value = query;
    }
    if (footer) {
      footer.innerHTML = `
        <div class="site-footer">
          <div class="container">
            <div class="footer-main">
              <div class="footer-brand">
                <a class="brand" href="./index.html" aria-label="Deadbeat Records home">
                  <img src="./assets/logo.svg" alt="" onerror="this.hidden=true">
                  <span class="brand-wordmark">DEADBEAT<small>RECORDS</small></span>
                </a>
                <p>Good records, chosen with care. Find something you’ll keep coming back to.</p>
              </div>
              <div class="footer-column">
                <p class="eyebrow">Explore</p>
                <a href="./shop.html">All records</a>
                <a href="./about.html">Our story</a>
                <a href="./cart.html">Your bag</a>
              </div>
              <div class="footer-column">
                <p class="eyebrow">Find us</p>
                <span>Arts on Main, 264 Fox Street</span>
                <span>Maboneng, Johannesburg, 2094, South Africa</span>
                <span>Opening hours shown in SAST</span>
                <a href="tel:+27115550100">+27 11 555 0100</a>
                <a href="mailto:hello@deadbeatrecords.example">Get in touch</a>
              </div>
            </div>
            <div class="footer-bottom">
              <p>© <span class="current-year"></span> Deadbeat Records</p>
              <p>Concept project. Not a real store. Album artwork belongs to respective owners.</p>
            </div>
          </div>
        </div>`;
      footer.querySelector('.current-year').textContent = new Date().getFullYear();
    }
  }

  function loadCart() {
    let raw;
    try {
      raw = localStorage.getItem(cartStorageKey);
    } catch (error) {
      console.warn('Browser storage is unavailable; this preview cart will not persist between pages.', error);
      return memoryCart;
    }
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('Cart data must be an object.');
      return Object.fromEntries(Object.entries(parsed).filter(function (entry) {
        return records.some(function (record) { return record.id === entry[0]; }) && Number.isInteger(entry[1]) && entry[1] > 0;
      }));
    } catch (error) {
      console.error('Unable to read the saved Deadbeat Records cart.', error);
      return {};
    }
  }

  function saveCart(cart) {
    memoryCart = cart;
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (error) {
      console.warn('Unable to persist the cart in browser storage.', error);
    }
    updateCartCount(cart);
  }

  function updateCartCount(cart) {
    const currentCart = cart || loadCart();
    const count = Object.values(currentCart).reduce(function (sum, quantity) { return sum + quantity; }, 0);
    document.querySelectorAll('.cart-count').forEach(function (element) { element.textContent = String(count); });
    document.querySelectorAll('.cart-link').forEach(function (element) {
      element.setAttribute('aria-label', `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
    });
  }

  function coverMarkup(record, className) {
    return `<div class="record-art ${className || ''}"><img src="${escapeHtml(record.cover)}" alt="${escapeHtml(record.artist)} — ${escapeHtml(record.title)} album cover" loading="lazy" onerror="this.classList.add('is-missing')"></div>`;
  }

  function collectionFor(record) {
    return collections.find(function (collection) { return collection.id === record.collection; });
  }

  function cardMarkup(record, tag) {
    const collection = collectionFor(record);
    return `<article class="record-card">
      <a href="./product.html?id=${encodeURIComponent(record.id)}" aria-label="View ${escapeHtml(record.title)} by ${escapeHtml(record.artist)}">
        ${tag ? `<span class="record-tag">${escapeHtml(tag)}</span>` : ''}
        ${coverMarkup(record)}
        <div class="record-meta">
          <div>${collection ? `<p class="collection-label">${escapeHtml(collection.name)}</p>` : ''}<h3 class="record-title">${escapeHtml(record.title)}</h3><p class="record-artist">${escapeHtml(record.artist)} · ${record.year}</p></div>
          <p class="record-price">${formatPrice(record.price)}</p>
        </div>
      </a>
    </article>`;
  }

  function collectionTileMarkup(collection, index) {
    const representativeRecord = records.find(function (record) { return record.collection === collection.id; });
    return `<a class="collection-tile collection-tone-${index + 1}" href="./shop.html?collection=${encodeURIComponent(collection.id)}">
      ${representativeRecord ? `<span class="collection-tile-art"><img src="${escapeHtml(representativeRecord.cover)}" alt="" loading="lazy" onerror="this.parentElement.hidden=true"></span>` : ''}
      <span class="eyebrow">Collection 0${index + 1}</span>
      <span class="collection-tile-name serif">${escapeHtml(collection.name)}</span>
      <span class="collection-tile-description">${escapeHtml(collection.description)}</span>
      <span class="collection-tile-link">Explore collection <span aria-hidden="true">↗</span></span>
    </a>`;
  }

  function initNavigation() {
    const toggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.primary-nav');
    if (!toggle || !navigation) return;
    const collectionMenu = navigation.querySelector('.collection-menu-list');
    if (collectionMenu) {
      collectionMenu.innerHTML = collections.map(function (collection) {
        return `<a href="./shop.html?collection=${encodeURIComponent(collection.id)}">${escapeHtml(collection.name)}</a>`;
      }).join('');
    }
    toggle.addEventListener('click', function () {
      const isOpen = navigation.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });
  }

  function initHome() {
    const featured = document.getElementById('featured-records');
    const arrivals = document.getElementById('new-arrivals');
    if (featured) featured.innerHTML = records.filter(function (record) { return record.collection === 'staff-picks'; }).map(function (record) { return cardMarkup(record); }).join('');
    if (arrivals) arrivals.innerHTML = records.slice().sort(function (a, b) { return b.year - a.year; }).slice(0, 4).map(function (record) { return cardMarkup(record, 'Just in'); }).join('');
    const collectionTiles = document.getElementById('collection-tiles');
    if (collectionTiles) collectionTiles.innerHTML = collections.map(collectionTileMarkup).join('');
    const spinning = document.getElementById('spinning-record');
    const current = records.find(function (record) { return record.collection === 'midnight-hours'; });
    if (spinning && current) spinning.innerHTML = `${coverMarkup(current, 'spinning-cover')}<div><p class="eyebrow">On the turntable</p><h3 class="serif">${escapeHtml(current.title)}</h3><p>${escapeHtml(current.artist)} · ${current.year}</p><a class="text-link" href="./product.html?id=${encodeURIComponent(current.id)}">Listen closer <span aria-hidden="true">↗</span></a></div>`;
    const newsletter = document.getElementById('newsletter-form');
    if (newsletter) newsletter.addEventListener('submit', function (event) {
      event.preventDefault();
      newsletter.querySelector('.form-status').textContent = 'Thanks for stopping by. This concept signup is a visual demo.';
      newsletter.reset();
    });
  }

  function initShop() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    const collectionFilter = document.getElementById('filter-collection');
    const decade = document.getElementById('filter-decade');
    const condition = document.getElementById('filter-condition');
    const price = document.getElementById('filter-price');
    const priceOutput = document.getElementById('price-output');
    const sort = document.getElementById('sort-records');
    const search = document.querySelector('.header-inner input[name="q"]');
    const results = document.getElementById('results-count');
    collections.forEach(function (collection) {
      const option = document.createElement('option');
      option.value = collection.id;
      option.textContent = collection.name;
      collectionFilter.append(option);
    });
    Array.from(new Set(records.map(function (record) { return Math.floor(record.year / 10) * 10; }))).sort(function (a, b) { return b - a; }).forEach(function (year) {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = `${year}s`;
      decade.append(option);
    });
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query && search) search.value = query;
    const requestedCollection = params.get('collection');
    if (collections.some(function (collection) { return collection.id === requestedCollection; })) collectionFilter.value = requestedCollection;
    const requestedSort = params.get('sort');
    if (requestedSort === 'newest') sort.value = requestedSort;

    function render() {
      const phrase = (search ? search.value : '').trim().toLowerCase();
      const maxPrice = Number(price.value);
      const filtered = records.filter(function (record) {
        const collection = collectionFor(record);
        const searchText = `${record.artist} ${record.title} ${record.genre} ${collection ? `${collection.name} ${collection.description}` : ''} ${record.tags.join(' ')}`.toLowerCase();
        const matchesText = searchText.includes(phrase);
        const matchesDecade = !decade.value || Math.floor(record.year / 10) * 10 === Number(decade.value);
        return matchesText && (!collectionFilter.value || record.collection === collectionFilter.value) && matchesDecade &&
          (!condition.value || record.condition === condition.value) && record.price <= maxPrice;
      });
      if (sort.value === 'price-low') filtered.sort(function (a, b) { return a.price - b.price; });
      if (sort.value === 'price-high') filtered.sort(function (a, b) { return b.price - a.price; });
      if (sort.value === 'newest') filtered.sort(function (a, b) { return b.year - a.year; });
      if (sort.value === 'az') filtered.sort(function (a, b) { return a.title.localeCompare(b.title); });
      results.textContent = `${filtered.length} ${filtered.length === 1 ? 'record' : 'records'}`;
      grid.innerHTML = filtered.length ? filtered.map(function (record) { return cardMarkup(record); }).join('') : '<p class="empty-state">No records match those filters. Try widening your search.</p>';
    }

    [collectionFilter, decade, condition, price, sort].forEach(function (control) { control.addEventListener('input', render); control.addEventListener('change', render); });
    if (search) search.addEventListener('input', render);
    price.addEventListener('input', function () { priceOutput.textContent = formatPrice(price.value); });
    render();
  }

  function initProduct() {
    const root = document.getElementById('product-detail');
    if (!root) return;
    const productId = new URLSearchParams(location.search).get('id');
    const record = records.find(function (item) { return item.id === productId; });
    if (!record) {
      root.innerHTML = '<div class="product-not-found"><p class="eyebrow">Record not found</p><h1 class="serif">This one slipped through the racks.</h1><a class="button button-secondary" href="./shop.html">Browse all records</a></div>';
      return;
    }
    document.title = `${record.artist} — ${record.title} | Deadbeat Records`;
    const collection = collectionFor(record);
    const related = records.filter(function (item) { return item.id !== record.id && item.collection === record.collection; }).slice(0, 4);
    root.innerHTML = `
      <div class="product-layout">
        <div class="product-art">${coverMarkup(record)}</div>
        <div class="product-copy">
          <a class="product-collection-label" href="./shop.html?collection=${encodeURIComponent(record.collection)}">${escapeHtml(collection ? collection.name : 'Record collection')}</a>
          <p class="eyebrow">${escapeHtml(record.genre)} · ${record.year}</p>
          <h1 class="serif">${escapeHtml(record.title)}</h1>
          <p class="product-artist">${escapeHtml(record.artist)}</p>
          <p class="product-price">${formatPrice(record.price)}</p>
          <p class="product-description">${escapeHtml(record.pressing)}</p>
          <dl class="pressing-details">
            <div><dt>Condition</dt><dd>${escapeHtml(record.condition)} · Vinyl & sleeve</dd></div>
            <div><dt>Pressing</dt><dd>${escapeHtml(record.pressing)}</dd></div>
            <div><dt>Format</dt><dd>12″ vinyl · LP</dd></div>
            <div><dt>Availability</dt><dd>${escapeHtml(record.stock)}</dd></div>
          </dl>
          <button class="button add-to-cart" type="button" data-id="${escapeHtml(record.id)}" ${record.stock === 'Sold out' ? 'disabled' : ''}>${record.stock === 'Sold out' ? 'Sold out' : 'Add to bag'} <span aria-hidden="true">↗</span></button>
          <p class="form-status" aria-live="polite"></p>
          <p class="product-description product-note">A considered pick from our ${escapeHtml(collection ? collection.name : 'record')} collection.</p>
        </div>
      </div>
      <section class="section related-section"><div class="section-heading"><div><p class="eyebrow">Keep digging</p><h2>More from ${escapeHtml(collection ? collection.name : 'the collection')}</h2></div></div><div class="record-grid">${related.map(function (item) { return cardMarkup(item); }).join('')}</div></section>`;
  }

  function initCart() {
    const root = document.getElementById('cart-content');
    if (!root) return;

    function render() {
      const cart = loadCart();
      const entries = Object.entries(cart);
      if (!entries.length) {
        root.innerHTML = '<div class="empty-cart"><p class="eyebrow">Nothing in your bag</p><h2 class="serif">The next good record is out there.</h2><a class="button button-secondary" href="./shop.html">Explore the shop</a></div>';
        return;
      }
      const items = entries.map(function (entry) {
        const record = records.find(function (item) { return item.id === entry[0]; });
        return { record: record, quantity: entry[1] };
      }).filter(function (entry) { return entry.record; });
      const subtotal = items.reduce(function (sum, item) { return sum + item.record.price * item.quantity; }, 0);
      root.innerHTML = `
        <div class="cart-layout">
          <div class="cart-items">${items.map(function (item) {
            return `<article class="cart-item" data-id="${escapeHtml(item.record.id)}">
              <a class="cart-cover" href="./product.html?id=${encodeURIComponent(item.record.id)}">${coverMarkup(item.record)}</a>
              <div class="cart-item-info"><p class="eyebrow">${escapeHtml(item.record.artist)}</p><h2 class="serif">${escapeHtml(item.record.title)}</h2><p class="cart-condition">${escapeHtml(item.record.condition)}</p>
                <div class="quantity-control"><button type="button" data-quantity="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity="1" aria-label="Increase quantity">+</button></div>
              </div>
              <div class="cart-item-price"><strong>${formatPrice(item.record.price * item.quantity)}</strong><button class="remove-item" type="button">Remove</button></div>
            </article>`;
          }).join('')}</div>
          <aside class="checkout-panel"><p class="eyebrow">Order summary</p><div class="subtotal"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div><p class="shipping-note">Shipping and taxes calculated at checkout.</p>
            <form id="checkout-form" class="checkout-form">
              <div class="field"><label for="checkout-email">Email address</label><input id="checkout-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
              <div class="field"><label for="checkout-name">Name</label><input id="checkout-name" name="name" autocomplete="name" required></div>
              <button class="button" type="submit">Continue to checkout</button>
              <p class="form-status" aria-live="polite">Visual demo only — no payment will be taken.</p>
            </form>
          </aside>
        </div>`;
      root.querySelectorAll('.cart-item').forEach(function (item) {
        item.querySelectorAll('[data-quantity]').forEach(function (button) {
          button.addEventListener('click', function () {
            const next = loadCart();
            const id = item.dataset.id;
            next[id] = (next[id] || 0) + Number(button.dataset.quantity);
            if (next[id] < 1) delete next[id];
            saveCart(next);
            render();
          });
        });
        item.querySelector('.remove-item').addEventListener('click', function () {
          const next = loadCart();
          delete next[item.dataset.id];
          saveCart(next);
          render();
        });
      });
      root.querySelector('#checkout-form').addEventListener('submit', function (event) {
        event.preventDefault();
        event.currentTarget.querySelector('.form-status').textContent = 'Thanks — checkout is a visual demo and no order was placed.';
      });
    }
    render();
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      form.querySelector('.form-status').textContent = 'Thanks for the note. This concept form does not send messages.';
      form.reset();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderShell();
    initNavigation();
    updateCartCount();
    initHome();
    initShop();
    initProduct();
    initCart();
    initContactForm();
    document.addEventListener('click', function (event) {
      const button = event.target.closest('.add-to-cart');
      if (!button || button.disabled) return;
      const cart = loadCart();
      cart[button.dataset.id] = (cart[button.dataset.id] || 0) + 1;
      saveCart(cart);
      const status = button.parentElement.querySelector('.form-status');
      if (status) status.textContent = 'Added to your bag.';
    });
  });
}());
