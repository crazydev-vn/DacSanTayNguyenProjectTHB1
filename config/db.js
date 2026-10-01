// VAI TRÒ: mở kết nối từ server Node tới MongoDB (nơi chứa dữ liệu thật).
// Chỉ mở 1 lần lúc khởi động, sau đó mọi file khác dùng chung kết nối này.

// mongoose là "cầu nối" giữa code JS và MongoDB: nó dịch các lệnh
// JS (Product.find(), Order.create()...) thành lệnh truy vấn MongoDB
// thật sự, và dịch kết quả trả về (BSON) ngược lại thành object JS.

const mongoose = require("mongoose"); // thư viện giúp JS nói chuyện với MongoDB


async function connectDB() {
    // uri là "địa chỉ" của database - giống như đường dẫn tới 1 cái kho.
    // Toàn bộ app chỉ mở 1 kết nối (mongoose.connect) ngay lúc khởi động,
    // sau đó mọi model (Product, Order...) dùng chung kết nối này để
    // đọc/ghi dữ liệu - không phải mở/đóng kết nối mỗi lần có request.


    // Địa chỉ database: lấy từ file .env (MONGODB_URI),
    // nếu không có thì dùng MongoDB chạy trên máy bạn (cổng 27017).
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dacsantaynguyen";

    try {
        await mongoose.connect(uri);    // chờ kết nối xong mới đi tiếp
        console.log("✅ Đã kết nối MongoDB:", mongoose.connection.name);
    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error.message); so
        // Thoát tiến trình vì server không thể hoạt động thiếu database
        process.exit(1);    // không có database -> tắt server
    }
}

module.exports = connectDB; // để server.js và seedProducts.js gọi lại