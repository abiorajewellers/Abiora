const PRODUCTS = [
    {
        id: 1,
        name: "Golden Hour Necklace",
        cat: "Necklaces",
        price: 899,
        old: 1099,
        rating: "4.8",
        reviews: 124,
        img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=85",
        desc: "A timeless everyday necklace designed for effortless elegance.",
        material: "Stainless Steel"
    },
    {
        id: 2,
        name: "Twist Hoop Earrings",
        cat: "Earrings",
        price: 799,
        old: 999,
        rating: "4.9",
        reviews: 98,
        img: "https://unsplash.com/photos/a-pair-of-earrings-sitting-on-top-of-a-black-cloth--_12be3InkQ",
        desc: "Minimal twisted hoops for everyday styling.",
        material: "Stainless Steel"
    },
    {
        id: 3,
        name: "Minimal Ring",
        cat: "Rings",
        price: 699,
        old: 799,
        rating: "4.7",
        reviews: 76,
        img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=85",
        desc: "A clean and elegant everyday ring.",
        material: "Stainless Steel"
    },
    {
        id: 4,
        name: "Tennis Bracelet",
        cat: "Bracelets",
        price: 1299,
        old: 1499,
        rating: "4.9",
        reviews: 112,
        img: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=700&q=85",
        desc: "A refined bracelet designed to add subtle sparkle.",
        material: "Stainless Steel"
    },
    {
        id: 5,
        name: "Layered Chain Necklace",
        cat: "Chains",
        price: 1099,
        old: 1299,
        rating: "4.8",
        reviews: 88,
        img: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=700&q=85",
        desc: "A layered chain look designed for effortless styling.",
        material: "Stainless Steel"
    },
    {
        id: 6,
        name: "Pearl Drop Earrings",
        cat: "Earrings",
        price: 899,
        old: 999,
        rating: "4.9",
        reviews: 64,
        img: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=85",
        desc: "Elegant pearl-inspired drop earrings.",
        material: "18K Gold Plated"
    },
    {
        id: 7,
        name: "Cuban Chain",
        cat: "Chains",
        price: 1499,
        old: 1699,
        rating: "4.8",
        reviews: 71,
        img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=85",
        desc: "A bold Cuban chain for a confident everyday look.",
        material: "Stainless Steel"
    },
    {
        id: 8,
        name: "Signet Ring",
        cat: "Rings",
        price: 999,
        old: 1199,
        rating: "4.8",
        reviews: 59,
        img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=85",
        desc: "A classic signet silhouette with a modern finish.",
        material: "Stainless Steel"
    }
];


let firebaseProducts = null;
let firebaseReady = false;

let storeSettings = {
    shippingCharge: 50,
    freeShippingMinimum: 999,
    returnDays: 7
};


/* =========================================================
   FIREBASE PRODUCTS
========================================================= */

async function loadFirebaseProducts() {

    try {

        console.log("ABIORA: Loading products from Firestore...");

        const { db } = await import("./firebase.js");

        const {
            collection,
            getDocs,
            doc,
            getDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
        );


        const snapshot = await getDocs(
            collection(db, "products")
        );


        console.log(
            "ABIORA: Firestore products found:",
            snapshot.size
        );


        firebaseProducts = snapshot.docs.map(item => {

            const data = item.data();

            console.log(
                "ABIORA: Product:",
                item.id,
                data
            );


            return {

                id: item.id,

                name:
                    data.name || "",

                cat:
                    data.category ||
                    data.cat ||
                    "",

                price:
                    Number(data.price || 0),

                old:
                    Number(
                        data.oldPrice ??
                        data.old ??
                        0
                    ),

                rating:
                    String(
                        data.rating ??
                        "0"
                    ),

                reviews:
                    Number(
                        data.reviews || 0
                    ),

                img:
                    data.image ||
                    data.img ||
                    "",

                desc:
                    data.description ||
                    data.desc ||
                    "",

                material:
                    data.material ||
                    "",

                stock:
                    Number(
                        data.stock ?? 0
                    ),

                featured:
                    data.featured === true

            };

        });


        /* =====================================================
           LOAD STORE SETTINGS
        ===================================================== */

        const settingsSnap = await getDoc(
            doc(
                db,
                "settings",
                "store"
            )
        );


        if (settingsSnap.exists()) {

            storeSettings = {
                ...storeSettings,
                ...settingsSnap.data()
            };

        }


        firebaseReady = true;


        console.log(
            "ABIORA: Firebase products loaded:",
            firebaseProducts
        );


        refreshCurrentPage();

    }

    catch (error) {

        console.error(
            "ABIORA FIREBASE PRODUCT ERROR:",
            error
        );

        firebaseProducts = [];
        firebaseReady = false;

        console.error(
            "Firebase products could not be loaded."
        );

        /*
         * Render the local fallback products if Firebase
         * is unavailable.
         */
        refreshCurrentPage();
    }

}


/* =========================================================
   GET PRODUCTS
========================================================= */

function getProducts() {

    /*
     * Once Firebase has successfully loaded,
     * Firebase becomes the main product source.
     */
    if (
        firebaseReady &&
        Array.isArray(firebaseProducts)
    ) {

        return firebaseProducts;

    }


    /*
     * Firebase unavailable:
     * use original local products.
     */
    return PRODUCTS;
}


/* =========================================================
   PAGE REFRESH
========================================================= */

function refreshCurrentPage() {

    if (
        document.getElementById("homeProducts")
    ) {

        renderProducts(
            "homeProducts",

            getProducts()
                .filter(
                    product =>
                        product.featured !== false
                )
                .slice(0, 4)
        );

    }


    if (
        document.getElementById("shopProducts")
    ) {

        initShop();

    }


    if (
        document.getElementById("productDetail")
    ) {

        renderProductDetail();

    }


    if (
        document.getElementById("cartContent")
    ) {

        renderCart();

    }


    if (
        document.getElementById("checkoutItems")
    ) {

        renderCheckout();

    }

}


/* =========================================================
   CART
========================================================= */

const CART_KEY = "abioraCart";


function getCart() {

    try {

        return JSON.parse(
            localStorage.getItem(CART_KEY)
        ) || [];

    }

    catch {

        return [];

    }

}


function saveCart(cart) {

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

    updateCartCount();

}


function updateCartCount() {

    const cart = getCart();


    const count = cart.reduce(
        (sum, item) =>
            sum +
            Number(
                item.quantity || 1
            ),
        0
    );


    document
        .querySelectorAll(".cart-count")
        .forEach(element => {

            element.textContent = count;

        });

}


function toast(message) {

    const element =
        document.getElementById("toast");


    if (!element) return;


    element.textContent = message;


    element.classList.add("show");


    setTimeout(() => {

        element.classList.remove("show");

    }, 2500);

}


/* =========================================================
   FIND PRODUCT
========================================================= */

function findProduct(id) {

    return getProducts().find(
        product =>
            String(product.id) ===
            String(id)
    );

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(id) {

    const product = findProduct(id);


    if (!product) {

        toast("Product not found.");

        return;

    }


    if (
        product.stock !== undefined &&
        product.stock !== null &&
        Number(product.stock) <= 0
    ) {

        toast("This product is out of stock.");

        return;

    }


    const cart = getCart();


    const existing = cart.find(
        item =>
            String(item.id) ===
            String(id)
    );


    if (existing) {

        existing.quantity =
            Number(
                existing.quantity || 1
            ) + 1;

    }

    else {

        cart.push({

            id: product.id,

            name: product.name,

            price:
                Number(
                    product.price || 0
                ),

            img: product.img,

            quantity: 1

        });

    }


    saveCart(cart);

    toast("Added to cart.");

}


/* =========================================================
   CHANGE CART
========================================================= */

function changeCart(id, quantity) {

    const cart = getCart();


    const item = cart.find(
        product =>
            String(product.id) ===
            String(id)
    );


    if (!item) return;


    item.quantity =
        Math.max(
            1,
            Number(quantity)
        );


    saveCart(cart);

    renderCart();

}


/* =========================================================
   REMOVE CART
========================================================= */

function removeCart(id) {

    const cart =
        getCart().filter(
            item =>
                String(item.id) !==
                String(id)
        );


    saveCart(cart);

    renderCart();

}


/* =========================================================
   PRODUCT CARDS
========================================================= */

function renderProducts(target, list) {

    const container =
        document.getElementById(target);


    if (!container) return;


    if (!list.length) {

        container.innerHTML = `
            <div class="admin-empty">
                No products found.
            </div>
        `;

        return;

    }


    container.innerHTML =
        list.map(product => {

            const image =
                product.img || "";


            return `

                <article class="product-card">

                    <div
                        class="product-image"
                        onclick="
                            location.href='product.html?id=${encodeURIComponent(product.id)}'
                        "
                    >

                        ${
                            image

                            ?

                            `
                                <img
                                    src="${escapeAttribute(image)}"
                                    alt="${escapeHTML(product.name)}"
                                    loading="lazy"
                                    style="
                                        width:100%;
                                        height:100%;
                                        object-fit:cover;
                                        display:block;
                                    "
                                    onerror="
                                        this.style.display='none';
                                    "
                                >
                            `

                            :

                            `
                                <div
                                    style="
                                        width:100%;
                                        height:100%;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                    "
                                >
                                    No Image
                                </div>
                            `
                        }


                        <button
                            class="heart"
                            onclick="
                                event.stopPropagation();
                            "
                            aria-label="Wishlist"
                        >
                            ♡
                        </button>

                    </div>


                    <div class="product-info">

                        <small>
                            ${escapeHTML(
                                product.cat || ""
                            )}
                        </small>


                        <h3>
                            ${escapeHTML(
                                product.name
                            )}
                        </h3>


                        <div class="product-price">

                            <b>
                                ₹${Number(
                                    product.price || 0
                                ).toLocaleString("en-IN")}
                            </b>


                            ${
                                product.old

                                ?

                                `
                                    <del>
                                        ₹${Number(
                                            product.old
                                        ).toLocaleString("en-IN")}
                                    </del>
                                `

                                :

                                ""
                            }

                        </div>


                        <div class="rating">

                            ★ ${escapeHTML(
                                product.rating || "0"
                            )}

                            <span>
                                (${Number(
                                    product.reviews || 0
                                )})
                            </span>

                        </div>


                        <button
                            class="btn dark"
                            onclick="
                                event.stopPropagation();
                                addToCart('${escapeAttribute(product.id)}')
                            "
                        >
                            Add to Cart
                        </button>

                    </div>

                </article>

            `;

        }).join("");

}


/* =========================================================
   ESCAPE HELPERS
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}


function escapeCSSUrl(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\)/g, "\\)");

}


/* =========================================================
   SHOP
========================================================= */

let currentShopProducts = [];


function initShop() {

    const container =
        document.getElementById(
            "shopProducts"
        );


    if (!container) return;


    const params =
        new URLSearchParams(
            window.location.search
        );


    const category =
        params.get("cat");


    let list = getProducts();


    if (category) {

        list = list.filter(
            product =>
                String(product.cat)
                    .toLowerCase() ===
                String(category)
                    .toLowerCase()
        );

    }


    currentShopProducts = list;


    renderShopList(
        currentShopProducts
    );

}


/* =========================================================
   RENDER SHOP
========================================================= */

function renderShopList(list) {

    currentShopProducts = list;


    const resultCount =
        document.getElementById(
            "resultCount"
        );


    if (resultCount) {

        resultCount.textContent =
            `Showing ${list.length} product${list.length === 1 ? "" : "s"}`;

    }


    renderProducts(
        "shopProducts",
        list
    );

}


/* =========================================================
   FILTERS
========================================================= */

function applyFilters() {

    let list = getProducts();


    const checked =
        Array.from(
            document.querySelectorAll(
                ".filters input[type='checkbox']:checked"
            )
        );


    const categories =
        checked
            .map(input => input.value)
            .filter(value =>
                [
                    "Necklaces",
                    "Earrings",
                    "Rings",
                    "Bracelets",
                    "Chains",
                    "Sets"
                ].includes(value)
            );


    const prices =
        checked
            .map(input => input.value)
            .filter(value =>
                value.includes("-")
            );


    if (categories.length) {

        list = list.filter(
            product =>
                categories.includes(
                    product.cat
                )
        );

    }


    if (prices.length) {

        list = list.filter(product => {

            return prices.some(range => {

                const [
                    min,
                    max
                ] =
                    range
                        .split("-")
                        .map(Number);


                return (
                    Number(product.price) >= min &&
                    Number(product.price) <= max
                );

            });

        });

    }


    renderShopList(list);

}


/* =========================================================
   SORT
========================================================= */

function sortProducts(value) {

    const list = [
        ...(
            currentShopProducts.length
                ? currentShopProducts
                : getProducts()
        )
    ];


    if (value === "low") {

        list.sort(
            (a, b) =>
                Number(a.price) -
                Number(b.price)
        );

    }

    else if (value === "high") {

        list.sort(
            (a, b) =>
                Number(b.price) -
                Number(a.price)
        );

    }


    renderShopList(list);

}


/* =========================================================
   PRODUCT DETAIL
========================================================= */

function renderProductDetail() {

    const container =
        document.getElementById(
            "productDetail"
        );


    if (!container) return;


    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    const product =
        findProduct(id);


    if (!product) {

        container.innerHTML = `
            <div class="simple-page">

                <h1>
                    Product not found
                </h1>

                <a
                    class="btn dark"
                    href="shop.html"
                >
                    Back to Shop
                </a>

            </div>
        `;

        return;

    }


    const productImage =
        product.img || "";


    container.innerHTML = `

        <section class="product-detail">

            <div class="product-gallery">

                <div class="product-detail-main">

                    ${
                        productImage

                        ?

                        `
                            <img
                                src="${escapeAttribute(productImage)}"
                                alt="${escapeHTML(product.name)}"
                                style="
                                    width:100%;
                                    height:100%;
                                    object-fit:cover;
                                    display:block;
                                "
                            >
                        `

                        :

                        `
                            <div
                                style="
                                    width:100%;
                                    height:100%;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                "
                            >
                                No Image
                            </div>
                        `
                    }

                </div>

            </div>


            <div class="product-detail-info">

                <p class="eyebrow">

                    ${escapeHTML(
                        product.cat || ""
                    )}

                </p>


                <h1>

                    ${escapeHTML(
                        product.name
                    )}

                </h1>


                <div class="detail-rating">

                    ★ ${escapeHTML(
                        product.rating || "0"
                    )}

                    <span>

                        (${Number(
                            product.reviews || 0
                        )} reviews)

                    </span>

                </div>


                <div class="detail-price">

                    <b>

                        ₹${Number(
                            product.price || 0
                        ).toLocaleString("en-IN")}

                    </b>


                    ${
                        product.old

                        ?

                        `
                            <del>
                                ₹${Number(
                                    product.old
                                ).toLocaleString("en-IN")}
                            </del>
                        `

                        :

                        ""
                    }

                </div>


                <p>

                    ${escapeHTML(
                        product.desc || ""
                    )}

                </p>


                <p>

                    <strong>
                        Material:
                    </strong>

                    ${escapeHTML(
                        product.material ||
                        "Premium quality material"
                    )}

                </p>


                <div class="quantity">

                    <button
                        onclick="changeDetailQty(-1)"
                    >
                        −
                    </button>

                    <span id="detailQty">
                        1
                    </span>

                    <button
                        onclick="changeDetailQty(1)"
                    >
                        +
                    </button>

                </div>


                <button
                    class="btn dark wide"
                    onclick="
                        addDetail('${escapeAttribute(product.id)}')
                    "
                >
                    Add to Cart
                </button>


                <button
                    class="btn wide"
                    onclick="
                        buyNow('${escapeAttribute(product.id)}')
                    "
                >
                    Buy Now
                </button>

            </div>

        </section>

    `;

}


/* =========================================================
   DETAIL QUANTITY
========================================================= */

function changeDetailQty(change) {

    const element =
        document.getElementById(
            "detailQty"
        );


    if (!element) return;


    const current =
        Number(
            element.textContent
        ) || 1;


    element.textContent =
        Math.max(
            1,
            current + change
        );

}


/* =========================================================
   ADD DETAIL
========================================================= */

function addDetail(id) {

    const product =
        findProduct(id);


    if (!product) return;


    const quantityElement =
        document.getElementById(
            "detailQty"
        );


    const quantity =
        Number(
            quantityElement?.textContent
        ) || 1;


    const cart = getCart();


    const existing =
        cart.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (existing) {

        existing.quantity =
            Number(
                existing.quantity || 1
            ) + quantity;

    }

    else {

        cart.push({

            id: product.id,

            name: product.name,

            price:
                Number(
                    product.price || 0
                ),

            img: product.img,

            quantity

        });

    }


    saveCart(cart);

    toast("Added to cart.");

}


/* =========================================================
   BUY NOW
========================================================= */

function buyNow(id) {

    addDetail(id);

    window.location.href =
        "checkout.html";

}


/* =========================================================
   SHIPPING
========================================================= */

function calculateShipping(subtotal) {

    if (
        Number(subtotal) >=
        Number(
            storeSettings.freeShippingMinimum
        )
    ) {

        return 0;

    }


    return Number(
        storeSettings.shippingCharge || 0
    );

}


/* =========================================================
   CART PAGE
========================================================= */
function renderCart() {

const container =
    document.getElementById("cartContent");

if (!container) return;

const cart = getCart();

/* =========================================
   EMPTY CART
========================================= */

if (!cart.length) {

    container.innerHTML = `
        <div class="empty-cart">

            <div class="empty-cart-icon">
                ♡
            </div>

            <h2>
                Your cart is waiting
            </h2>

            <p>
                Discover something beautiful
                and add it to your collection.
            </p>

            <a
                href="shop.html"
                class="shop-btn"
            >
                Continue Shopping
            </a>

        </div>
    `;

    return;
}


/* =========================================
   CALCULATE SUBTOTAL
========================================= */

let subtotal = 0;


/* =========================================
   CART PRODUCTS
========================================= */

const items = cart.map(item => {

    const price =
        Number(item.price || 0);

    const quantity =
        Number(item.quantity || 1);

    const itemTotal =
        price * quantity;

    subtotal += itemTotal;


    /*
     * Try to get the latest product information.
     * This allows Firebase product images/prices
     * to remain up to date.
     */

    const product =
        findProduct(item.id);

    const image =
        item.img ||
        product?.img ||
        "";

    const category =
        product?.cat ||
        "Jewelry";


    return `
        <article class="cart-product">

            <!-- PRODUCT IMAGE -->

            <div class="cart-product-image">

                ${
                    image
                    ?
                    `
                        <img
                            src="${escapeAttribute(image)}"
                            alt="${escapeHTML(item.name)}"
                            loading="lazy"
                            onerror="
                                this.style.display='none';
                                this.parentElement.innerHTML='<span>ABIORA</span>';
                            "
                        >
                    `
                    :
                    `
                        <span>
                            ABIORA
                        </span>
                    `
                }

            </div>


            <!-- PRODUCT INFORMATION -->

            <div class="cart-product-info">

                <div class="category">
                    ${escapeHTML(category)}
                </div>

                <h3>
                    ${escapeHTML(item.name)}
                </h3>


                <div class="cart-product-price">

                    ₹${price.toLocaleString("en-IN")}

                    ${
                        product?.old
                        ?
                        `
                            <span class="old-price">
                                ₹${Number(
                                    product.old
                                ).toLocaleString("en-IN")}
                            </span>
                        `
                        :
                        ""
                    }

                </div>


                <!-- QUANTITY -->

                <div class="cart-quantity">

                    <button
                        type="button"
                        aria-label="Decrease quantity"
                        onclick="
                            changeCart(
                                '${escapeAttribute(item.id)}',
                                ${Math.max(
                                    1,
                                    quantity - 1
                                )}
                            )
                        "
                    >
                        −
                    </button>


                    <span>
                        ${quantity}
                    </span>


                    <button
                        type="button"
                        aria-label="Increase quantity"
                        onclick="
                            changeCart(
                                '${escapeAttribute(item.id)}',
                                ${quantity + 1}
                            )
                        "
                    >
                        +
                    </button>

                </div>

            </div>


            <!-- TOTAL -->

            <div class="cart-product-total">

                <strong>
                    ₹${itemTotal.toLocaleString("en-IN")}
                </strong>


                <button
                    type="button"
                    class="remove-item"
                    onclick="
                        removeCart(
                            '${escapeAttribute(item.id)}'
                        )
                    "
                >
                    Remove
                </button>

            </div>

        </article>
    `;

}).join("");


/* =========================================
   SHIPPING
========================================= */

const freeShippingMinimum =
    Number(
        storeSettings.freeShippingMinimum || 999
    );

const shippingCharge =
    Number(
        storeSettings.shippingCharge || 50
    );


const qualifiesForFreeShipping =
    subtotal >= freeShippingMinimum;


const shipping =
    qualifiesForFreeShipping
    ? 0
    : shippingCharge;


const total =
    subtotal + shipping;


/* =========================================
   FREE SHIPPING MESSAGE
========================================= */

let shippingMessage = "";

let progress = 0;


if (qualifiesForFreeShipping) {

    shippingMessage = `
        <strong>
            ✦ You've unlocked FREE shipping!
        </strong>
        <br>
        Your order qualifies for complimentary delivery.
    `;

    progress = 100;

}
else {

    const remaining =
        freeShippingMinimum - subtotal;

    progress =
        Math.min(
            100,
            Math.round(
                (subtotal / freeShippingMinimum) * 100
            )
        );

    shippingMessage = `
        Add
        <strong>
            ₹${remaining.toLocaleString("en-IN")}
        </strong>
        more to unlock
        <strong>
            FREE shipping
        </strong>
    `;

}


/* =========================================
   FINAL CART HTML
========================================= */

container.innerHTML = `

    <div class="cart-layout">


        <!-- =================================
             LEFT — PRODUCTS
        ================================= -->

        <section class="cart-products">

            ${items}

        </section>


        <!-- =================================
             RIGHT — SUMMARY
        ================================= -->

        <aside class="cart-summary">


            <h2>
                Order Summary
            </h2>


            <!-- SHIPPING PROGRESS -->

            <div class="shipping-progress">

                ${shippingMessage}


                <div class="progress-bar">

                    <div
                        class="progress-fill"
                        style="width:${progress}%"
                    ></div>

                </div>

            </div>


            <!-- SUBTOTAL -->

            <div class="summary-row">

                <span>
                    Subtotal
                </span>

                <strong>
                    ₹${subtotal.toLocaleString("en-IN")}
                </strong>

            </div>


            <!-- SHIPPING -->

            <div class="summary-row">

                <span>
                    Shipping
                </span>

                <strong>

                    ${
                        shipping === 0
                        ?
                        "FREE"
                        :
                        "₹" +
                        shipping.toLocaleString("en-IN")
                    }

                </strong>

            </div>


            <!-- TOTAL -->

            <div class="summary-row summary-total">

                <span>
                    Total
                </span>

                <strong>
                    ₹${total.toLocaleString("en-IN")}
                </strong>

            </div>


            <!-- CHECKOUT -->

            <a
                href="checkout.html"
                class="checkout-btn"
            >
                Proceed to Checkout
            </a>


            <!-- CONTINUE SHOPPING -->

            <a
                href="shop.html"
                class="continue-shopping"
            >
                Continue Shopping
            </a>


            <!-- TRUST -->

            <div class="cart-trust">

                <div class="trust-item">

                    <span>
                        ♢
                    </span>

                    Secure<br>
                    Checkout

                </div>


                <div class="trust-item">

                    <span>
                        ✦
                    </span>

                    Anti-Tarnish<br>
                    Jewelry

                </div>


                <div class="trust-item">

                    <span>
                        ↺
                    </span>

                    7-Day<br>
                    Returns

                </div>

            </div>


        </aside>

    </div>

`;

}



/* =========================================================
   CHECKOUT
========================================================= */

function renderCheckout() {

    const container =
        document.getElementById(
            "checkoutItems"
        );


    if (!container) return;


    const cart = getCart();


    if (!cart.length) {

        container.innerHTML =
            "<p>Your cart is empty.</p>";

        return;

    }


    let subtotal = 0;


    container.innerHTML =
        cart.map(item => {

            const quantity =
                Number(
                    item.quantity || 1
                );


            const price =
                Number(
                    item.price || 0
                );


            subtotal +=
                price * quantity;


            return `

                <div class="sum">

                    <span>

                        ${escapeHTML(
                            item.name
                        )}

                        × ${quantity}

                    </span>

                    <b>

                        ₹${(
                            price *
                            quantity
                        ).toLocaleString("en-IN")}

                    </b>

                </div>

            `;

        }).join("");


    const shipping =
        calculateShipping(subtotal);


    const total =
        subtotal + shipping;


    const subTotal =
        document.getElementById(
            "subTotal"
        );


    const grandTotal =
        document.getElementById(
            "grandTotal"
        );


    if (subTotal) {

        subTotal.textContent =
            "₹" +
            subtotal.toLocaleString(
                "en-IN"
            );

    }


    if (grandTotal) {

        grandTotal.textContent =
            "₹" +
            total.toLocaleString(
                "en-IN"
            );

    }

}


/* =========================================================
   PLACE ORDER
========================================================= */

async function placeOrder(event) {

    event.preventDefault();


    const form = event.target;


    const inputs =
        form.querySelectorAll("input");


    const name =
        inputs[0]?.value.trim() || "";


    const phone =
        inputs[1]?.value.trim() || "";


    const address =
        inputs[2]?.value.trim() || "";


    const city =
        inputs[3]?.value.trim() || "";


    const state =
        inputs[4]?.value.trim() || "";


    const pincode =
        inputs[5]?.value.trim() || "";


    const payment =
        form.querySelector(
            'input[name="pay"]:checked'
        );


    if (!payment) {

        toast(
            "Please select a payment method."
        );

        return;

    }


    const paymentMethod =
        payment.parentElement
            ?.textContent
            ?.trim() ||
        "Payment";


    const cart = getCart();


    if (!cart.length) {

        toast(
            "Your cart is empty."
        );

        return;

    }


    let subtotal = 0;


    const items =
        cart.map(item => {

            const quantity =
                Number(
                    item.quantity || 1
                );


            const price =
                Number(
                    item.price || 0
                );


            subtotal +=
                price * quantity;


            return {

                id: item.id,

                name: item.name,

                price,

                quantity

            };

        });


    const shipping =
        calculateShipping(subtotal);


    const total =
        subtotal + shipping;


    try {

        const { db } =
            await import(
                "./firebase.js"
            );


        const {
            collection,
            addDoc,
            serverTimestamp
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        await addDoc(
            collection(
                db,
                "orders"
            ),
            {

                customerName: name,

                phone,

                address,

                city,

                state,

                pincode,

                items,

                subtotal,

                shipping,

                total,

                paymentMethod,

                paymentStatus:
                    "Pending",

                orderStatus:
                    "Pending",

                createdAt:
                    serverTimestamp()

            }
        );


        saveCart([]);


        toast(
            "Order placed successfully."
        );


        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 800);

    }

    catch (error) {

        console.error(
            "Order error:",
            error
        );


        toast(
            "Could not place order. Please try again."
        );

    }

}


/* =========================================================
   NEWSLETTER
========================================================= */

async function subscribe(event) {

    event.preventDefault();


    const form = event.target;


    const email =
        form.querySelector(
            "input[type='email']"
        )
        ?.value
        .trim();


    if (!email) return;


    try {

        const { db } =
            await import(
                "./firebase.js"
            );


        const {
            collection,
            addDoc,
            serverTimestamp
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        await addDoc(
            collection(
                db,
                "subscribers"
            ),
            {

                email,

                createdAt:
                    serverTimestamp()

            }
        );


        form.reset();


        toast(
            "Thanks for subscribing!"
        );

    }

    catch (error) {

        console.error(
            "Newsletter error:",
            error
        );


        toast(
            "Could not subscribe right now."
        );

    }

}


/* =========================================================
   CONTACT
========================================================= */

async function contactSubmit(event) {

    event.preventDefault();


    const form = event.target;


    const inputs =
        form.querySelectorAll(
            "input"
        );


    const name =
        inputs[0]?.value.trim() ||
        "";


    const email =
        inputs[1]?.value.trim() ||
        "";


    const orderNumber =
        inputs[2]?.value.trim() ||
        "";


    const message =
        form.querySelector(
            "textarea"
        )
        ?.value
        .trim() ||
        "";


    try {

        const { db } =
            await import(
                "./firebase.js"
            );


        const {
            collection,
            addDoc,
            serverTimestamp
        } =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        await addDoc(
            collection(
                db,
                "contacts"
            ),
            {

                name,

                email,

                orderNumber,

                message,

                status:
                    "new",

                createdAt:
                    serverTimestamp()

            }
        );


        form.reset();


        toast(
            "Message sent successfully."
        );

    }

    catch (error) {

        console.error(
            "Contact error:",
            error
        );


        toast(
            "Could not send your message."
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function toggleSearch() {

    const searchbar =
        document.getElementById(
            "searchbar"
        );


    if (!searchbar) return;


    searchbar.classList.toggle(
        "show"
    );


    if (
        searchbar.classList.contains(
            "show"
        )
    ) {

        document
            .getElementById(
                "searchInput"
            )
            ?.focus();

    }

}


function liveSearch(query) {

    const results =
        document.getElementById(
            "searchResults"
        );


    if (!results) return;


    const value =
        String(
            query || ""
        )
        .trim()
        .toLowerCase();


    if (!value) {

        results.innerHTML = "";

        return;

    }


    const matches =
        getProducts()
            .filter(product => {

                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();


                const category =
                    String(
                        product.cat || ""
                    ).toLowerCase();


                return (
                    name.includes(value) ||
                    category.includes(value)
                );

            })
            .slice(0, 8);


    if (!matches.length) {

        results.innerHTML =
            "<p>No products found.</p>";

        return;

    }


    results.innerHTML =
        matches
            .map(product => `

                <a
                    href="product.html?id=${encodeURIComponent(product.id)}"
                >

                    ${escapeHTML(
                        product.name
                    )}

                </a>

            `)
            .join("");

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateCartCount();

        loadFirebaseProducts();

    }
);


/* =========================================================
   INLINE HTML HANDLERS
========================================================= */

window.toggleSearch =
    toggleSearch;

window.liveSearch =
    liveSearch;

window.applyFilters =
    applyFilters;

window.sortProducts =
    sortProducts;

window.addToCart =
    addToCart;

window.changeCart =
    changeCart;

window.removeCart =
    removeCart;

window.changeDetailQty =
    changeDetailQty;

window.addDetail =
    addDetail;

window.buyNow =
    buyNow;

window.placeOrder =
    placeOrder;

window.subscribe =
    subscribe;

window.contactSubmit =
    contactSubmit;
