// ============================================================
// Đọc dữ liệu sản phẩm từ file JSON (data/products.json)
// Biến "products" vẫn giữ tên như cũ để main.js và các trang
// khác dùng lại được, chỉ khác là dữ liệu được nạp bất đồng bộ.
// ============================================================
let products = [];

async function loadProducts() {
    try {
        //Lấy file product.json -> load hàm loadProducts
        const response = await fetch("data/products.json"); //fect gửi y/c -> http đến sever (chạy file trực tiếp nên trình duyệt chặn)
        if (!response.ok) throw new Error("Không tải được file products.json");
        // mảng product 
        products = await response.json(); //response.json chuỗi json -> mảng js thật  

        // .filter(); .find(), .map()

        // fect() mất tgian tải nên product cần document.dispatchEvent(new CustomEvent("products-loaded")); 
        // xong -> tải trang
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
        products = [];
    } finally {
        // Báo cho các file JS khác (main.js, product-detail.html) biết dữ liệu đã sẵn sàng
        document.dispatchEvent(new CustomEvent("products-loaded"));
    }
}

loadProducts();