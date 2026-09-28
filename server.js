// server.js: cửa vào của toàn bộ trang khi chạy
// npm start -> node chạy server.js:
// 1. Kết nối MongoDB (config/db.js)
// 2. trả các file html/css/js/ ảnh trong folder public
// 3. Cung cấp API (/api/products; /api/orders)
// 4. Dữ liệu sản phẩm/đơn hàng giờ nằm trong MongoDB thay vì file JSON

// server.js: "cửa vào" của cả website. Chạy bằng npm run dev / npm start.
// Nhiệm vụ: (1) kết nối MongoDB, (2) mở các API, (3) phục vụ file trong thư mục public.

require("dotenv").config(); // nạp biến từ file .env (MONGODB_URI, PORT, ADMIN_KEY...)

const express = require("express");
const path = require("path");
const cors = require("cors"); // Thêm CORS cho phép gọi API khác cổng (khi dùng Live Server)
const connectDB = require("./config/db");

// routes mỗi file -> xử lý 1 nhóm API giúp sever.js gọn + dễ update
const productsRouter = require("./routes/products.routes");
const ordersRouter = require("./routes/orders.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// cho phép trang ở cổng khác (vd Live Server 5501) gọi API này
app.use(cors());

// express.json() là middleware: MỌI request đi qua đây trước khi tới
// route. Nó đọc phần "body" thô (chuỗi JSON) mà client gửi lên, parse
// thành object JS và gán vào req.body - nếu thiếu dòng này thì
// req.body trong orders.routes.js sẽ là undefined.
app.use(express.json());    // -> đọc dữ liệu JSON khách gửi lên thành req.body

// Gắn router vào các API - đây là bước "định tuyến": request tới
// đúng tiền tố nào (/api/products hay /api/orders) sẽ được chuyển hẳn
// cho file router tương ứng xử lý tiếp, server.js không biết chi tiết
// cho phép trang ở cổng khác (vd Live Server 5501) gọi API này
// logic bên trong, chỉ biết chuyển tiếp đúng chỗ.
app.use("/api/products", productsRouter); // GET  /api/products -> productsRouter xử lý
app.use("/api/orders", ordersRouter);     // POST /api/orders -> ordersRouter xử lý

// Biến thư mục "public" thành trang web (html, css, js, ảnh nằm trong đó)
app.use(express.static(path.join(__dirname, "public")));

// Fallback: nếu gõ sai đường dẫn thì đưa về trang chủ
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Kết nối MongoDB xong mới mở, tránh trường hợp có request tới nhưng Database chưa sẵn sàng 
// (await connectDB() sẽ "đứng chờ"
// tới khi mongoose.connect() thành công hoặc lỗi, app.listen() chỉ
// chạy sau khi Promise đó resolve).
async function start() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
    });
}

start();