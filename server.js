// server.js: cửa vào của toàn bộ trang khi chạy
// npm start -> node chạy server.js:
// 1. Kết nối MongoDB (config/db.js)
// 2. trả các file html/css/js/ ảnh trong folder public
// 3. Cung cấp API (/api/products; /api/orders)
// 4. Dữ liệu sản phẩm/đơn hàng giờ nằm trong MongoDB thay vì file JSON

require("dotenv").config(); // Nạp biến môi trường từ .env (MONGODB_URI, PORT...)

const express = require("express");
const path = require("path");
const connectDB = require("./config/db");

// routes mỗi file -> xử lý 1 nhóm API giúp sever.js gọn + dễ update
const productsRouter = require("./routes/products.routes");
const ordersRouter = require("./routes/orders.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// express.json() là middleware: MỌI request đi qua đây trước khi tới
// route. Nó đọc phần "body" thô (chuỗi JSON) mà client gửi lên, parse
// thành object JS và gán vào req.body - nếu thiếu dòng này thì
// req.body trong orders.routes.js sẽ là undefined.
app.use(express.json());

// Gắn router vào các API - đây là bước "định tuyến": request tới
// đúng tiền tố nào (/api/products hay /api/orders) sẽ được chuyển hẳn
// cho file router tương ứng xử lý tiếp, server.js không biết chi tiết
// logic bên trong, chỉ biết chuyển tiếp đúng chỗ.
app.use("/api/products", productsRouter); // GET  /api/products -> productsRouter xử lý
app.use("/api/orders", ordersRouter);     // POST /api/orders -> ordersRouter xử lý

// express.static biến folder "public" thành folder gốc của web
app.use(express.static(path.join(__dirname, "public")));

// Fallback: nếu gõ sai đường dẫn thì đưa về trang chủ
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Kết nối MongoDB xong mới mở cổng lắng nghe, tránh trường hợp có
// request tới nhưng DB chưa sẵn sàng (await connectDB() sẽ "đứng chờ"
// tới khi mongoose.connect() thành công hoặc lỗi, app.listen() chỉ
// chạy sau khi Promise đó resolve).
async function start() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
    });
}

start();