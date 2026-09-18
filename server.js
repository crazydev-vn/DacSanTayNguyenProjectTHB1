// ============================================================
// Server Node.js (Express) - phục vụ website Đặc Sản Tây Nguyên
// Lý do cần server: file products.js dùng fetch("data/products.json"),
// mà fetch() bị trình duyệt chặn (CORS) khi mở file HTML trực tiếp
// kiểu file:///... Chạy qua server (http://localhost) sẽ hết lỗi này.
// ============================================================

const express = require("express");
const path = require("path");

const productsRouter = require("./routes/products.routes");
const ordersRouter = require("./routes/orders.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Cho phép Express đọc JSON gửi lên từ body (POST /api/orders)
app.use(express.json());

// Gắn các route API
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

// Phục vụ toàn bộ thư mục "public" làm thư mục gốc web
// (index.html, css/, js/, images/ đều nằm trong đây)
app.use(express.static(path.join(__dirname, "public")));

// Fallback: nếu gõ sai đường dẫn thì đưa về trang chủ
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
});