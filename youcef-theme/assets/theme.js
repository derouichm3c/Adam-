(function () {
  'use strict';
  var T = window.Theme || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Money ---------- */
  function money(cents) {
    cents = Math.round(Number(cents) || 0);
    var fmt = T.moneyFormat || '${{amount}}';
    function delimit(n, prec, thou, dec) {
      var parts = (n / 100).toFixed(prec).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thou);
      return parts.join(dec);
    }
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, key) {
      switch (key) {
        case 'amount_no_decimals': return delimit(cents, 0, ',', '.');
        case 'amount_with_comma_separator': return delimit(cents, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return delimit(cents, 0, '.', ',');
        case 'amount_with_apostrophe_separator': return delimit(cents, 2, "'", '.');
        default: return delimit(cents, 2, ',', '.');
      }
    });
  }

  /* ---------- Mobile nav ---------- */
  var nav = $('#mobileNav');
  $$('[data-open-nav]').forEach(function (b) { b.addEventListener('click', function () { nav && nav.classList.add('is-open'); }); });
  $$('[data-close-nav]').forEach(function (b) { b.addEventListener('click', function () { nav && nav.classList.remove('is-open'); }); });
  $$('#mobileNav a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('is-open'); }); });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Cart drawer ---------- */
  var drawer = $('#cartDrawer');
  function openDrawer() { if (!drawer) return; drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { if (!drawer) return; drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  $$('[data-close-drawer]').forEach(function (b) { b.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); nav && nav.classList.remove('is-open'); } });
  $$('[data-open-drawer]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (document.body.classList.contains('template-cart')) return;
      e.preventDefault(); refreshCart().then(openDrawer);
    });
  });

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  function renderCart(cart) {
    $$('[data-cart-count]').forEach(function (el) { el.textContent = cart.item_count; el.setAttribute('data-count', cart.item_count); });
    var items = $('#drawerItems'), foot = $('#drawerFoot');
    if (!items) return;
    if (!cart.item_count) {
      items.innerHTML = '<div class="drawer__empty">Your cart is empty.</div>';
      foot.hidden = true;
    } else {
      items.innerHTML = cart.items.map(function (it, i) {
        var img = it.image ? it.image.replace(/(\.[a-z]+)(\?|$)/i, '_200x$1$2') : '';
        var variant = it.variant_title && it.variant_title !== 'Default Title' ? '<div class="line__variant">' + esc(it.variant_title) + '</div>' : '';
        var was = it.original_line_price > it.final_line_price ? '<s>' + money(it.original_line_price) + '</s>' : '';
        return '<div class="line">' +
          (img ? '<img src="' + img + '" alt="" width="76" height="76" loading="lazy">' : '<span></span>') +
          '<div><div class="line__title">' + esc(it.product_title) + '</div>' + variant +
          '<div class="qty"><button type="button" aria-label="Decrease" data-line="' + (i + 1) + '" data-q="' + (it.quantity - 1) + '">&minus;</button><span>' + it.quantity + '</span><button type="button" aria-label="Increase" data-line="' + (i + 1) + '" data-q="' + (it.quantity + 1) + '">+</button></div></div>' +
          '<div class="line__price">' + was + money(it.final_line_price) + '</div></div>';
      }).join('');
      foot.hidden = false;
      $('#drawerTotal').textContent = money(cart.total_price);
      var saveRow = $('#drawerSaveRow');
      if (saveRow) {
        saveRow.hidden = !(cart.total_discount > 0);
        $('#drawerSave').textContent = '-' + money(cart.total_discount);
      }
    }
    var fill = $('#shipBarFill'), txt = $('#shipBarText');
    if (fill && T.freeShipping > 0) {
      var left = T.freeShipping - cart.total_price;
      fill.style.width = Math.min(100, (cart.total_price / T.freeShipping) * 100) + '%';
      txt.innerHTML = left > 0 ? 'You are <strong>' + money(left) + '</strong> away from free shipping' : '&#127881; You unlocked <strong>free shipping</strong>!';
    }
  }

  function refreshCart() {
    return fetch(T.routes.cart, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); }).then(function (c) { renderCart(c); return c; })
      .catch(function () {});
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-line]');
    if (!b) return;
    b.disabled = true;
    fetch(T.routes.cartChange, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: Number(b.dataset.line), quantity: Math.max(0, Number(b.dataset.q)) })
    }).then(function (r) { return r.json(); }).then(renderCart).catch(function () { b.disabled = false; });
  });

  /* ---------- Product ---------- */
  var section = $('[data-product-section]');
  if (!section) return;
  var jsonEl = $('[data-product-json]', section);
  var product = jsonEl ? JSON.parse(jsonEl.textContent) : null;
  var form = $('[data-product-form]', section);
  var idInput = $('[data-variant-id]', section);
  var qtyInput = $('[data-quantity]', section);
  var atc = $('[data-atc]', section);
  var atcLabel = $('[data-atc-label]', section);
  var atcText = atcLabel ? atcLabel.textContent : 'Add to cart';
  var current = product ? (product.variants.find(function (v) { return String(v.id) === String(idInput.value); }) || product.variants[0]) : null;

  // Gallery
  var mainImg = $('[data-gallery-main]', section);
  var thumbs = $$('[data-thumb]', section);
  var activeIndex = Math.max(0, thumbs.findIndex(function (t) { return t.classList.contains('is-active'); }));
  function showImage(i) {
    if (!thumbs.length || !mainImg) return;
    activeIndex = (i + thumbs.length) % thumbs.length;
    var t = thumbs[activeIndex];
    mainImg.src = t.dataset.src; mainImg.alt = t.dataset.alt;
    thumbs.forEach(function (x) { x.classList.toggle('is-active', x === t); });
    t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
  thumbs.forEach(function (t, i) { t.addEventListener('click', function () { showImage(i); }); });
  var prev = $('[data-gallery-prev]', section), next = $('[data-gallery-next]', section);
  prev && prev.addEventListener('click', function () { showImage(activeIndex - 1); });
  next && next.addEventListener('click', function () { showImage(activeIndex + 1); });
  // swipe
  var gMain = $('.gallery__main', section), sx = null;
  if (gMain) {
    gMain.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    gMain.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) showImage(activeIndex + (dx < 0 ? 1 : -1)); sx = null;
    });
  }

  // Offers
  var offers = $$('[data-offer]', section);
  function selectedOffer() {
    var o = offers.find(function (x) { return x.classList.contains('is-selected'); });
    return o ? { qty: Number(o.dataset.qty), pct: Number(o.dataset.pct) } : { qty: 1, pct: 0 };
  }
  offers.forEach(function (o) {
    o.addEventListener('click', function () {
      offers.forEach(function (x) { x.classList.toggle('is-selected', x === o); });
      $('input', o).checked = true;
      updatePrices();
    });
  });

  function updatePrices() {
    if (!current) return;
    var off = selectedOffer();
    qtyInput.value = off.qty;
    var price = current.price, compare = current.compare_at_price || 0;
    var total = Math.round(price * off.qty * (100 - off.pct) / 100);
    var was = Math.max(compare * off.qty, price * off.qty);

    var pEl = $('[data-price]', section), cEl = $('[data-compare]', section), sEl = $('[data-save]', section);
    pEl.textContent = money(total);
    if (was > total) { cEl.hidden = false; cEl.textContent = money(was); sEl.hidden = false; sEl.textContent = 'You save ' + money(was - total); }
    else { cEl.hidden = true; sEl.hidden = true; }

    var badge = $('[data-sale-badge]', section);
    if (badge) {
      if (compare > price) { badge.hidden = false; badge.textContent = 'Save ' + Math.round((compare - price) * 100 / compare) + '%'; }
      else badge.hidden = true;
    }

    offers.forEach(function (o) {
      var q = Number(o.dataset.qty), pct = Number(o.dataset.pct);
      var t = Math.round(price * q * (100 - pct) / 100), w = Math.max(compare * q, price * q);
      $('[data-offer-price]', o).textContent = money(t);
      var we = $('[data-offer-was]', o);
      if (w > t) { we.hidden = false; we.textContent = money(w); } else we.hidden = true;
    });

    var sp = $('[data-sticky-price]'); if (sp) sp.textContent = money(total);
    atc.disabled = !current.available;
    atcLabel.textContent = current.available ? atcText : 'Sold out';
  }

  // Variants
  var optionGroups = $$('[data-option-index]', section);
  function selectedOptions() {
    return optionGroups.map(function (g) { var c = $('input:checked', g); return c ? c.value : null; });
  }
  function markAvailability() {
    var sel = selectedOptions();
    optionGroups.forEach(function (g, gi) {
      $$('input', g).forEach(function (inp) {
        var test = sel.slice(); test[gi] = inp.value;
        var ok = product.variants.some(function (v) {
          return v.available && v.options.every(function (o, k) { return o === test[k]; });
        });
        var lbl = $('label[for="' + inp.id + '"]', g);
        if (lbl) lbl.classList.toggle('is-unavailable', !ok);
      });
    });
  }
  optionGroups.forEach(function (g) {
    g.addEventListener('change', function () {
      var sel = selectedOptions();
      var c = $('input:checked', g); var lab = $('[data-option-selected]', g); if (lab && c) lab.textContent = c.value;
      var v = product.variants.find(function (x) { return x.options.every(function (o, k) { return o === sel[k]; }); });
      if (!v) { atc.disabled = true; atcLabel.textContent = 'Unavailable'; return; }
      current = v; idInput.value = v.id;
      if (v.featured_image) {
        var idx = thumbs.findIndex(function (t) { return t.dataset.imageId === String(v.featured_image.id); });
        if (idx > -1) showImage(idx);
      }
      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href); url.searchParams.set('variant', v.id); window.history.replaceState({}, '', url);
      }
      markAvailability();
      updatePrices();
    });
  });
  // "Shop by colour" cards select the matching colour on the product
  $$('[data-select-colour]').forEach(function (card) {
    card.addEventListener('click', function () {
      var name = (card.dataset.selectColour || '').trim().toLowerCase();
      optionGroups.forEach(function (g) {
        $$('input', g).forEach(function (inp) {
          if (inp.value.trim().toLowerCase() === name && !inp.checked) {
            inp.checked = true;
            g.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    });
  });

  if (product && optionGroups.length) markAvailability();
  updatePrices();

  // Add to cart
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!current) return;
      e.preventDefault();
      atc.disabled = true; atcLabel.textContent = 'Adding…';
      fetch(T.routes.cartAdd, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(idInput.value), quantity: Number(qtyInput.value) || 1 }] })
      }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); })
        .then(function () { return refreshCart(); })
        .then(function () { atcLabel.textContent = atcText; atc.disabled = false; openDrawer(); })
        .catch(function (err) {
          atcLabel.textContent = (err && err.description) ? err.description : 'Something went wrong';
          setTimeout(function () { atcLabel.textContent = atcText; atc.disabled = !current.available; }, 2600);
        });
    });
  }

  // Sticky ATC
  var sticky = $('[data-sticky-atc]');
  if (sticky && atc && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      var show = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      sticky.classList.toggle('is-visible', show); sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
    }).observe(atc);
    $('[data-sticky-btn]', sticky).addEventListener('click', function () {
      if (form && form.requestSubmit) form.requestSubmit(); else atc.click();
    });
  }

  // Delivery estimate
  var del = $('[data-delivery]', section);
  if (del) {
    var addBiz = function (d, n) { d = new Date(d); while (n > 0) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) n--; } return d; };
    var f = function (d) { return d.toLocaleDateString(document.documentElement.lang || 'en', { month: 'short', day: 'numeric' }); };
    var now = new Date();
    $('[data-delivery-range]', del).textContent = f(addBiz(now, Number(del.dataset.min))) + ' – ' + f(addBiz(now, Number(del.dataset.max)));
  }
})();
