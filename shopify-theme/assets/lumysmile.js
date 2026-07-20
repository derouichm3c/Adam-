/* ============================================================
   LumySmile — Shopify theme scripts (lightweight, dependency-free)
   ============================================================ */
(function () {
  "use strict";
  function $(s, c) { return (c || document).querySelector(s); }

  // Mobile nav (side drawer)
  var navToggle = $("#navToggle");
  var nav = $("#primaryNav");
  var navOverlay = $("#navOverlay");
  if (navToggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle("is-open", open);
      if (navOverlay) navOverlay.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    navToggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setNav(false);
    });
    if (navOverlay) navOverlay.addEventListener("click", function () { setNav(false); });
    var navClose = $("#navClose");
    if (navClose) navClose.addEventListener("click", function () { setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setNav(false);
    });
  }

  // Sticky header shadow
  var header = $(".header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Product page: quantity stepper
  document.addEventListener("click", function (e) {
    var dec = e.target.closest("[data-qty-dec]");
    var inc = e.target.closest("[data-qty-inc]");
    if (!dec && !inc) return;
    var wrap = (dec || inc).closest(".qty-select");
    if (!wrap) return;
    var input = wrap.querySelector("input");
    var v = parseInt(input.value, 10) || 1;
    v = inc ? v + 1 : Math.max(1, v - 1);
    input.value = v;
  });

  // Product page: gallery thumbnails -> swap main image OR play video
  var mainImg = $("#pMainImg");
  var mainVideo = $("#pMainVideo");
  if (mainImg) {
    document.addEventListener("click", function (e) {
      var t = e.target.closest(".pthumb");
      if (!t) return;
      e.preventDefault();
      var type = t.getAttribute("data-ptype");
      if (type === "video" && mainVideo) {
        mainImg.style.display = "none";
        mainVideo.style.display = "block";
        try { mainVideo.play(); } catch (err) {}
      } else {
        if (mainVideo) { mainVideo.pause(); mainVideo.style.display = "none"; }
        mainImg.style.display = "block";
        mainImg.src = t.getAttribute("data-pimg");
      }
      var all = document.querySelectorAll(".pthumb");
      for (var i = 0; i < all.length; i++) { all[i].classList.remove("is-active"); }
      t.classList.add("is-active");
    });
  }

  // Product page: image gallery zoom-on-thumb handled by src swap above.

  // Newsletter (front-end confirmation only, if present)
  var nlForm = $("#newsletterForm");
  if (nlForm) {
    nlForm.addEventListener("submit", function (e) {
      // Allow real Shopify customer form to submit if action set; otherwise confirm.
      if (nlForm.getAttribute("data-demo") !== "true") return;
      e.preventDefault();
      var input = $("#newsletterEmail");
      var msg = $("#newsletterMsg");
      var val = (input.value || "").trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) { msg.style.color = "#c0392b"; msg.textContent = "Please enter a valid email address."; return; }
      msg.style.color = ""; msg.textContent = "You're in! Watch your inbox for your welcome offer.";
      input.value = "";
    });
  }

  // Cart drawer
  var cartDrawer = $("#cartDrawer");
  var cartOverlay = $("#cartOverlay");
  var cartBody = $("#cartBody");
  var cartFoot = $("#cartFoot");
  var cartSubtotal = $("#cartSubtotal");
  var cartBtn = $("#cartBtn");
  var cartCount = $("#cartCount");

  if (cartDrawer && cartBody) {
    var money = function (cents) { return (cents / 100).toFixed(2) + "$"; };

    var setCount = function (n) {
      if (!cartCount) return;
      cartCount.textContent = n;
      cartCount.classList.toggle("is-visible", n > 0);
    };

    var renderCart = function (cart) {
      setCount(cart.item_count);
      if (!cart.items.length) {
        cartBody.innerHTML = '<p class="cart-empty">Your cart is empty.<br><a class="link" href="/collections/all">Shop bestsellers &rarr;</a></p>';
        cartFoot.hidden = true;
        return;
      }
      var html = '<ul class="cart-lines">';
      for (var i = 0; i < cart.items.length; i++) {
        var it = cart.items[i];
        var img = it.image ? it.image.replace(/(\.[a-z]+)(\?|$)/, "_160x$1$2") : "";
        var variant = it.variant_title && it.variant_title !== "Default Title" ? '<div class="cart-line__price">' + it.variant_title + "</div>" : "";
        html +=
          '<li class="cart-line">' +
            (img ? '<img class="cart-line__img" src="' + img + '" alt="" width="64" height="64" loading="lazy">' : '<span class="cart-line__img"></span>') +
            "<div>" +
              '<p class="cart-line__title">' + it.product_title + "</p>" + variant +
              '<span class="cart-line__qty">' +
                '<button type="button" data-cart-minus data-line="' + (i + 1) + '" aria-label="Decrease quantity">&minus;</button>' +
                "<span>" + it.quantity + "</span>" +
                '<button type="button" data-cart-plus data-line="' + (i + 1) + '" aria-label="Increase quantity">+</button>' +
              "</span>" +
              '<br><button type="button" class="cart-line__remove" data-cart-remove data-line="' + (i + 1) + '">Remove</button>' +
            "</div>" +
            '<span class="cart-line__linetotal">' + money(it.final_line_price) + "</span>" +
          "</li>";
      }
      html += "</ul>";
      cartBody.innerHTML = html;
      cartSubtotal.textContent = money(cart.items_subtotal_price);
      cartFoot.hidden = false;
    };

    var refreshCart = function () {
      return fetch("/cart.js").then(function (r) { return r.json(); }).then(renderCart);
    };

    var openCart = function () {
      cartOverlay.hidden = false;
      requestAnimationFrame(function () {
        cartOverlay.classList.add("is-open");
        cartDrawer.classList.add("is-open");
      });
      cartDrawer.setAttribute("aria-hidden", "false");
      document.documentElement.style.overflow = "hidden";
    };

    var closeCart = function () {
      cartOverlay.classList.remove("is-open");
      cartDrawer.classList.remove("is-open");
      cartDrawer.setAttribute("aria-hidden", "true");
      document.documentElement.style.overflow = "";
      setTimeout(function () { cartOverlay.hidden = true; }, 320);
    };

    if (cartBtn) {
      cartBtn.addEventListener("click", function (e) {
        e.preventDefault();
        refreshCart().then(openCart);
      });
    }
    var cartClose = $("#cartClose");
    if (cartClose) cartClose.addEventListener("click", closeCart);
    cartOverlay.addEventListener("click", closeCart);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cartDrawer.classList.contains("is-open")) closeCart();
    });

    // Quantity / remove inside the drawer
    cartBody.addEventListener("click", function (e) {
      var minus = e.target.closest("[data-cart-minus]");
      var plus = e.target.closest("[data-cart-plus]");
      var remove = e.target.closest("[data-cart-remove]");
      var btn = minus || plus || remove;
      if (!btn) return;
      var line = parseInt(btn.getAttribute("data-line"), 10);
      var qtyEl = btn.parentElement ? btn.parentElement.querySelector("span") : null;
      var current = qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1;
      var qty = remove ? 0 : plus ? current + 1 : Math.max(0, current - 1);
      fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line: line, quantity: qty })
      }).then(function (r) { return r.json(); }).then(renderCart);
    });

    // Add to cart via AJAX -> open drawer instead of navigating
    document.addEventListener("submit", function (e) {
      var form = e.target.closest('form[action*="/cart/add"]');
      if (!form) return;
      e.preventDefault();
      var submitBtn = form.querySelector('[name="add"]');
      if (submitBtn) submitBtn.disabled = true;
      fetch("/cart/add.js", { method: "POST", body: new FormData(form) })
        .then(function (r) { if (!r.ok) throw new Error("add failed"); return r.json(); })
        .then(function () { return refreshCart(); })
        .then(openCart)
        .catch(function () { form.submit(); })
        .finally(function () { if (submitBtn) submitBtn.disabled = false; });
    });
  }

  // Year
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
