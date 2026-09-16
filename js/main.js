// ============================================================
// 1. Quản lý giỏ hàng chung với localStorage
// ============================================================
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cartCounts = document.querySelectorAll("#cart-count");
    cartCounts.forEach(el => el.textContent = cart.length);
}

// ============================================================
// 2. Sự kiện khi DOM tải xong trên toàn bộ các trang
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // Cập nhật số lượng giỏ hàng ban đầu khi vừa load trang
    updateCartCount();

    // Lấy các phần tử DOM giao diện (nếu có tồn tại trên trang hiện tại)
    const productList = document.querySelector("#product-list");
    const searchInput = document.querySelector("#search-input");
    const categoryFilter = document.querySelector("#category-select");
    const priceFilter = document.querySelector("#price-select");
    const filterBtn = document.querySelector("#filter-btn");
    const orderForm = document.querySelector("#order-form");

    // ============================================================
    // 2a. Hàm renderProducts (dành cho trang products.html)
    // ============================================================
    function renderProducts(items) {
        if (!productList) return;
        if (items.length === 0) {
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Không có sản phẩm phù hợp.</p>';
            return;
        }
        productList.innerHTML = items.map(product => `
            <article class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <div class="content">
                    <h3>${product.name}</h3>
                    <p style="font-size: 0.85rem; color: var(--color-muted); margin-top: 4px;">Xuất xứ: ${product.origin} | Quy cách: ${product.unit}</p>
                    <p style="font-size: 0.9rem; margin: 8px 0; color: var(--color-text);">${product.description}</p>
                    <p style="font-size: 0.85rem; font-weight: 600; color: ${product.stock > 0 ? 'var(--color-secondary)' : '#dc2626'};">
                        Tình trạng: ${product.stock > 0 ? 'Còn hàng (' + product.stock + ')' : 'Hết hàng'}
                    </p>
                    <p class="price">Giá: ${product.price.toLocaleString("vi-VN")} đ</p>
                    <div class="actions">
                        <a href="product-detail.html?id=${product.id}" class="btn btn-outline" style="margin-bottom: 8px; display: block; text-align: center;">Chi tiết sản phẩm</a>
                        <button class="btn" data-id="${product.id}" style="width: 100%;" ${product.stock === 0 ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>Thêm vào giỏ hàng</button>
                    </div>
                </div>
            </article>
        `).join("");
    }

    // ============================================================
    // 2b. Xử lý lọc và tìm kiếm sản phẩm
    // ============================================================
    function handleFilterAndSearch() {
        if (typeof products === 'undefined') return; // Kiểm tra nếu chưa load mảng products

        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const category = categoryFilter ? categoryFilter.value : "all";
        const priceRange = priceFilter ? priceFilter.value : "all";

        const result = products.filter(product => {
            const matchKeyword = keyword === "" || product.name.toLowerCase().includes(keyword) || product.description.toLowerCase().includes(keyword);
            const matchCategory = category === "all" || product.category === category;

            let matchPrice = true;
            if (priceRange === "under-150") {
                matchPrice = product.price < 150000;
            } else if (priceRange === "150-300") {
                matchPrice = product.price >= 150000 && product.price <= 300000;
            } else if (priceRange === "over-300") {
                matchPrice = product.price > 300000;
            }

            return matchKeyword && matchCategory && matchPrice;
        });
        renderProducts(result);
    }

    // Gắn sự kiện lọc nếu các thành phần tồn tại
    if (searchInput) searchInput.addEventListener("input", handleFilterAndSearch);
    if (categoryFilter) categoryFilter.addEventListener("change", handleFilterAndSearch);
    if (priceFilter) priceFilter.addEventListener("change", handleFilterAndSearch);
    if (filterBtn) filterBtn.addEventListener("click", handleFilterAndSearch);

    // ============================================================
    // 2c. Thêm sản phẩm vào giỏ hàng từ trang danh sách
    // ============================================================
    if (productList) {
        productList.addEventListener("click", function (event) {
            if (event.target.tagName === "BUTTON") {
                const productId = Number(event.target.dataset.id);
                const product = products.find(item => item.id === productId);
                if (product && product.stock > 0) {
                    cart.push(product);
                    saveCart();
                    alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
                }
            }
        });
    }

    // ============================================================
    // 2d. Xử lý modal giỏ hàng chung trên tất cả các trang
    // ============================================================
    const cartIcon = document.querySelector("#cart-icon");
    const cartModal = document.querySelector("#cart-modal");
    const closeCart = document.querySelector("#close-cart");
    const cartItemsContainer = document.querySelector("#cart-items");
    const cartTotalPrice = document.querySelector("#cart-total-price");

    function renderCartUI() {
        if (!cartItemsContainer) return;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color: gray; padding: 20px;">Giỏ hàng của bạn đang trống.</p>';
            if (cartTotalPrice) cartTotalPrice.textContent = '0 đ';
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = cart.map((item, index) => {
            total += item.price;
            return `
                <div class="cart-item" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                    <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                    <div class="cart-item-info" style="flex-grow: 1;">
                        <h4 style="font-size: 0.95rem; margin: 0;">${item.name}</h4>
                        <p style="color: var(--color-primary); font-weight: bold; margin: 0; font-size: 0.9rem;">${item.price.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <button class="cart-item-remove btn btn-outline" data-index="${index}" style="padding: 2px 8px; font-size: 0.8rem;">Xóa</button>
                </div>
            `;
        }).join("");

        if (cartTotalPrice) {
            cartTotalPrice.textContent = total.toLocaleString("vi-VN") + " đ";
        }

        // Gắn sự kiện xóa từng sản phẩm trong giỏ
        document.querySelectorAll(".cart-item-remove").forEach(btn => {
            btn.addEventListener("click", function () {
                const idx = Number(this.dataset.index);
                cart.splice(idx, 1);
                saveCart();
                renderCartUI();
            });
        });
    }

    if (cartIcon && cartModal) {
        cartIcon.addEventListener("click", (e) => {
            e.preventDefault();
            renderCartUI();
            cartModal.classList.add("active");
        });
        if (closeCart) closeCart.addEventListener("click", () => cartModal.classList.remove("active"));
        cartModal.addEventListener("click", (e) => {
            if (e.target === cartModal) cartModal.classList.remove("active");
        });
    }

    // ============================================================
    // 2e. Xử lý form đặt hàng (dành cho trang contact.html)
    // ============================================================
    if (orderForm) {
        orderForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const customerName = document.querySelector("#customer-name").value.trim();
            const phone = document.querySelector("#phone").value.trim();
            const address = document.querySelector("#address").value.trim();

            if (customerName.length < 3) return alert("Họ tên phải có ít nhất 3 ký tự.");
            if (!/^[0-9]{10}$/.test(phone)) return alert("Số điện thoại phải gồm đúng 10 chữ số.");
            if (address.length < 10) return alert("Địa chỉ nhận hàng phải có ít nhất 10 ký tự chi tiết.");
            if (cart.length === 0) return alert("Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm trước khi đặt hàng!");

            alert(`Cảm ơn Quý khách ${customerName}! Đơn hàng của bạn đã được tiếp nhận thành công.`);
            orderForm.reset();
            cart = [];
            saveCart();
            renderCartUI();
        });
    }

    // ============================================================
    // 2f. Khởi chạy hiển thị ban đầu nếu đang ở trang products.html
    // ============================================================
    if (productList && typeof products !== 'undefined') {
        renderProducts(products);
    }
});