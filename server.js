// server.js: cửa vào của toàn bộ trang khi chạy
// npm start -> node chạy server.js:
// 1. trả các file html/css/js/ ảnh trong folder public
// 2. Cung cấp API (/api/products; orders) để fropublic
// 3. Lấy dữ liệu sản phẩm
// 4. cần server vì products.js dùng fetch("data/products.json") 
//    fetch bị trình duyệt chặmn (CORS) khi mở file html trực tiếp
// 5. _kiểu file_://... chạy qua server (http://localhost) sẽ hết lỗi lúc chạy


//Nạp thư viện: 
// express: framework tạo web sever + định nghĩa router
// Khai báo "express" ở package.json mục "dependencies"
const express = require("express");

// path: module sẵn của node: ghép đường dẫn đến thư mục 
// win +  linux [\]
// mac [/]
const path = require("path");

// routes mỗi file -> xử lý 1 nhóm API giúp sever.js gọn + dễ update

// product.routes.js: API sp đọc data/products.js
const productsRouter = require("./routes/products.routes");

// order.routes.js: các API về đơn hàng ghi data/order.js
const ordersRouter = require("./routes/orders.routes");    //Chưa hoàn thiện orders

// app là đối tượng đại diện cho toàn bộ server Express
const app = express();

// cổng port sever nghe khi deploy lên hosting
// nền tảng tự cung cấp qua mtr PORT chạy trên máy mình ko có PORT thù dùng cổng 3000
const PORT = process.env.PORT || 3000;

// Cho phép Express đọc JSON gửi lên từ body (POST /api/orders)
app.use(express.json());

// Gắn router vào các API:mọi request đều có đường dẫn 
app.use("/api/products", productsRouter);   //GET   /api/products -> productsRouter xử lý
app.use("/api/orders", ordersRouter);   //POST /api/order -> ordersRouter xử lý

// express.static biến folder "public" thành folder gốc của web
// http:localhost:3000/ -> public/index.html /css.style.css -> public/css.....
app.use(express.static(path.join(__dirname, "public")));

// Fallback: nếu gõ sai đường dẫn thì đưa về trang chủ
// app.get"*" khớp mọi get chưa route nào ko phải file tĩnh + null -> errol 404
// "*" bắt tất cả đặt cuối, nếu ko sẽ chặn các route sau
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// start server 
// listen(): nhận request cổng PORT, callback chạy 1 lần -> server sẵn sàng -> in ra thông báo ở terminal
app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
});