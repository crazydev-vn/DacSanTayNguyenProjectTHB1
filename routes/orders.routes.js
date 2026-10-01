// ============================================================
// routes/orders.routes.js
// VAI TRÒ: API đơn hàng.
//   POST   /api/orders       -> khách đặt hàng (ai cũng dùng được)
//   GET    /api/orders       -> xem tất cả đơn (CHỈ admin, cần khóa bí mật)
//   DELETE /api/orders/:id   -> xóa 1 đơn hàng (CHỈ admin)   [MỚI]
// ============================================================

const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
// [MỚI] "Người gác cổng" được tách ra file riêng (middleware/requireAdmin.js)
// để dùng chung với products.routes.js. Hàm requireAdmin cũ ở đầu file này đã được bỏ.
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Trả lại hàng vào kho nếu đặt đơn giữa chừng bị lỗi
async function restoreStock(deducted) {
    for (const { id, quantity } of deducted) {
        await Product.updateOne({ id }, { $inc: { stock: quantity } });
    }
}

// ---------- POST /api/orders ----------
// Khách chỉ gửi {id, quantity}. TÊN và GIÁ do server tự lấy từ MongoDB,
// nên khách không thể tự sửa giá để mua rẻ.
router.post("/", async (req, res) => {
    const deducted = []; // ghi lại những sản phẩm đã trừ kho (để hoàn lại khi lỗi)

    try {
        const { customerName, phone, address, note, cart } = req.body; // dữ liệu khách gửi

        // --- 1. Kiểm tra thông tin khách (server luôn kiểm tra lại, không tin client) ---
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
        const wanted = new Map(); // id -> tổng số lượng muốn mua
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

        // --- 5. Trừ kho. Điều kiện "stock >= quantity" đảm bảo kho không bao giờ bị âm,
        // kể cả khi 2 người đặt cùng lúc. ---
        for (const product of products) {
            const quantity = wanted.get(product.id);
            const result = await Product.updateOne(
                { id: product.id, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } } // $inc = cộng/trừ số
            );
            if (result.modifiedCount === 0) {
                await restoreStock(deducted); // trả lại những món đã lỡ trừ
                return res.status(409).json({
                    error: `"${product.name}" vừa hết hàng, vui lòng kiểm tra lại giỏ hàng.`,
                });
            }
            deducted.push({ id: product.id, quantity });
        }

        // --- 6. Tạo bản chụp các món (dùng giá thật từ database) ---
        const items = products.map((product) => ({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: wanted.get(product.id),
            image: product.image,
        }));

        // Server tự tính tổng tiền
        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // --- 7. Lưu đơn hàng vào MongoDB ---
        const order = await Order.create({
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            note: note ? String(note).trim() : "",
            items,
            totalPrice,
        });

        res.status(201).json(order); // 201 = tạo thành công, trả đơn vừa tạo về
    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        try {
            await restoreStock(deducted); // lỗi thì trả lại kho
        } catch (restoreError) {
            console.error("Lỗi khi hoàn tồn kho:", restoreError);
        }
        res.status(500).json({ error: "Lỗi server khi tạo đơn hàng" });
    }
});

// ---------- GET /api/orders (chỉ admin) ----------
router.get("/", requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }); // đơn mới nhất trước
        res.json(orders);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách đơn hàng" });
    }
});

// ---------- DELETE /api/orders/:id (chỉ admin) ---------- [MỚI]
// Gọi: DELETE /api/orders/<_id> kèm header "x-admin-key: <ADMIN_KEY>".
// Lưu ý: đơn hàng dùng _id của MongoDB (chuỗi dài, lấy từ GET /api/orders),
// khác với sản phẩm dùng id số.
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        // findByIdAndDelete: tìm theo _id rồi xóa, trả về đơn vừa xóa (hoặc null nếu không có)
        const deleted = await Order.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }

        // Xóa đơn KHÔNG tự hoàn lại tồn kho. Nếu muốn hoàn kho khi hủy đơn,
        // cần cộng lại stock cho từng món trong deleted.items.
        res.json({ message: "Đã xóa đơn hàng" });
    } catch (error) {
        // _id sai định dạng (không phải 24 ký tự hex) cũng nhảy vào đây
        console.error("Lỗi khi xóa đơn hàng:", error);
        res.status(400).json({ error: "Mã đơn hàng không hợp lệ" });
    }
});

module.exports = router;