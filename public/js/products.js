// ============================================================
// Đọc dữ liệu sản phẩm từ API backend (GET /api/products)
// Dữ liệu được nạp bất đồng bộ.
// LƯU Ý QUAN TRỌNG: fetch() gọi API cần server Node.js đang chạy
// (npm start) và phải mở trang qua http://localhost:3000/...
// Nếu mở file HTML trực tiếp (địa chỉ file:///...) thì fetch()
// tới API sẽ không hoạt động vì không có server nào để gọi.
// link github của em: https://github.com/crazydev-vn
// ============================================================
let products = [];

async function loadProducts() {
    try {
        // Gọi API backend thay vì fetch file JSON tĩnh
        const response = await fetch("/api/products"); // fetch gửi yêu cầu HTTP đến server
        if (!response.ok) throw new Error("Không tải được dữ liệu từ /api/products");
        // mảng products
        products = await response.json(); // chuỗi json -> mảng js thật
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
        products = [];
    } finally {
        // Báo cho các file JS khác (main.js, product-detail.html) biết dữ liệu đã sẵn sàng
        document.dispatchEvent(new CustomEvent("products-loaded"));
    }
}

loadProducts();