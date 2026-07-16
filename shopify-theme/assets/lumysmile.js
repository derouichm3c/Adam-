/* ============================================================
   LumySmile — Shopify theme scripts (lightweight, dependency-free)
   ============================================================ */
(function () {
  "use strict";
  function $(s, c) { return (c || document).querySelector(s); }

  // Mobile nav
  var navToggle = $("#navToggle");
  var nav = $("#primaryNav");
  if (navToggle && nav) {
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

  // Product page: thumbnail -> swap main image
  var mainImg = $("#pMainImg");
  if (mainImg) {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-pimg]");
      if (!t) return;
      e.preventDefault();
      mainImg.src = t.getAttribute("data-pimg");
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

  // Year
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
