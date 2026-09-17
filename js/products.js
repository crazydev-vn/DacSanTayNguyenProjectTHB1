// ============================================================
// Đọc dữ liệu sản phẩm từ file JSON (data/products.json)
// Biến "products" vẫn giữ tên như cũ để main.js và các trang
// khác dùng lại được, chỉ khác là dữ liệu được nạp bất đồng bộ.
//
// LƯU Ý QUAN TRỌNG: fetch() chỉ hoạt động khi trang được chạy
// qua một web server (localhost/Live Server...). Nếu mở file
// HTML trực tiếp bằng cách double-click (địa chỉ file:///...),
// trình duyệt sẽ CHẶN fetch() do chính sách CORS, khiến
// "products" luôn rỗng và phần tìm kiếm/lọc không hoạt động.
// ============================================================
let products = [];

async function loadProducts() {
    try {
        // Lấy file products.json -> load vào hàm loadProducts
        const response = await fetch("data/products.json"); // fetch gửi yêu cầu HTTP đến server
        if (!response.ok) throw new Error("Không tải được file products.json");
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