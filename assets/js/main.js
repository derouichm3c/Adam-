/* ============================================================
   LumySmile — storefront logic
   Product data mirrors the live Shopify catalogue. "Add to cart"
   builds a real Shopify cart permalink so checkout is functional.
   ============================================================ */

(function () {
  "use strict";

  // --- Store config -------------------------------------------------
  var STORE_DOMAIN = "lumysmile.com";        // Shopify checkout domain
  var CURRENCY = "$";
  var FREE_SHIP_THRESHOLD = 50;              // CAD
  var CDN = "https://cdn.shopify.com/s/files/1/0832/7469/4871/files/";

  // --- Product catalogue (source of truth: Shopify Admin API) -------
  var PRODUCTS = [
    {
      id: "strips",
      variantId: "49423294529751",
      title: "Whitening Strips",
      fullTitle: "Teeth Whitening Strips — Peroxide-Free, Enamel-Safe",
      tagline: "A brighter smile in as little as 7 days.",
      price: 19.99,
      badge: "Bestseller",
      rating: "4.8",
      reviews: 214,
      images: [CDN + "hf_20260715_223633_b46fd102-9d99-4eaf-aac3-310267517f9d.png?v=1784156518", CDN + "hf_20260715_224935_4a4a43c6-6220-4440-8a71-ee12da555b68.png?v=1784156518", CDN + "hf_20260715_223930_a5c7983e-924c-4afb-a82b-08f1ab775f01.png?v=1784156518"],
      desc:
        "<p>Get the confidence of professional-level whitening at home — without the sensitivity, the mess, or the dentist's price tag. Our peroxide-free strips lift years of stains gently and safely.</p>" +
        "<ul>" +
        "<li><strong>Peroxide-free formula</strong> — visible whitening with far less zing.</li>" +
        "<li><strong>Enamel-safe &amp; gum-friendly</strong> — brightens without damage.</li>" +
        "<li><strong>No-slip grip</strong> — stays put while you work or relax.</li>" +
        "<li><strong>Just 30 minutes a day</strong> — 14 treatments per pack.</li>" +
        "</ul>"
    },
    {
      id: "toothpaste",
      variantId: "49423294562519",
      title: "Charcoal Toothpaste",
      fullTitle: "Charcoal Toothpaste — Natural Whitening, Fluoride-Free & Gentle",
      tagline: "A whiter smile, the natural way.",
      price: 24.99,
      badge: "Natural",
      rating: "4.9",
      reviews: 168,
      images: [CDN + "hf_20260715_224932_5dece692-f68e-402d-878d-104f269ed580.png?v=1784156518", CDN + "hf_20260715_222940_5f10d2c7-7b73-4670-985e-c87f31b23900.png?v=1784156517", CDN + "hf_20260715_223927_35862cba-4e19-4ea1-b8e6-4079e46e8f65.png?v=1784156518"],
      desc:
        "<p>Activated charcoal has been used for centuries to purify and cleanse. Our charcoal toothpaste harnesses it to gently lift everyday stains — coffee, tea, wine — without harsh chemicals.</p>" +
        "<ul>" +
        "<li><strong>Activated coconut charcoal</strong> — naturally lifts surface stains.</li>" +
        "<li><strong>Gentle, low-abrasion formula</strong> — whitens without stripping enamel.</li>" +
        "<li><strong>Fresh, clean finish</strong> — a mild, genuinely refreshing mint.</li>" +
        "<li><strong>Free from harsh additives</strong> — no artificial dyes.</li>" +
        "</ul>"
    },
    {
      id: "toothbrush",
      variantId: "49423294595287",
      title: "Bamboo Toothbrush 4-Pack",
      fullTitle: "Bamboo Toothbrush 4-Pack — Charcoal Bristles, Biodegradable",
      tagline: "Sustainable brushing, naturally brighter teeth.",
      price: 39.99,
      badge: "Eco",
      rating: "4.7",
      reviews: 96,
      images: [CDN + "hf_20260715_225801_42d0920b-0b3d-40d9-bdfb-1b9367f2b2d9.png?v=1784156518", CDN + "hf_20260715_223143_71d9dc5b-0029-48a7-b8ea-91c34fb67587.png?v=1784156518", CDN + "hf_20260715_223145_a4580b7a-89d3-4d93-9b68-78177cfb779b.png?v=1784156518"],
      desc:
        "<p>Ditch the plastic. Our bamboo toothbrush 4-pack pairs a smooth, biodegradable handle with charcoal-infused bristles — a clean that's gentle on the planet and brightens over time.</p>" +
        "<ul>" +
        "<li><strong>Charcoal-infused bristles</strong> — help lift stains and polish enamel.</li>" +
        "<li><strong>100% biodegradable handle</strong> — back to the earth in months.</li>" +
        "<li><strong>BPA-free &amp; vegan</strong> — no plastic, no synthetic fillers.</li>" +
        "<li><strong>Pack of 4</strong> — a full season of eco-friendly brushing.</li>" +
        "</ul>"
    },
    {
      id: "bundle",
      variantId: "49423977808087",
      title: "The Complete Smile Bundle",
      fullTitle: "The Complete Smile Bundle",
      tagline: "Everything for a brighter smile — save $25.",
      price: 59.99,
      compareAt: 84.97,
      badge: "Best value",
      rating: "5.0",
      reviews: 87,
      images: [CDN + "hf_20260715_223635_9b74b804-7c00-4c2a-a8ed-f8a5a52f23e1.png?v=1784156518", CDN + "hf_20260715_223149_cf584903-a644-4851-8278-624b41ef20ec.png?v=1784156518", CDN + "hf_20260715_224640_429e08a3-e015-4bec-8aaa-52b2f32d9654.png?v=1784156518"],
      desc:
        "<p>Our three best-sellers together, at a better price than buying separately. One box, one routine, a brighter smile.</p>" +
        "<ul>" +
        "<li><strong>Bamboo Toothbrush 4-Pack</strong> — charcoal bristles, biodegradable.</li>" +
        "<li><strong>Charcoal Toothpaste</strong> — natural whitening, fluoride-free.</li>" +
        "<li><strong>Whitening Strips</strong> — peroxide-free, results in days.</li>" +
        "</ul>"
    }
  ];

  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  // --- Helpers ------------------------------------------------------
  function money(n) { return CURRENCY + n.toFixed(2); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // --- Cart state ---------------------------------------------------
  var cart = {};  // { productId: qty }
  try {
    var saved = localStorage.getItem("lumysmile_cart");
    if (saved) cart = JSON.parse(saved) || {};
  } catch (e) { cart = {}; }

  function persist() {
    try { localStorage.setItem("lumysmile_cart", JSON.stringify(cart)); } catch (e) {}
  }

  function cartCount() {
    return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0);
  }
  function cartSubtotal() {
    return Object.keys(cart).reduce(function (s, id) {
      return byId[id] ? s + byId[id].price * cart[id] : s;
    }, 0);
  }

  function addToCart(id, qty) {
    if (!byId[id]) return;
    cart[id] = (cart[id] || 0) + (qty || 1);
    persist();
    renderCart();
    bumpCount();
    showToast(byId[id].title + " added to cart");
  }
  function setQty(id, qty) {
    if (qty <= 0) { delete cart[id]; }
    else { cart[id] = qty; }
    persist();
    renderCart();
  }

  // --- Header count -------------------------------------------------
  var cartCountEl = $("#cartCount");
  function bumpCount() {
    var n = cartCount();
    cartCountEl.textContent = n;
    cartCountEl.classList.toggle("is-visible", n > 0);
  }

  // --- Toast --------------------------------------------------------
  var toastEl = $("#toast");
  var toastTimer;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2400);
  }

  // --- Render product grid -----------------------------------------
  function starString(rating) {
    return "★★★★★";
  }
  function renderGrid() {
    var grid = $("#productGrid");
    if (!grid) return;
    var frag = document.createDocumentFragment();
    PRODUCTS.forEach(function (p) {
      var card = el("article", "card");
      var priceHtml = p.compareAt
        ? '<span class="card__price">' + money(p.price) + "</span>"
        : '<span class="card__price">' + money(p.price) + "</span>";
      var badgeCls = p.compareAt ? "card__badge card__badge--save" : "card__badge";
      card.innerHTML =
        '<div class="card__media">' +
          '<span class="' + badgeCls + '">' + p.badge + "</span>" +
          '<img src="' + p.images[0] + '" alt="' + p.fullTitle + '" loading="lazy" width="300" height="300" />' +
          '<button class="card__quick" type="button" data-quick="' + p.id + '">Quick view</button>' +
        "</div>" +
        '<div class="card__body">' +
          '<div class="card__stars"><span class="stars">' + starString(p.rating) + "</span>" +
            '<span>' + p.rating + " (" + p.reviews + ")</span></div>" +
          '<h3 class="card__title">' + p.title + "</h3>" +
          '<p class="card__tagline">' + p.tagline + "</p>" +
          '<div class="card__foot">' + priceHtml +
            '<button class="card__add" type="button" data-add="' + p.id + '">Add to cart</button>' +
          "</div>" +
        "</div>";
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  // --- Cart drawer --------------------------------------------------
  var drawer = $("#cartDrawer");
  var overlay = $("#drawerOverlay");

  function openDrawer() {
    overlay.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
      drawer.classList.add("is-open");
    });
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    overlay.classList.remove("is-open");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(function () { overlay.hidden = true; }, 320);
  }

  function renderCart() {
    var lines = $("#cartLines");
    var empty = $("#cartEmpty");
    var foot = $("#cartFoot");
    var ids = Object.keys(cart);

    lines.innerHTML = "";
    bumpCount();

    if (ids.length === 0) {
      empty.style.display = "block";
      foot.hidden = true;
      return;
    }
    empty.style.display = "none";
    foot.hidden = false;

    ids.forEach(function (id) {
      var p = byId[id];
      if (!p) return;
      var qty = cart[id];
      var line = el("li", "cart-line");
      line.innerHTML =
        '<img class="cart-line__img" src="' + p.images[0] + '" alt="' + p.title + '" width="64" height="64" />' +
        "<div>" +
          '<p class="cart-line__title">' + p.title + "</p>" +
          '<p class="cart-line__price">' + money(p.price) + "</p>" +
          '<div class="cart-line__qty">' +
            '<button type="button" aria-label="Decrease quantity" data-dec="' + id + '">−</button>' +
            "<span>" + qty + "</span>" +
            '<button type="button" aria-label="Increase quantity" data-inc="' + id + '">+</button>' +
          "</div>" +
          '<button class="cart-line__remove" type="button" data-remove="' + id + '">Remove</button>' +
        "</div>" +
        '<span class="cart-line__linetotal">' + money(p.price * qty) + "</span>";
      lines.appendChild(line);
    });

    var subtotal = cartSubtotal();
    $("#cartSubtotal").textContent = money(subtotal);

    // Free shipping progress
    var ship = $("#cartShip");
    if (subtotal >= FREE_SHIP_THRESHOLD) {
      ship.innerHTML = "✓ You've unlocked <strong>free tracked shipping!</strong>";
    } else {
      var remaining = FREE_SHIP_THRESHOLD - subtotal;
      var pct = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);
      ship.innerHTML =
        "You're " + money(remaining) + " away from <strong>free shipping</strong>" +
        '<div class="cart-ship__bar"><div class="cart-ship__fill" style="width:' + pct + '%"></div></div>';
    }

    // Build real Shopify checkout permalink
    var permalink = ids.map(function (id) {
      return byId[id].variantId + ":" + cart[id];
    }).join(",");
    $("#checkoutBtn").setAttribute("href", "https://" + STORE_DOMAIN + "/cart/" + permalink);
  }

  // --- Quick view modal --------------------------------------------
  var modal = $("#quickView");
  var qvState = { product: null };

  function openQuickView(id) {
    var p = byId[id];
    if (!p) return;
    qvState.product = p;
    $("#qvEyebrow").textContent = p.badge;
    $("#qvTitle").textContent = p.fullTitle;
    var priceHtml = p.compareAt
      ? money(p.price) + ' <span class="price-was">' + money(p.compareAt) + "</span>"
      : money(p.price);
    $("#qvPrice").innerHTML = priceHtml;
    $("#qvDesc").innerHTML = p.desc;
    setMainImage(0);

    var thumbs = $("#qvThumbs");
    thumbs.innerHTML = "";
    p.images.forEach(function (src, i) {
      var b = el("button", i === 0 ? "is-active" : "");
      b.type = "button";
      b.innerHTML = '<img src="' + src + '" alt="' + p.title + ' view ' + (i + 1) + '" />';
      b.addEventListener("click", function () {
        setMainImage(i);
        Array.prototype.forEach.call(thumbs.children, function (c) { c.classList.remove("is-active"); });
        b.classList.add("is-active");
      });
      thumbs.appendChild(b);
    });

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function setMainImage(i) {
    var p = qvState.product;
    if (!p) return;
    var img = $("#qvMainImg");
    img.src = p.images[i];
    img.alt = p.fullTitle + " — view " + (i + 1);
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // --- Event wiring -------------------------------------------------
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-add],[data-quick],[data-inc],[data-dec],[data-remove],[data-close-modal]");
    if (!t) return;

    if (t.hasAttribute("data-add")) { addToCart(t.getAttribute("data-add"), 1); openDrawer(); }
    else if (t.hasAttribute("data-quick")) { openQuickView(t.getAttribute("data-quick")); }
    else if (t.hasAttribute("data-inc")) { var i = t.getAttribute("data-inc"); setQty(i, cart[i] + 1); }
    else if (t.hasAttribute("data-dec")) { var d = t.getAttribute("data-dec"); setQty(d, cart[d] - 1); }
    else if (t.hasAttribute("data-remove")) { setQty(t.getAttribute("data-remove"), 0); }
    else if (t.hasAttribute("data-close-modal")) { closeModal(); }
  });

  // Quick view "add to cart"
  $("#qvAdd").addEventListener("click", function () {
    if (qvState.product) {
      addToCart(qvState.product.id, 1);
      closeModal();
      openDrawer();
    }
  });

  // Cart open/close
  $("#cartBtn").addEventListener("click", openDrawer);
  $("#cartClose").addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);
  var cartEmptyShop = $("#cartEmptyShop");
  if (cartEmptyShop) cartEmptyShop.addEventListener("click", closeDrawer);

  // Escape closes overlays
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal.classList.contains("is-open")) closeModal();
      else if (drawer.classList.contains("is-open")) closeDrawer();
    }
  });

  // Mobile nav
  var navToggle = $("#navToggle");
  var nav = $("#primaryNav");
  navToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  // Sticky header shadow
  var header = $(".header");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Newsletter (front-end confirmation only)
  var nlForm = $("#newsletterForm");
  if (nlForm) {
    nlForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#newsletterEmail");
      var msg = $("#newsletterMsg");
      var val = (input.value || "").trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) {
        msg.style.color = "#c0392b";
        msg.textContent = "Please enter a valid email address.";
        return;
      }
      msg.style.color = "";
      msg.textContent = "🎉 You're in! Check your inbox for your 10% off code.";
      input.value = "";
    });
  }

  // Year
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Init ---------------------------------------------------------
  renderGrid();
  renderCart();
  bumpCount();
})();
