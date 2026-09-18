// ============================================================
// 1. Quản lý giỏ hàng chung với localStorage
// ============================================================

// Lấy dữ liệu giỏ hàng từ localStorage của trình duyệt, nếu chưa có thì khởi tạo là một mảng rỗng []
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Hàm lưu giỏ hàng vào localStorage và gọi hàm cập nhật số lượng hiển thị trên giao diện
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart)); // Chuyển đổi mảng cart thành chuỗi JSON để lưu trữ
    updateCartCount(); // Cập nhật lại số đếm sản phẩm ở biểu tượng giỏ hàng
}

// Hàm cập nhật số lượng sản phẩm hiển thị trên icon giỏ hàng khắp các trang
function updateCartCount() {
    const cartCounts = document.querySelectorAll("#cart-count"); // Tìm tất cả các phần tử có id là cart-count
    cartCounts.forEach(el => el.textContent = cart.length);      // Gán tổng số lượng phần tử trong mảng cart cho nội dung của thẻ
}

// ============================================================
// 2. Sự kiện khi DOM tải xong trên toàn bộ các trang
// ============================================================
// Lắng nghe sự kiện DOMContentLoaded để chắc chắn toàn bộ cấu trúc HTML đã tải xong mới chạy code bên trong
document.addEventListener('DOMContentLoaded', () => {

    // Cập nhật số lượng giỏ hàng ban đầu khi vừa load trang
    updateCartCount();

    // Lấy các phần tử DOM giao diện (nếu có tồn tại trên trang hiện tại, nếu không có sẽ trả về null)
    const productList = document.querySelector("#product-list");       // Khu vực hiển thị danh sách sản phẩm
    const searchInput = document.querySelector("#search-input");       // Ô nhập từ khóa tìm kiếm
    const categoryFilter = document.querySelector("#category-select"); // Dropdown chọn danh mục
    const priceFilter = document.querySelector("#price-select");       // Dropdown chọn khoảng giá
    const filterBtn = document.querySelector("#filter-btn");           // Nút bấm kích hoạt lọc
    const orderForm = document.querySelector("#order-form");           // Form đặt hàng ở trang thanh toán/liên hệ

    // ============================================================
    // Hàm renderProducts (dành cho trang products.html)
    // ============================================================
    // Hàm nhận vào một mảng sản phẩm và hiển thị chúng ra giao diện HTML dưới dạng các thẻ article
    function renderProducts(items) {
        if (!productList) return; // Nếu trang hiện tại không có khung chứa sản phẩm thì dừng hàm

        // Nếu mảng truyền vào rỗng (không có sản phẩm thỏa mãn), hiển thị câu thông báo
        if (items.length === 0) {
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Không có sản phẩm phù hợp.</p>';
            return;
        }

        // Dùng .map() lặp qua từng sản phẩm để tạo mã HTML cấu trúc thẻ sản phẩm, sau đó dùng .join("") ghép lại
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
                        <!-- Nút Thêm vào giỏ hàng gắn data-id chứa ID của sản phẩm để nhận diện -->
                        <button class="btn" data-id="${product.id}" style="width: 100%;" ${product.stock === 0 ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>Thêm vào giỏ hàng</button>
                    </div>
                </div>
            </article>
        `).join("");
    }

    // ============================================================
    // Xử lý lọc và tìm kiếm sản phẩm (gọi API backend)
    // ============================================================
    // Hàm gọi API /api/products kèm query params search/category/price
    // để server tự lọc, thay vì lọc mảng products ở client như trước.
    async function handleFilterAndSearch() {
        const keyword = searchInput ? searchInput.value.trim() : "";
        const category = categoryFilter ? categoryFilter.value : "all";
        const priceRange = priceFilter ? priceFilter.value : "all";

        // Dựng query string từ các giá trị lọc hiện tại
        const params = new URLSearchParams();
        if (keyword) params.set("search", keyword);
        if (category && category !== "all") params.set("category", category);
        if (priceRange && priceRange !== "all") params.set("price", priceRange);

        try {
            const response = await fetch(`/api/products?${params.toString()}`);
            if (!response.ok) throw new Error("Không lọc được sản phẩm từ API");
            const result = await response.json();
            // Vẽ ra danh sách sản phẩm sau khi lọc từ server
            renderProducts(result);
        } catch (error) {
            console.error("Lỗi khi lọc sản phẩm:", error);
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Có lỗi xảy ra, vui lòng thử lại.</p>';
        }
    }

    // Gắn sự kiện tương ứng cho các thành phần lọc nếu chúng tồn tại trên trang
    if (searchInput) searchInput.addEventListener("input", handleFilterAndSearch);       // Lọc tự động khi gõ chữ
    if (categoryFilter) categoryFilter.addEventListener("change", handleFilterAndSearch); // Lọc khi đổi chọn danh mục
    if (priceFilter) priceFilter.addEventListener("change", handleFilterAndSearch);       // Lọc khi đổi chọn khoảng giá
    if (filterBtn) filterBtn.addEventListener("click", handleFilterAndSearch);            // Lọc khi click nút lọc

    // ============================================================
    // Thêm sản phẩm vào giỏ hàng từ trang danh sách
    // ============================================================
    // Sử dụng Event Delegation (ủy quyền sự kiện) gắn vào productList để bắt sự kiện click vào nút
    if (productList) {
        productList.addEventListener("click", function (event) {
            // Kiểm tra xem đối tượng được click có phải là thẻ <button> hay không
            if (event.target.tagName === "BUTTON") {
                const productId = Number(event.target.dataset.id);             // Lấy ID sản phẩm từ thuộc tính data-id
                const product = products.find(item => item.id === productId);  // Tìm sản phẩm trong mảng products tương ứng với ID

                // Nếu tìm thấy sản phẩm và số lượng tồn kho lớn hơn 0
                if (product && product.stock > 0) {
                    cart.push(product); // Đẩy sản phẩm vào mảng giỏ hàng
                    saveCart();         // Lưu lại vào localStorage và cập nhật giao diện
                    alert(`Đã thêm "${product.name}" vào giỏ hàng!`); // Thông báo thành công
                }
            }
        });
    }

    // ============================================================
    // Xử lý modal giỏ hàng chung trên tất cả các trang
    // ============================================================
    const cartIcon = document.querySelector("#cart-icon");               // Biểu tượng giỏ hàng trên thanh menu
    const cartModal = document.querySelector("#cart-modal");             // Khung chứa modal giỏ hàng
    const closeCart = document.querySelector("#close-cart");             // Nút đóng modal giỏ hàng
    const cartItemsContainer = document.querySelector("#cart-items");    // Vùng chứa danh sách các sản phẩm đang có trong giỏ
    const cartTotalPrice = document.querySelector("#cart-total-price");  // Vùng hiển thị tổng tiền giỏ hàng

    // Hàm vẽ giao diện chi tiết bên trong giỏ hàng (Modal)
    function renderCartUI() {
        if (!cartItemsContainer) return; // Nếu không có vùng chứa giỏ hàng thì thoát hàm

        // Trường hợp giỏ hàng trống không có sản phẩm nào
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color: gray; padding: 20px;">Giỏ hàng của bạn đang trống.</p>';
            if (cartTotalPrice) cartTotalPrice.textContent = '0 đ';
            return;
        }

        let total = 0; // Biến tính tổng tiền đơn hàng

        // Lặp qua từng sản phẩm trong giỏ để tạo mã HTML hiển thị chi tiết kèm nút xóa theo chỉ số index
        cartItemsContainer.innerHTML = cart.map((item, index) => {
            total += item.price; // Cộng dồn giá tiền sản phẩm vào tổng tiền
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

        // Hiển thị tổng tiền lên giao diện sau khi format chuẩn tiền Việt Nam (VND)
        if (cartTotalPrice) {
            cartTotalPrice.textContent = total.toLocaleString("vi-VN") + " đ";
        }

        // Gắn sự kiện xóa cho từng nút "Xóa" sản phẩm trong modal giỏ hàng
        document.querySelectorAll(".cart-item-remove").forEach(btn => {
            btn.addEventListener("click", function () {
                const idx = Number(this.dataset.index); // Lấy vị trí (index) của sản phẩm trong mảng cart
                cart.splice(idx, 1);                    // Xóa phần tử tại vị trí idx khỏi mảng cart
                saveCart();                             // Lưu lại thay đổi vào localStorage
                renderCartUI();                         // Vẽ lại giao diện giỏ hàng sau khi xóa
            });
        });
    }

    // Xử lý sự kiện mở/đóng cửa sổ Modal giỏ hàng
    if (cartIcon && cartModal) {
        // Khi click vào icon giỏ hàng: Chặn sự kiện mặc định, cập nhật nội dung giỏ và thêm class "active" để hiện modal lên
        cartIcon.addEventListener("click", (e) => {
            e.preventDefault();
            renderCartUI();
            cartModal.classList.add("active");
        });
        // Khi click vào nút đóng (X): Xóa class "active" để ẩn modal
        if (closeCart) closeCart.addEventListener("click", () => cartModal.classList.remove("active"));
        // Khi click vào vùng nền mờ bên ngoài khung modal: Ẩn modal
        cartModal.addEventListener("click", (e) => {
            if (e.target === cartModal) cartModal.classList.remove("active");
        });
    }

    // ============================================================
    // Xử lý form đặt hàng (dành cho trang contact.html)
    // ============================================================
    if (orderForm) {
        orderForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Ngăn chặn hành vi mặc định của form là reload lại trang

            // Lấy giá trị dữ liệu khách hàng nhập vào từ các ô input và cắt khoảng trắng thừa
            const customerName = document.querySelector("#customer-name").value.trim();
            const phone = document.querySelector("#phone").value.trim();
            const address = document.querySelector("#address").value.trim();
            const note = document.querySelector("#note").value.trim();

            // Kiểm tra ràng buộc dữ liệu đầu vào ở client trước (phản hồi nhanh, đỡ tốn 1 lượt gọi API)
            // Server (routes/orders.routes.js) vẫn kiểm tra lại toàn bộ để đảm bảo an toàn dữ liệu
            if (customerName.length < 3) return alert("Họ tên phải có ít nhất 3 ký tự.");
            if (!/^[0-9]{10}$/.test(phone)) return alert("Số điện thoại phải gồm đúng 10 chữ số."); // Kiểm tra chuỗi đúng 10 số bằng Regex
            if (address.length < 10) return alert("Địa chỉ nhận hàng phải có ít nhất 10 ký tự chi tiết.");
            if (cart.length === 0) return alert("Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm trước khi đặt hàng!");

            const submitBtn = orderForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                // Gửi đơn hàng lên API backend, backend sẽ validate lại và lưu vào data/orders.json
                const response = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ customerName, phone, address, note, cart }),
                });

                const result = await response.json();

                if (!response.ok) {
                    // Server trả lỗi validate (400) -> hiển thị thông báo lỗi tương ứng
                    alert(result.error || "Có lỗi xảy ra, vui lòng thử lại.");
                    return;
                }

                // Đặt hàng thành công: hiển thị thông báo, reset form và làm trống giỏ hàng
                alert(`Cảm ơn Quý khách ${customerName}! Đơn hàng của bạn đã được tiếp nhận thành công.`);
                orderForm.reset();
                cart = [];
                saveCart();
                renderCartUI();
            } catch (error) {
                console.error("Lỗi khi gửi đơn hàng:", error);
                alert("Không thể kết nối tới server. Vui lòng thử lại sau.");
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // ============================================================
    // Khởi chạy hiển thị ban đầu nếu đang ở trang products.html
    // Dữ liệu "products" được products.js nạp bất đồng bộ từ JSON,
    // nên phải chờ sự kiện "products-loaded" rồi mới render.
    // ============================================================
    if (productList) {
        if (products.length > 0) {
            renderProducts(products); // Nếu mảng products đã có sẵn dữ liệu thì render ngay lập tức
        }
        // Lắng nghe sự kiện tùy chỉnh "products-loaded" để render khi dữ liệu được nạp xong bất đồng bộ
        document.addEventListener("products-loaded", () => {
            renderProducts(products);
        });
    }
});