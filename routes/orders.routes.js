// ============================================================
// routes/orders.routes.js
// VAI TRÒ: API đơn hàng.
//   POST   /api/orders               -> khách đặt hàng (ai cũng dùng được)
//   GET    /api/orders               -> xem tất cả đơn (CHỈ admin)
//   PATCH  /api/orders/:id/status    -> đổi trạng thái đơn (CHỈ admin)   [MỚI]
//   DELETE /api/orders/:id           -> xóa 1 đơn hàng (CHỈ admin)
// ============================================================

const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const ORDER_STATUSES = ["pending", "confirmed", "shipping", "completed", "cancelled"];

// Trả lại hàng vào kho (dùng khi đặt đơn bị lỗi giữa chừng, hoặc khi hủy đơn)
async function restoreStock(deducted) {
    for (const { id, quantity } of deducted) {
        await Product.updateOne({ id }, { $inc: { stock: quantity } });
    }
}

// ---------- POST /api/orders ----------
// Khách chỉ gửi {id, quantity}. TÊN và GIÁ do server tự lấy từ MongoDB.
router.post("/", async (req, res) => {
    const deducted = [];

    try {
        const { customerName, phone, address, note, cart } = req.body;

        // --- 1. Kiểm tra thông tin khách ---
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

        // --- 2. Gộp các dòng trùng id, kiểm tra id/số lượng hợp lệ ---
        const wanted = new Map();
        for (const line of cart) {
            const id = Number(line && line.id);
            const quantity = Number(line && line.quantity);
            if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
                return res.status(400).json({ error: "Dữ liệu giỏ hàng không hợp lệ." });
            }
            wanted.set(id, (wanted.get(id) || 0) + quantity);
        }

        // --- 3. Lấy sản phẩm THẬT từ MongoDB ---
        const ids = [...wanted.keys()];
        const products = await Product.find({ id: { $in: ids } });
        if (products.length !== ids.length) {
            return res.status(400).json({ error: "Có sản phẩm trong giỏ không còn tồn tại." });
        }

        // --- 4. Kiểm tra còn đủ hàng không ---
        for (const product of products) {
            const quantity = wanted.get(product.id);
            if (product.stock < quantity) {
                return res.status(400).json({
                    error: product.stock === 0
                        ? `"${product.name}" đã hết hàng.`
                        : `"${product.name}" chỉ còn ${product.stock} sản phẩm.`,
                });
            }
        }

        // --- 5. Trừ kho (điều kiện stock >= quantity chống kho bị âm) ---
        for (const product of products) {
            const quantity = wanted.get(product.id);
            const result = await Product.updateOne(
                { id: product.id, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } }
            );
            if (result.modifiedCount === 0) {
                await restoreStock(deducted);
                return res.status(409).json({
                    error: `"${product.name}" vừa hết hàng, vui lòng kiểm tra lại giỏ hàng.`,
                });
            }
            deducted.push({ id: product.id, quantity });
        }

        // --- 6. Tạo bản chụp các món (giá thật từ database) ---
        const items = products.map((product) => ({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: wanted.get(product.id),
            image: product.image,
        }));

        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // --- 7. Lưu đơn hàng ---
        const order = await Order.create({
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            note: note ? String(note).trim() : "",
            items,
            totalPrice,
        });

        res.status(201).json(order);
    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        try {
            await restoreStock(deducted);
        } catch (restoreError) {
            console.error("Lỗi khi hoàn tồn kho:", restoreError);
        }
        res.status(500).json({ error: "Lỗi server khi tạo đơn hàng" });
    }
});

// ---------- GET /api/orders (chỉ admin) ----------
router.get("/", requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách đơn hàng" });
    }
});

// ---------- PATCH /api/orders/:id/status (chỉ admin) ---------- [MỚI]
// Gọi: PATCH /api/orders/<_id>/status kèm header "x-admin-key", body: { "status": "confirmed" }
// Trạng thái: pending | confirmed | shipping | completed | cancelled
// Chuyển sang "cancelled" sẽ tự hoàn lại tồn kho.
// Đơn đã hủy thì không mở lại được (vì kho đã được trả).
router.patch("/:id/status", requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!ORDER_STATUSES.includes(status)) {
            return res.status(400).json({
                error: `Trạng thái không hợp lệ. Chọn một trong: ${ORDER_STATUSES.join(", ")}`,
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }

        if (order.status === "cancelled" && status !== "cancelled") {
            return res.status(400).json({ error: "Đơn đã hủy, không thể mở lại. Hãy tạo đơn mới." });
        }

        // Hủy đơn lần đầu -> hoàn lại tồn kho
        if (status === "cancelled" && order.status !== "cancelled") {
            await restoreStock(order.items.map((i) => ({ id: i.productId, quantity: i.quantity })));
        }

        order.status = status;
        await order.save();
        res.json(order);
    } catch (error) {
        // _id sai định dạng (không phải 24 ký tự hex) cũng nhảy vào đây
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        res.status(400).json({ error: "Mã đơn hàng không hợp lệ" });
    }
});

// ---------- DELETE /api/orders/:id (chỉ admin) ----------
// Lưu ý: xóa đơn KHÔNG tự hoàn kho. Muốn hoàn kho thì dùng PATCH status = "cancelled" trước.
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const deleted = await Order.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }
        res.json({ message: "Đã xóa đơn hàng" });
    } catch (error) {
        console.error("Lỗi khi xóa đơn hàng:", error);
        res.status(400).json({ error: "Mã đơn hàng không hợp lệ" });
    }
});

module.exports = router;