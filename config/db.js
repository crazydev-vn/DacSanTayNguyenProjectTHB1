// config/db.js
// Kết nối tới MongoDB bằng mongoose.
// Chuỗi kết nối lấy từ biến môi trường MONGODB_URI (xem file .env).
// Nếu không có .env, mặc định dùng MongoDB chạy local ở cổng 27017,
// database tên "dacsantaynguyen".

// mongoose là "cầu nối" giữa code JS và MongoDB: nó dịch các lệnh
// JS (Product.find(), Order.create()...) thành lệnh truy vấn MongoDB
// thật sự, và dịch kết quả trả về (BSON) ngược lại thành object JS.
const mongoose = require("mongoose");

async function connectDB() {
    // uri là "địa chỉ" của database - giống như đường dẫn tới 1 cái kho.
    // Toàn bộ app chỉ mở 1 kết nối (mongoose.connect) ngay lúc khởi động,
    // sau đó mọi model (Product, Order...) dùng chung kết nối này để
    // đọc/ghi dữ liệu - không phải mở/đóng kết nối mỗi lần có request.
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dacsantaynguyen";

    try {
        await mongoose.connect(uri);
        console.log("✅ Đã kết nối MongoDB:", mongoose.connection.name);
    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error.message);
        // Thoát tiến trình vì server không thể hoạt động thiếu database
        process.exit(1);
    }
}

module.exports = connectDB;