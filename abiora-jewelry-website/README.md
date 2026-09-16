# ABIORA — Anti-Tarnish Jewelry Frontend

A responsive multi-page frontend matching the supplied ABIORA visual direction:
cream/off-white background, black + warm gold accents, Playfair Display headings, premium product cards, hero photography, promise section, reviews, newsletter and ecommerce flows.

## Pages
- `index.html` — Home
- `shop.html` — Shop + filters/sorting
- `product.html?id=1` — Product detail
- `cart.html` — Cart
- `checkout.html` — Checkout UI
- `about.html` — About
- `care.html` — Jewelry care guide
- `contact.html` — Contact
- `account.html` — Account demo

## Run
Open `index.html` directly, or use VS Code Live Server.

## Important
This is frontend/demo functionality. Cart state uses localStorage. Checkout, authentication, product inventory, order storage and payment are not connected to a real backend.

Before publishing:
1. Replace demo contact details.
2. Replace remote image URLs with your own licensed product photography.
3. Connect Firebase/Firestore or another backend.
4. Connect Razorpay/UPI payment processing.
5. Add real shipping/return/privacy/terms pages.
6. Verify all product claims such as anti-tarnish, waterproof and skin-friendly with your supplier/manufacturer.
<div class="header-icons">
    <a href="account.html" aria-label="Account">♙</a>
    <a class="cart-link" href="cart.html">
      <img src="images/cart.png" alt="Cart">
      <b class="cart-count">0</b>
    </a>
  </div>