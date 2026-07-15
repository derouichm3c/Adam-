# LumySmile — Storefront

A fast, professional, conversion-focused storefront for **LumySmile**, natural
peroxide-free oral care. Built as a self-contained static site (HTML + CSS + JS)
so it can be hosted anywhere — GitHub Pages, Netlify, Vercel, or any static host.

## ✨ What's inside

- **Real product data** — titles, prices, descriptions and photos mirror the live
  Shopify catalogue (Whitening Strips, Charcoal Toothpaste, Bamboo Toothbrush
  4-Pack, and the Complete Smile Bundle).
- **Functional checkout** — every *Add to cart* / *Checkout* button builds a real
  Shopify cart permalink (`https://lumysmile.com/cart/<variant>:<qty>`), so the
  cart carries straight into your existing Shopify checkout. No backend needed.
- **Cohesive natural/eco theme** — mint-teal, cream and charcoal palette,
  Fraunces + Inter typography, consistent across every section.
- **Conversion features** — sticky header, announcement marquee, hero with trust
  badges, featured bundle with savings, product grid with quick-view, benefits,
  3-step how-it-works, reviews, 30-day guarantee band, FAQ, newsletter capture.
- **Slide-in cart** — quantity controls, free-shipping progress bar, persisted in
  `localStorage`.
- **Responsive & accessible** — works from 320px to desktop, keyboard-friendly
  (Esc closes overlays), semantic HTML, alt text on images, ARIA labels.

## 📁 Structure

```
index.html            Main storefront
assets/css/styles.css Design system + all styles
assets/js/main.js     Product data, cart, quick-view, checkout permalinks
```

## 🚀 Preview locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## 🌐 Deploy

- **GitHub Pages:** Settings → Pages → deploy from this branch (root).
- **Netlify / Vercel:** drag-and-drop the folder, or connect the repo. No build
  step required.

## 🔧 Editing products

All product data lives in one place — the `PRODUCTS` array at the top of
`assets/js/main.js`. Update `price`, `title`, `images` or `variantId` there and
the grid, cart and checkout links all update automatically. Variant IDs must
match your Shopify variants for checkout to work.

## 📝 Notes

- **Reviews** in the "Real smiles" section are illustrative placeholders — replace
  them with your genuine customer reviews before going live.
- **Social links** in the footer point to platform homepages — swap in your real
  profile URLs.
- **Legal links** (Privacy, Terms, Shipping & Returns) are placeholders — link
  them to your real policy pages.
- The newsletter form shows a front-end confirmation only; connect it to your
  email provider (Klaviyo, Mailchimp, Shopify Email…) to actually capture signups.
