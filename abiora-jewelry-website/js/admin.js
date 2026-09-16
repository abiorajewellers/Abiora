import {
    auth,
    db,
    firebaseConfig
}
from "./firebase.js";


import {
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile
}
from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    initializeApp,
    getApps
}
from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";


import {
    getAuth,
    signInWithEmailAndPassword,
    signOut as secondarySignOut
}
from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
}
from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentAdmin = null;

let products = [];

let orders = [];

let messages = [];

let admins = [];

let currentEditingProduct = null;

let currentProductImage = "";

let currentReport = null;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatCurrency(value) {

    const number =
        Number(value || 0);

    return "₹" +
        number.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 0
            }
        );

}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    try {

        let date;

        if (
            value &&
            typeof value.toDate === "function"
        ) {

            date = value.toDate();

        }

        else if (value instanceof Date) {

            date = value;

        }

        else if (typeof value === "number") {

            date = new Date(value);

        }

        else {

            date = new Date(value);

        }

        if (isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }

    catch {

        return "—";

    }

}


function showToast(
    message,
    type = "success"
) {

    const toast =
        $("adminToast");

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.className =
        "admin-toast show " +
        type;

    clearTimeout(
        window.__abioraToastTimer
    );

    window.__abioraToastTimer =
        setTimeout(
            () => {

                toast.className =
                    "admin-toast";

            },
            3000
        );

}


function getOrderTotal(order) {

    return Number(
        order.total ??
        order.grandTotal ??
        order.amount ??
        order.price ??
        0
    );

}


function getOrderCustomer(order) {

    return (
        order.customerName ||
        order.name ||
        order.customer ||
        order.fullName ||
        "Guest"
    );

}


function getOrderEmail(order) {

    return (
        order.email ||
        order.customerEmail ||
        "—"
    );

}


function getOrderStatus(order) {

    return (
        order.status ||
        order.orderStatus ||
        "Pending"
    );

}


function getOrderDate(order) {

    return (
        order.createdAt ||
        order.date ||
        order.orderDate ||
        null
    );

}


function getDateValue(value) {

    if (!value) {
        return 0;
    }

    try {

        if (
            typeof value.toDate === "function"
        ) {

            return value.toDate().getTime();

        }

        const date =
            new Date(value);

        return isNaN(
            date.getTime()
        )
            ? 0
            : date.getTime();

    }

    catch {

        return 0;

    }

}


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "account.html"
            );

            return;

        }

        try {

            const adminRef =
                doc(
                    db,
                    "admins",
                    user.uid
                );

            const adminSnap =
                await getDoc(
                    adminRef
                );

            if (!adminSnap.exists()) {

                await signOut(auth);

                alert(
                    "You do not have administrator access."
                );

                window.location.replace(
                    "account.html"
                );

                return;

            }

            const adminData =
                adminSnap.data();

            if (
                adminData.active !== true
            ) {

                await signOut(auth);

                alert(
                    "This administrator account has been disabled."
                );

                window.location.replace(
                    "account.html"
                );

                return;

            }

            currentAdmin = {

                uid:
                    user.uid,

                email:
                    user.email || "",

                name:
                    adminData.name ||
                    user.displayName ||
                    "Administrator",

                role:
                    adminData.role ||
                    "admin",

                active:
                    adminData.active === true

            };

            const welcome =
                $("adminWelcome");

            if (welcome) {

                welcome.textContent =
                    `Welcome, ${currentAdmin.name}`;

            }

            await initializeAdmin();

        }

        catch (error) {

            console.error(
                "ADMIN AUTH ERROR:",
                error
            );

            showToast(
                error.message ||
                "Unable to verify administrator.",
                "error"
            );

        }

    }
);


/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

async function initializeAdmin() {

    setupTabs();

    setupForms();

    setupImagePreview();

    setupModalEvents();

    setupReportControls();

    await Promise.all([
        loadProducts(),
        loadOrders(),
        loadMessages(),
        loadAdmins(),
        loadSettings()
    ]);

    updateDashboard();

    generateReport();

}


/* =========================================================
   TABS
========================================================= */

function setupTabs() {

    const tabs =
        document.querySelectorAll(
            ".admin-tab"
        );

    tabs.forEach(
        (tab) => {

            tab.addEventListener(
                "click",
                () => {

                    const target =
                        tab.dataset.tab;

                    tabs.forEach(
                        (item) => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );

                    document
                        .querySelectorAll(
                            ".admin-panel"
                        )
                        .forEach(
                            (panel) => {

                                panel.classList.remove(
                                    "active"
                                );

                            }
                        );

                    tab.classList.add(
                        "active"
                    );

                    const panel =
                        $(target);

                    if (panel) {

                        panel.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts() {

    const table =
        $("productsTable");

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );

        products =
            snapshot.docs.map(
                (item) => {

                    const data =
                        item.data();

                    return {

                        id:
                            item.id,

                        name:
                            data.name || "",

                        category:
                            data.category ||
                            data.cat ||
                            "",

                        price:
                            Number(
                                data.price || 0
                            ),

                        costPrice:
                            Number(
                                data.costPrice ??
                                data.cost ??
                                0
                            ),

                        oldPrice:
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

                        image:
                            data.image ||
                            data.img ||
                            "",

                        description:
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

                }
            );

        products.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );

        renderProducts();

    }

    catch (error) {

        console.error(
            "LOAD PRODUCTS ERROR:",
            error
        );

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="7"
                        style="text-align:center;padding:30px;color:#9b3131;">
                        Unable to load products.
                    </td>
                </tr>
            `;

        }

        showToast(
            "Unable to load products.",
            "error"
        );

    }

}


function renderProducts() {

    const table =
        $("productsTable");

    if (!table) {
        return;
    }

    if (!products.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="admin-empty">
                        No products found.
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML =
        products.map(
            (product) => {

                const image =
                    product.image
                        ? `
                            <img
                                class="admin-product-image"
                                src="${escapeHTML(product.image)}"
                                alt="${escapeHTML(product.name)}"
                            >
                          `
                        : `
                            <div
                                class="admin-product-image"
                                style="
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    font-size:11px;
                                    color:#999;
                                "
                            >
                                No image
                            </div>
                          `;

                return `
                    <tr>

                        <td>
                            ${image}
                        </td>

                        <td>
                            <strong>
                                ${escapeHTML(product.name)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(product.category)}
                        </td>

                        <td>
                            ${formatCurrency(product.price)}
                        </td>

                        <td>
                            ${product.stock}
                        </td>

                        <td>
                            ${product.featured ? "Yes" : "No"}
                        </td>

                        <td>

                            <div class="product-action-buttons">

                                <button
                                    type="button"
                                    class="admin-btn small-action"
                                    onclick="editProduct('${product.id}')"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="admin-btn danger small-action"
                                    onclick="deleteProduct('${product.id}')"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function setupImagePreview() {

    const input =
        $("productImage");

    if (!input) {
        return;
    }

    input.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];

            if (!file) {
                return;
            }

            if (
                ![
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ].includes(file.type)
            ) {

                showToast(
                    "Please select JPG, JPEG, PNG or WebP.",
                    "error"
                );

                input.value = "";

                return;

            }

            if (
                file.size >
                5 * 1024 * 1024
            ) {

                showToast(
                    "Image must be smaller than 5 MB.",
                    "error"
                );

                input.value = "";

                return;

            }

            const reader =
                new FileReader();

            reader.onload =
                (event) => {

                    const preview =
                        $("productImagePreview");

                    const image =
                        $("productImagePreviewImg");

                    if (
                        preview &&
                        image
                    ) {

                        image.src =
                            event.target.result;

                        preview.style.display =
                            "block";

                    }

                };

            reader.readAsDataURL(file);

        }
    );

}


function compressImage(
    file,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.78
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onerror =
                () => reject(
                    new Error(
                        "Unable to read image."
                    )
                );

            reader.onload =
                () => {

                    const image =
                        new Image();

                    image.onerror =
                        () => reject(
                            new Error(
                                "Invalid image."
                            )
                        );

                    image.onload =
                        () => {

                            let width =
                                image.width;

                            let height =
                                image.height;

                            const ratio =
                                Math.min(
                                    1,
                                    maxWidth / width,
                                    maxHeight / height
                                );

                            width =
                                Math.round(
                                    width * ratio
                                );

                            height =
                                Math.round(
                                    height * ratio
                                );

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                width;

                            canvas.height =
                                height;

                            const context =
                                canvas.getContext(
                                    "2d"
                                );

                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );

                            const result =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    quality
                                );

                            resolve(result);

                        };

                    image.src =
                        reader.result;

                };

            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   PRODUCT MODAL
========================================================= */

window.openProductModal =
    function () {

        currentEditingProduct =
            null;

        currentProductImage =
            "";

        const form =
            $("productForm");

        if (form) {
            form.reset();
        }

        $("productId").value = "";

        $("productModalTitle").textContent =
            "Add Product";

        $("saveProductButton").textContent =
            "Save Product";

        $("productImagePreview").style.display =
            "none";

        $("currentImageLabel").style.display =
            "none";

        $("productModal").classList.add(
            "show"
        );

    };


window.closeProductModal =
    function () {

        $("productModal").classList.remove(
            "show"
        );

        currentEditingProduct =
            null;

        currentProductImage =
            "";

    };


window.editProduct =
    function (productId) {

        const product =
            products.find(
                item =>
                    item.id === productId
            );

        if (!product) {

            showToast(
                "Product not found.",
                "error"
            );

            return;

        }

        currentEditingProduct =
            product;

        currentProductImage =
            product.image || "";

        $("productId").value =
            product.id;

        $("productName").value =
            product.name;

        $("productCategory").value =
            product.category;

        $("productPrice").value =
            product.price;

        $("productCostPrice").value =
            product.costPrice || "";

        $("productOldPrice").value =
            product.oldPrice || "";

        $("productStock").value =
            product.stock;

        $("productRating").value =
            product.rating;

        $("productReviews").value =
            product.reviews;

        $("productDescription").value =
            product.description;

        $("productMaterial").value =
            product.material;

        $("productFeatured").checked =
            product.featured;

        $("productImage").value =
            "";

        $("productModalTitle").textContent =
            "Edit Product";

        $("saveProductButton").textContent =
            "Update Product";

        const preview =
            $("productImagePreview");

        const previewImage =
            $("productImagePreviewImg");

        if (
            product.image &&
            preview &&
            previewImage
        ) {

            previewImage.src =
                product.image;

            preview.style.display =
                "block";

            $("currentImageLabel").style.display =
                "block";

        }

        else {

            preview.style.display =
                "none";

            $("currentImageLabel").style.display =
                "none";

        }

        $("productModal").classList.add(
            "show"
        );

    };


/* =========================================================
   SAVE PRODUCT
========================================================= */

async function saveProduct(event) {

    event.preventDefault();

    const button =
        $("saveProductButton");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Saving...";

    }

    try {

        const id =
            $("productId").value.trim();

        const name =
            $("productName").value.trim();

        const category =
            $("productCategory").value;

        const price =
            Number(
                $("productPrice").value || 0
            );

        const costPrice =
            Number(
                $("productCostPrice").value || 0
            );

        const oldPrice =
            Number(
                $("productOldPrice").value || 0
            );

        const stock =
            Number(
                $("productStock").value || 0
            );

        const rating =
            Number(
                $("productRating").value || 0
            );

        const reviews =
            Number(
                $("productReviews").value || 0
            );

        const description =
            $("productDescription").value.trim();

        const material =
            $("productMaterial").value.trim();

        const featured =
            $("productFeatured").checked;

        if (!name) {

            throw new Error(
                "Please enter a product name."
            );

        }

        if (!category) {

            throw new Error(
                "Please select a category."
            );

        }

        if (price < 0) {

            throw new Error(
                "Price cannot be negative."
            );

        }

        if (costPrice < 0) {

            throw new Error(
                "Cost price cannot be negative."
            );

        }

        let image =
            currentProductImage;

        const imageInput =
            $("productImage");

        const file =
            imageInput?.files?.[0];

        if (file) {

            showToast(
                "Compressing image...",
                "success"
            );

            image =
                await compressImage(
                    file
                );

            if (
                image.length >
                900000
            ) {

                image =
                    await compressImage(
                        file,
                        1000,
                        1000,
                        0.60
                    );

            }

            if (
                image.length >
                1000000
            ) {

                throw new Error(
                    "Image is still too large after compression. Please choose a smaller image."
                );

            }

        }

        const productData = {

            name,

            category,

            price,

            costPrice,

            oldPrice,

            stock,

            rating,

            reviews,

            image,

            description,

            material,

            featured,

            updatedAt:
                serverTimestamp()

        };

        if (id) {

            await updateDoc(
                doc(
                    db,
                    "products",
                    id
                ),
                productData
            );

            showToast(
                "Product updated successfully."
            );

        }

        else {

            productData.createdAt =
                serverTimestamp();

            await addDoc(
                collection(
                    db,
                    "products"
                ),
                productData
            );

            showToast(
                "Product added successfully."
            );

        }

        closeProductModal();

        await loadProducts();

        updateDashboard();

        generateReport();

    }

    catch (error) {

        console.error(
            "SAVE PRODUCT ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to save product.",
            "error"
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                $("productId").value
                    ? "Update Product"
                    : "Save Product";

        }

    }

}


window.deleteProduct =
    async function (productId) {

        const product =
            products.find(
                item =>
                    item.id === productId
            );

        if (!product) {
            return;
        }

        const confirmed =
            confirm(
                `Delete "${product.name}"?\n\nThis cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {

            await deleteDoc(
                doc(
                    db,
                    "products",
                    productId
                )
            );

            showToast(
                "Product deleted successfully."
            );

            await loadProducts();

            updateDashboard();

            generateReport();

        }

        catch (error) {

            console.error(
                "DELETE PRODUCT ERROR:",
                error
            );

            showToast(
                error.message ||
                "Unable to delete product.",
                "error"
            );

        }

    };


/* =========================================================
   ORDERS
========================================================= */

async function loadOrders() {

    const table =
        $("ordersTable");

    try {

        let snapshot;

        try {

            const ordersQuery =
                query(
                    collection(
                        db,
                        "orders"
                    ),
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                );

            snapshot =
                await getDocs(
                    ordersQuery
                );

        }

        catch {

            snapshot =
                await getDocs(
                    collection(
                        db,
                        "orders"
                    )
                );

        }

        orders =
            snapshot.docs.map(
                item => ({
                    id:
                        item.id,

                    ...item.data()
                })
            );

        orders.sort(
            (a, b) =>
                getDateValue(
                    getOrderDate(b)
                ) -
                getDateValue(
                    getOrderDate(a)
                )
        );

        renderOrders();

    }

    catch (error) {

        console.error(
            "LOAD ORDERS ERROR:",
            error
        );

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="admin-empty">
                            Unable to load orders.
                        </div>
                    </td>
                </tr>
            `;

        }

    }

}


function renderOrders() {

    const table =
        $("ordersTable");

    if (!table) {
        return;
    }

    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="admin-empty">
                        No orders yet.
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML =
        orders.map(
            order => {

                const status =
                    getOrderStatus(
                        order
                    );

                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(order.id)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                getOrderCustomer(order)
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                getOrderEmail(order)
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                getOrderTotal(order)
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                getOrderDate(order)
                            )}
                        </td>

                        <td>

                            <select
                                class="status-select"
                                data-order-id="${escapeHTML(order.id)}"
                            >

                                ${orderStatusOption(
                                    "Pending",
                                    status
                                )}

                                ${orderStatusOption(
                                    "Confirmed",
                                    status
                                )}

                                ${orderStatusOption(
                                    "Processing",
                                    status
                                )}

                                ${orderStatusOption(
                                    "Shipped",
                                    status
                                )}

                                ${orderStatusOption(
                                    "Delivered",
                                    status
                                )}

                                ${orderStatusOption(
                                    "Cancelled",
                                    status
                                )}

                            </select>

                        </td>

                    </tr>
                `;

            }
        ).join("");

    table
        .querySelectorAll(
            ".status-select"
        )
        .forEach(
            select => {

                select.addEventListener(
                    "change",
                    async () => {

                        await updateOrderStatus(
                            select.dataset.orderId,
                            select.value
                        );

                    }
                );

            }
        );

}


function orderStatusOption(
    value,
    selected
) {

    return `
        <option
            value="${value}"
            ${value === selected ? "selected" : ""}
        >
            ${value}
        </option>
    `;

}


async function updateOrderStatus(
    orderId,
    status
) {

    try {

        await updateDoc(
            doc(
                db,
                "orders",
                orderId
            ),
            {
                status,
                updatedAt:
                    serverTimestamp()
            }
        );

        const order =
            orders.find(
                item =>
                    item.id === orderId
            );

        if (order) {
            order.status =
                status;
        }

        updateDashboard();

        generateReport();

        showToast(
            "Order status updated."
        );

    }

    catch (error) {

        console.error(
            "ORDER STATUS ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to update order.",
            "error"
        );

    }

}


/* =========================================================
   REPORTS
========================================================= */

function setupReportControls() {

    const generateButton =
        $("generateReportButton");

    const downloadButton =
        $("downloadReportButton");

    if (generateButton) {

        generateButton.addEventListener(
            "click",
            generateReport
        );

    }

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            downloadReportCSV
        );

    }

}


function getReportDateRange() {

    const startInput =
        $("reportStartDate");

    const endInput =
        $("reportEndDate");

    let startDate = null;
    let endDate = null;

    if (
        startInput &&
        startInput.value
    ) {

        startDate =
            new Date(
                startInput.value +
                "T00:00:00"
            );

    }

    if (
        endInput &&
        endInput.value
    ) {

        endDate =
            new Date(
                endInput.value +
                "T23:59:59.999"
            );

    }

    return {
        startDate,
        endDate
    };

}


function getFilteredOrders() {

    const {
        startDate,
        endDate
    } =
        getReportDateRange();

    return orders.filter(
        order => {

            const timestamp =
                getDateValue(
                    getOrderDate(order)
                );

            if (!timestamp) {
                return false;
            }

            const date =
                new Date(timestamp);

            if (
                startDate &&
                date < startDate
            ) {
                return false;
            }

            if (
                endDate &&
                date > endDate
            ) {
                return false;
            }

            return true;

        }
    );

}


function getProductForOrderItem(item) {

    const id =
        item.id ||
        item.productId;

    if (!id) {
        return null;
    }

    return products.find(
        product =>
            product.id === id
    ) || null;

}


function getItemCostPrice(item) {

    /*
        First use costPrice saved in the order item.
        This is the most accurate historical value.
    */

    if (
        item.costPrice !== undefined &&
        item.costPrice !== null
    ) {

        return Number(
            item.costPrice
        );

    }

    /*
        Fallback to the current product cost price.
    */

    const product =
        getProductForOrderItem(
            item
        );

    if (product) {

        return Number(
            product.costPrice || 0
        );

    }

    return 0;

}


function getOrderItems(order) {

    if (
        Array.isArray(order.items)
    ) {

        return order.items;

    }

    if (
        Array.isArray(order.products)
    ) {

        return order.products;

    }

    return [];

}


function calculateOrderCost(order) {

    const items =
        getOrderItems(
            order
        );

    let cost = 0;

    let missingCostItems = 0;

    items.forEach(
        item => {

            const quantity =
                Number(
                    item.quantity ||
                    item.qty ||
                    1
                );

            const itemCost =
                getItemCostPrice(
                    item
                );

            if (
                itemCost <= 0
            ) {

                missingCostItems +=
                    quantity;

            }

            cost +=
                itemCost *
                quantity;

        }
    );

    return {
        cost,
        missingCostItems
    };

}


function generateReport() {

    if (
        !$("panel-reports")
    ) {
        return;
    }

    const filteredOrders =
        getFilteredOrders();

    const validOrders =
        filteredOrders.filter(
            order =>
                String(
                    getOrderStatus(order)
                ).toLowerCase() !==
                "cancelled"
        );

    let revenue = 0;

    let productCost = 0;

    let itemsSold = 0;

    let shippingCollected = 0;

    let missingCostItems = 0;

    const productStats = {};

    filteredOrders.forEach(
        order => {

            const status =
                String(
                    getOrderStatus(order)
                ).toLowerCase();

            if (
                status === "cancelled"
            ) {
                return;
            }

            const total =
                getOrderTotal(
                    order
                );

            revenue +=
                total;

            shippingCollected +=
                Number(
                    order.shipping ||
                    order.shippingCharge ||
                    0
                );

            const costResult =
                calculateOrderCost(
                    order
                );

            productCost +=
                costResult.cost;

            missingCostItems +=
                costResult.missingCostItems;

            const items =
                getOrderItems(
                    order
                );

            items.forEach(
                item => {

                    const quantity =
                        Number(
                            item.quantity ||
                            item.qty ||
                            1
                        );

                    itemsSold +=
                        quantity;

                    const product =
                        getProductForOrderItem(
                            item
                        );

                    const productId =
                        item.id ||
                        item.productId ||
                        "unknown";

                    const name =
                        item.name ||
                        product?.name ||
                        "Unknown Product";

                    const sellingPrice =
                        Number(
                            item.price ||
                            item.unitPrice ||
                            product?.price ||
                            0
                        );

                    if (
                        !productStats[productId]
                    ) {

                        productStats[productId] = {

                            id:
                                productId,

                            name,

                            quantity:
                                0,

                            revenue:
                                0,

                            cost:
                                0

                        };

                    }

                    productStats[productId].quantity +=
                        quantity;

                    productStats[productId].revenue +=
                        sellingPrice *
                        quantity;

                    productStats[productId].cost +=
                        getItemCostPrice(item) *
                        quantity;

                }
            );

        }
    );

    const profit =
        revenue -
        productCost;

    const margin =
        revenue > 0
            ? (profit / revenue) * 100
            : 0;

    const averageOrder =
        validOrders.length > 0
            ? revenue / validOrders.length
            : 0;

    const cancelled =
        filteredOrders.filter(
            order =>
                String(
                    getOrderStatus(order)
                ).toLowerCase() ===
                "cancelled"
        ).length;

    const statusCounts = {

        Pending: 0,

        Confirmed: 0,

        Processing: 0,

        Shipped: 0,

        Delivered: 0,

        Cancelled: 0

    };

    filteredOrders.forEach(
        order => {

            const rawStatus =
                getOrderStatus(
                    order
                );

            const key =
                Object.keys(
                    statusCounts
                ).find(
                    status =>
                        status.toLowerCase() ===
                        String(
                            rawStatus
                        ).toLowerCase()
                );

            if (key) {

                statusCounts[key]++;

            }

            else {

                statusCounts.Pending++;

            }

        }
    );

    currentReport = {

        orders:
            filteredOrders,

        validOrders,

        revenue,

        productCost,

        profit,

        margin,

        averageOrder,

        itemsSold,

        cancelled,

        shippingCollected,

        missingCostItems,

        productStats,

        statusCounts

    };

    renderReport(
        currentReport
    );

}


function renderReport(report) {

    if ($("reportRevenue")) {

        $("reportRevenue").textContent =
            formatCurrency(
                report.revenue
            );

    }

    if ($("reportCost")) {

        $("reportCost").textContent =
            formatCurrency(
                report.productCost
            );

    }

    if ($("reportProfit")) {

        $("reportProfit").textContent =
            formatCurrency(
                report.profit
            );

        $("reportProfit").style.color =
            report.profit < 0
                ? "#9b3131"
                : "#557a54";

    }

    if ($("reportMargin")) {

        $("reportMargin").textContent =
            report.margin.toFixed(1) +
            "%";

    }

    if ($("reportOrders")) {

        $("reportOrders").textContent =
            report.validOrders.length;

    }

    if ($("reportItems")) {

        $("reportItems").textContent =
            report.itemsSold;

    }

    if ($("reportCancelled")) {

        $("reportCancelled").textContent =
            report.cancelled;

    }

    if ($("reportAverageOrder")) {

        $("reportAverageOrder").textContent =
            formatCurrency(
                report.averageOrder
            );

    }

    renderReportStatus(
        report
    );

    renderReportProducts(
        report
    );

}


function renderReportStatus(report) {

    const container =
        $("reportStatusBreakdown");

    if (!container) {
        return;
    }

    const rows =
        Object.entries(
            report.statusCounts
        )
        .map(
            ([status, count]) => {

                return `
                    <div class="report-row">

                        <span class="report-row-label">
                            ${escapeHTML(status)}
                        </span>

                        <span class="report-row-value">
                            ${count}
                        </span>

                    </div>
                `;

            }
        )
        .join("");

    container.innerHTML = `

        ${rows}

        <div class="report-row">

            <span class="report-row-label">
                Shipping Collected
            </span>

            <span class="report-row-value">
                ${formatCurrency(
                    report.shippingCollected
                )}
            </span>

        </div>

        ${
            report.missingCostItems > 0

                ? `

                    <div class="report-warning">

                        Cost price is missing for
                        <strong>
                            ${report.missingCostItems}
                        </strong>
                        item(s).

                        Profit may therefore be
                        understated or inaccurate.

                    </div>

                  `

                : ""
        }

    `;

}


function renderReportProducts(report) {

    const container =
        $("reportProductBreakdown");

    if (!container) {
        return;
    }

    const productsList =
        Object.values(
            report.productStats
        )
        .sort(
            (a, b) =>
                b.revenue -
                a.revenue
        )
        .slice(
            0,
            10
        );

    if (!productsList.length) {

        container.innerHTML = `
            <div class="admin-empty">
                No product sales in this period.
            </div>
        `;

        return;

    }

    container.innerHTML =
        productsList.map(
            product => {

                const productProfit =
                    product.revenue -
                    product.cost;

                return `
                    <div class="report-row">

                        <div>

                            <div
                                style="
                                    font-weight:600;
                                    color:#2d2925;
                                "
                            >
                                ${escapeHTML(
                                    product.name
                                )}
                            </div>

                            <div
                                style="
                                    margin-top:3px;
                                    color:#999;
                                    font-size:11px;
                                "
                            >
                                ${product.quantity}
                                item(s)
                            </div>

                        </div>

                        <div
                            style="
                                text-align:right;
                            "
                        >

                            <div class="report-row-value">
                                ${formatCurrency(
                                    product.revenue
                                )}
                            </div>

                            <div
                                style="
                                    margin-top:3px;
                                    color:${
                                        productProfit < 0
                                            ? "#9b3131"
                                            : "#557a54"
                                    };
                                    font-size:11px;
                                "
                            >
                                Profit:
                                ${formatCurrency(
                                    productProfit
                                )}
                            </div>

                        </div>

                    </div>
                `;

            }
        ).join("");

}


/* =========================================================
   CSV EXPORT
========================================================= */

function csvEscape(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    const text =
        String(value);

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n") ||
        text.includes("\r")
    ) {

        return '"' +
            text.replace(
                /"/g,
                '""'
            ) +
            '"';

    }

    return text;

}


function downloadCSV(
    filename,
    rows
) {

    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            csvEscape
                        )
                        .join(",")
            )
            .join("\r\n");

    const blob =
        new Blob(
            [
                "\uFEFF" +
                csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        filename;

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    URL.revokeObjectURL(
        url
    );

}


function downloadReportCSV() {

    if (!currentReport) {

        generateReport();

    }

    if (!currentReport) {

        showToast(
            "Unable to generate report.",
            "error"
        );

        return;

    }

    const report =
        currentReport;

    const rows = [];

    const today =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );

    rows.push([
        "ABIORA BUSINESS REPORT"
    ]);

    rows.push([
        "Generated",
        new Date().toLocaleString(
            "en-IN"
        )
    ]);

    rows.push([]);

    rows.push([
        "BUSINESS SUMMARY"
    ]);

    rows.push([
        "Metric",
        "Value"
    ]);

    rows.push([
        "Revenue",
        report.revenue
    ]);

    rows.push([
        "Product Cost",
        report.productCost
    ]);

    rows.push([
        "Gross Profit",
        report.profit
    ]);

    rows.push([
        "Profit Margin",
        report.margin.toFixed(2) + "%"
    ]);

    rows.push([
        "Orders",
        report.validOrders.length
    ]);

    rows.push([
        "Items Sold",
        report.itemsSold
    ]);

    rows.push([
        "Cancelled Orders",
        report.cancelled
    ]);

    rows.push([
        "Average Order Value",
        report.averageOrder
    ]);

    rows.push([
        "Shipping Collected",
        report.shippingCollected
    ]);

    rows.push([
        "Items With Missing Cost",
        report.missingCostItems
    ]);

    rows.push([]);

    rows.push([
        "ORDER DETAILS"
    ]);

    rows.push([
        "Order ID",
        "Date",
        "Customer",
        "Email",
        "Status",
        "Payment Method",
        "Subtotal",
        "Shipping",
        "Total",
        "Product Cost",
        "Gross Profit"
    ]);

    report.orders.forEach(
        order => {

            const status =
                getOrderStatus(
                    order
                );

            const costResult =
                calculateOrderCost(
                    order
                );

            const total =
                getOrderTotal(
                    order
                );

            const orderProfit =
                String(
                    status
                ).toLowerCase() ===
                "cancelled"
                    ? 0
                    : total -
                      costResult.cost;

            rows.push([

                order.id,

                formatDate(
                    getOrderDate(order)
                ),

                getOrderCustomer(
                    order
                ),

                getOrderEmail(
                    order
                ),

                status,

                order.paymentMethod ||
                order.payment ||
                "—",

                Number(
                    order.subtotal ||
                    order.subTotal ||
                    0
                ),

                Number(
                    order.shipping ||
                    order.shippingCharge ||
                    0
                ),

                total,

                costResult.cost,

                orderProfit

            ]);

        }
    );

    rows.push([]);

    rows.push([
        "PRODUCT SALES"
    ]);

    rows.push([
        "Product",
        "Quantity Sold",
        "Revenue",
        "Product Cost",
        "Gross Profit"
    ]);

    Object.values(
        report.productStats
    )
    .sort(
        (a, b) =>
            b.revenue -
            a.revenue
    )
    .forEach(
        product => {

            rows.push([

                product.name,

                product.quantity,

                product.revenue,

                product.cost,

                product.revenue -
                product.cost

            ]);

        }
    );

    rows.push([]);

    rows.push([
        "STATUS BREAKDOWN"
    ]);

    rows.push([
        "Status",
        "Orders"
    ]);

    Object.entries(
        report.statusCounts
    ).forEach(
        ([status, count]) => {

            rows.push([
                status,
                count
            ]);

        }
    );

    downloadCSV(
        `abiora-business-report-${today}.csv`,
        rows
    );

    showToast(
        "Business report downloaded successfully."
    );

}


/* =========================================================
   MESSAGES
========================================================= */

async function loadMessages() {

    const container =
        $("messagesList");

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "contacts"
                )
            );

        messages =
            snapshot.docs.map(
                item => ({
                    id:
                        item.id,

                    ...item.data()
                })
            );

        messages.sort(
            (a, b) =>
                getDateValue(
                    b.createdAt ||
                    b.date
                ) -
                getDateValue(
                    a.createdAt ||
                    a.date
                )
        );

        renderMessages();

    }

    catch (error) {

        console.error(
            "LOAD MESSAGES ERROR:",
            error
        );

        if (container) {

            container.innerHTML = `
                <div class="admin-empty">
                    Unable to load messages.
                </div>
            `;

        }

    }

}


function renderMessages() {

    const container =
        $("messagesList");

    if (!container) {
        return;
    }

    if (!messages.length) {

        container.innerHTML = `
            <div class="admin-empty">
                No customer messages.
            </div>
        `;

        return;

    }

    container.innerHTML =
        messages.map(
            message => {

                const name =
                    message.name ||
                    message.fullName ||
                    "Customer";

                const email =
                    message.email ||
                    "—";

                const subject =
                    message.subject ||
                    "Customer Message";

                const text =
                    message.message ||
                    message.text ||
                    message.content ||
                    "";

                const date =
                    formatDate(
                        message.createdAt ||
                        message.date
                    );

                return `
                    <div
                        style="
                            border-bottom:1px solid #eee9e2;
                            padding:18px 0;
                        "
                    >

                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                gap:15px;
                                flex-wrap:wrap;
                            "
                        >

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <span
                                style="
                                    color:#999;
                                    font-size:12px;
                                "
                            >
                                ${escapeHTML(date)}
                            </span>

                        </div>

                        <div
                            style="
                                color:#777;
                                font-size:12px;
                                margin-top:4px;
                            "
                        >
                            ${escapeHTML(email)}
                        </div>

                        <h4
                            style="
                                margin:10px 0 6px;
                                color:#2d2925;
                            "
                        >
                            ${escapeHTML(subject)}
                        </h4>

                        <p
                            style="
                                margin:0;
                                color:#555;
                                line-height:1.6;
                                white-space:pre-wrap;
                            "
                        >
                            ${escapeHTML(text)}
                        </p>

                    </div>
                `;

            }
        ).join("");

}


/* =========================================================
   ADMINS
========================================================= */

async function loadAdmins() {

    const table =
        $("adminsTable");

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "admins"
                )
            );

        admins =
            snapshot.docs.map(
                item => ({
                    uid:
                        item.id,

                    ...item.data()
                })
            );

        admins.sort(
            (a, b) =>
                String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    )
                )
        );

        renderAdmins();

    }

    catch (error) {

        console.error(
            "LOAD ADMINS ERROR:",
            error
        );

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="admin-empty">
                            Unable to load administrators.
                        </div>
                    </td>
                </tr>
            `;

        }

    }

}


function renderAdmins() {

    const table =
        $("adminsTable");

    if (!table) {
        return;
    }

    if (!admins.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="admin-empty">
                        No administrators found.
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML =
        admins.map(
            admin => {

                const isCurrent =
                    admin.uid ===
                    currentAdmin?.uid;

                const active =
                    admin.active === true;

                return `
                    <tr>

                        <td>
                            ${escapeHTML(
                                admin.name ||
                                "Administrator"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                admin.email ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                admin.role ||
                                "admin"
                            )}
                        </td>

                        <td>
                            ${active
                                ? "Active"
                                : "Disabled"
                            }
                        </td>

                        <td>

                            ${
                                isCurrent

                                ?

                                `<span
                                    style="
                                        color:#888;
                                        font-size:12px;
                                    "
                                >
                                    Current account
                                </span>`

                                :

                                `
                                <button
                                    class="admin-btn ${
                                        active
                                            ? "danger"
                                            : ""
                                    } small-action"
                                    type="button"
                                    onclick="toggleAdminStatus(
                                        '${admin.uid}',
                                        ${active}
                                    )"
                                >
                                    ${
                                        active
                                            ? "Disable"
                                            : "Activate"
                                    }
                                </button>
                                `
                            }

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


async function createAdminAccount(event) {

    event.preventDefault();

    const form =
        $("adminCreateForm");

    const name =
        $("newAdminName")
            .value
            .trim();

    const email =
        $("newAdminEmail")
            .value
            .trim();

    const password =
        $("newAdminPassword")
            .value;

    const role =
        $("newAdminRole")
            .value;

    if (password.length < 6) {

        showToast(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;

    }

    const submitButton =
        form.querySelector(
            "button[type='submit']"
        );

    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Creating...";

    }

    try {

        const appName =
            "ABIORA_ADMIN_CREATOR";

        let secondaryApp =
            getApps().find(
                app =>
                    app.name ===
                    appName
            );

        if (!secondaryApp) {

            secondaryApp =
                initializeApp(
                    firebaseConfig,
                    appName
                );

        }

        const secondaryAuth =
            getAuth(
                secondaryApp
            );

        const credential =
            await createUserWithEmailAndPassword(
                secondaryAuth,
                email,
                password
            );

        const newUid =
            credential.user.uid;

        try {

            await updateProfile(
                credential.user,
                {
                    displayName:
                        name
                }
            );

        }

        catch (profileError) {

            console.warn(
                "PROFILE UPDATE WARNING:",
                profileError
            );

        }

        await setDoc(
            doc(
                db,
                "admins",
                newUid
            ),
            {

                name,

                email,

                role,

                active:
                    true,

                createdAt:
                    serverTimestamp(),

                createdBy:
                    currentAdmin.uid

            }
        );

        await secondarySignOut(
            secondaryAuth
        );

        form.reset();

        showToast(
            "Administrator created successfully."
        );

        await loadAdmins();

    }

    catch (error) {

        console.error(
            "CREATE ADMIN ERROR:",
            error
        );

        let message =
            error.message ||
            "Unable to create administrator.";

        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            message =
                "An account already exists with this email.";

        }

        else if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "Please enter a valid email address.";

        }

        else if (
            error.code ===
            "auth/weak-password"
        ) {

            message =
                "Password is too weak.";

        }

        showToast(
            message,
            "error"
        );

    }

    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Create Administrator";

        }

    }

}


window.toggleAdminStatus =
    async function (
        uid,
        currentlyActive
    ) {

        if (
            uid ===
            currentAdmin?.uid
        ) {

            showToast(
                "You cannot disable your own account.",
                "error"
            );

            return;

        }

        const action =
            currentlyActive
                ? "disable"
                : "activate";

        if (
            !confirm(
                `Are you sure you want to ${action} this administrator?`
            )
        ) {

            return;

        }

        try {

            await updateDoc(
                doc(
                    db,
                    "admins",
                    uid
                ),
                {
                    active:
                        !currentlyActive,

                    updatedAt:
                        serverTimestamp()
                }
            );

            showToast(
                `Administrator ${action}d successfully.`
            );

            await loadAdmins();

        }

        catch (error) {

            console.error(
                "TOGGLE ADMIN ERROR:",
                error
            );

            showToast(
                error.message ||
                "Unable to update administrator.",
                "error"
            );

        }

    };


/* =========================================================
   SETTINGS
========================================================= */

async function loadSettings() {

    try {

        const settingsSnap =
            await getDoc(
                doc(
                    db,
                    "settings",
                    "store"
                )
            );

        if (
            !settingsSnap.exists()
        ) {

            return;

        }

        const data =
            settingsSnap.data();

        if ($("shippingCharge")) {

            $("shippingCharge").value =
                data.shippingCharge ??
                "";

        }

        if ($("freeShippingMinimum")) {

            $("freeShippingMinimum").value =
                data.freeShippingMinimum ??
                "";

        }

        if ($("returnDays")) {

            $("returnDays").value =
                data.returnDays ??
                "";

        }

        if ($("storePhone")) {

            $("storePhone").value =
                data.storePhone ??
                "";

        }

        if ($("storeEmail")) {

            $("storeEmail").value =
                data.storeEmail ??
                "";

        }

    }

    catch (error) {

        console.error(
            "LOAD SETTINGS ERROR:",
            error
        );

    }

}


async function saveSettings(event) {

    event.preventDefault();

    const button =
        $("settingsForm")
            .querySelector(
                "button[type='submit']"
            );

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Saving...";

    }

    try {

        const settingsData = {

            shippingCharge:
                Number(
                    $("shippingCharge").value ||
                    0
                ),

            freeShippingMinimum:
                Number(
                    $("freeShippingMinimum").value ||
                    0
                ),

            returnDays:
                Number(
                    $("returnDays").value ||
                    0
                ),

            storePhone:
                $("storePhone")
                    .value
                    .trim(),

            storeEmail:
                $("storeEmail")
                    .value
                    .trim(),

            updatedAt:
                serverTimestamp(),

            updatedBy:
                currentAdmin.uid

        };

        await setDoc(
            doc(
                db,
                "settings",
                "store"
            ),
            settingsData,
            {
                merge: true
            }
        );

        showToast(
            "Store settings saved."
        );

    }

    catch (error) {

        console.error(
            "SAVE SETTINGS ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to save settings.",
            "error"
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Save Settings";

        }

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const productsCount =
        $("statProducts");

    const ordersCount =
        $("statOrders");

    const sales =
        $("statSales");

    const pending =
        $("statPending");

    const lowStock =
        $("statLowStock");

    if (productsCount) {

        productsCount.textContent =
            products.length;

    }

    if (ordersCount) {

        ordersCount.textContent =
            orders.length;

    }

    const completedOrders =
        orders.filter(
            order =>
                String(
                    getOrderStatus(order)
                ).toLowerCase()
                !==
                "cancelled"
        );

    const totalSales =
        completedOrders.reduce(
            (
                total,
                order
            ) =>
                total +
                getOrderTotal(
                    order
                ),
            0
        );

    if (sales) {

        sales.textContent =
            formatCurrency(
                totalSales
            );

    }

    const pendingOrders =
        orders.filter(
            order => {

                const status =
                    String(
                        getOrderStatus(
                            order
                        )
                    ).toLowerCase();

                return (
                    status === "pending" ||
                    status === "confirmed" ||
                    status === "processing"
                );

            }
        );

    if (pending) {

        pending.textContent =
            pendingOrders.length;

    }

    const lowStockProducts =
        products.filter(
            product =>
                product.stock <= 5
        );

    if (lowStock) {

        lowStock.textContent =
            lowStockProducts.length;

    }

    renderRecentOrders();

    renderLowStockProducts();

}


function renderRecentOrders() {

    const container =
        $("recentOrders");

    if (!container) {
        return;
    }

    const recent =
        orders.slice(
            0,
            5
        );

    if (!recent.length) {

        container.innerHTML = `
            <div class="admin-empty">
                No orders yet.
            </div>
        `;

        return;

    }

    container.innerHTML =
        recent.map(
            order => {

                return `
                    <div
                        style="
                            padding:12px 0;
                            border-bottom:1px solid #eee9e2;
                        "
                    >

                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                gap:10px;
                            "
                        >

                            <strong>
                                #${escapeHTML(
                                    order.id.slice(
                                        0,
                                        8
                                    )
                                )}
                            </strong>

                            <strong>
                                ${formatCurrency(
                                    getOrderTotal(
                                        order
                                    )
                                )}
                            </strong>

                        </div>

                        <div
                            style="
                                margin-top:5px;
                                font-size:12px;
                                color:#888;
                            "
                        >
                            ${escapeHTML(
                                getOrderCustomer(
                                    order
                                )
                            )}

                            ·

                            ${escapeHTML(
                                getOrderStatus(
                                    order
                                )
                            )}
                        </div>

                    </div>
                `;

            }
        ).join("");

}


function renderLowStockProducts() {

    const container =
        $("lowStockProducts");

    if (!container) {
        return;
    }

    const lowStock =
        products
            .filter(
                product =>
                    product.stock <= 5
            )
            .sort(
                (a, b) =>
                    a.stock -
                    b.stock
            )
            .slice(
                0,
                8
            );

    if (!lowStock.length) {

        container.innerHTML = `
            <div class="admin-empty">
                All products have healthy stock.
            </div>
        `;

        return;

    }

    container.innerHTML =
        lowStock.map(
            product => {

                return `
                    <div
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:15px;
                            padding:12px 0;
                            border-bottom:1px solid #eee9e2;
                        "
                    >

                        <div>

                            <strong>
                                ${escapeHTML(
                                    product.name
                                )}
                            </strong>

                            <div
                                style="
                                    color:#888;
                                    font-size:12px;
                                    margin-top:4px;
                                "
                            >
                                ${escapeHTML(
                                    product.category
                                )}
                            </div>

                        </div>

                        <strong
                            style="
                                color:${
                                    product.stock === 0
                                        ? "#9b3131"
                                        : "#8a6a35"
                                };
                            "
                        >
                            ${product.stock} left
                        </strong>

                    </div>
                `;

            }
        ).join("");

}


/* =========================================================
   FORM / MODAL EVENTS
========================================================= */

function setupForms() {

    const productForm =
        $("productForm");

    if (productForm) {

        productForm.addEventListener(
            "submit",
            saveProduct
        );

    }

    const adminForm =
        $("adminCreateForm");

    if (adminForm) {

        adminForm.addEventListener(
            "submit",
            createAdminAccount
        );

    }

    const settingsForm =
        $("settingsForm");

    if (settingsForm) {

        settingsForm.addEventListener(
            "submit",
            saveSettings
        );

    }

}


function setupModalEvents() {

    const modal =
        $("productModal");

    if (!modal) {
        return;
    }

    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modal
            ) {

                closeProductModal();

            }

        }
    );

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                modal.classList.contains(
                    "show"
                )
            ) {

                closeProductModal();

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

window.logoutAdmin =
    async function () {

        try {

            await signOut(
                auth
            );

            window.location.replace(
                "account.html"
            );

        }

        catch (error) {

            console.error(
                "LOGOUT ERROR:",
                error
            );

            showToast(
                error.message ||
                "Could not logout.",
                "error"
            );

        }

    };