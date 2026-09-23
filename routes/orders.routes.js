// ============================================================
// API Đơn hàng
// POST /api/orders        -> tạo đơn hàng mới, lưu vào MongoDB
// GET  /api/orders         -> (tuỳ chọn, dùng cho quản trị) xem tất cả đơn hàng
// ============================================================

const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

// POST /api/orders
// Luồng dữ liệu đầy đủ 1 lượt đặt hàng:
// client gửi JSON (body) -> express.json() middleware ở server.js
// parse sẵn thành req.body -> route này validate -> "dịch" cart (mảng
// sản phẩm client gửi lên) thành "items" đúng shape của Order model ->
// Order.create() ghi 1 document mới vào collection "orders" -> trả
// document vừa tạo (có _id, createdAt do Mongo tự sinh) về client.
router.post("/", async (req, res) => {
    try {
        const { customerName, phone, address, note, cart } = req.body;

        // Validate lại toàn bộ ở server, không tin tưởng dữ liệu từ client
        // (client có thể bị sửa/bỏ qua JS, nên server luôn là lớp chặn cuối cùng)
        if (!customerName || customerName.trim().length < 3) {
            return res.status(400).json({ error: "Họ tên phải có ít nhất 3 ký tự." });
        }
        if (!phone || !/^[0-9]{10}$/.test(phone.trim())) {
            return res.status(400).json({ error: "Số điện thoại phải gồm đúng 10 chữ số." });
        }
        if (!address || address.trim().length < 10) {
            return res.status(400).json({ error: "Địa chỉ nhận hàng phải có ít nhất 10 ký tự chi tiết." });
        }
        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: "Giỏ hàng đang trống." });
        }


        //Chuyển cart (mảng object sp đầy đủ lấy từ localStorage của client -> item gọn hơn orderIteamSchema
        // Đây là là bước snapshotL giữ các field cần cho lsu đơn hàng (ảnh, tên, giá ...) ko lưu nguyên object sp gốc
        // Sau cần đổi giá đơn hàng vẫn đúng lúc khách mua
        const items = cart.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
        }));

        // Tính tổng tiền ngay tại server (không tin số tổng client gửi lên,
        // nếu có) để đảm bảo số liệu đúng với giá thật trong items.
        const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

        // oder.create(): tạo document trong memory theo schema lưu vào MongoDB + trả về Promise 
        const order = await Order.create({
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            note: note ? note.trim() : "",
            items,
            totalPrice,
        });

        res.status(201).json(order);
    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        res.status(500).json({ error: "Lỗi server khi tạo đơn hàng" });
    }
});

// GET /api/orders (danh sách đơn hàng, mới nhất trước - dùng cho trang quản trị sau này)
router.get("/", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách đơn hàng" });
    }
});

module.exports = router;