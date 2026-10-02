// ============================================================
// routes/products.routes.js
// VAI TRÒ: định nghĩa API sản phẩm (lấy dữ liệu từ MongoDB).
//   GET    /api/products       -> danh sách sản phẩm (có thể lọc)
//   GET    /api/products/:id   -> chi tiết 1 sản phẩm
//   POST   /api/products       -> thêm sản phẩm mới (CHỈ admin)
//   PUT    /api/products/:id   -> sửa sản phẩm (CHỈ admin)   [MỚI]
//   DELETE /api/products/:id   -> xóa sản phẩm (CHỈ admin)
// ============================================================

const express = require("express");
const Product = require("../models/Product");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Danh sách mã danh mục hợp lệ (khớp với bộ lọc ở trang Sản phẩm)
const CATEGORIES = ["ca-phe", "mat-ong", "mac-ca", "tieu", "bo", "tho-cam", "dac-san-khac"];

// Thêm "\" trước ký tự đặc biệt của regex để từ khóa như "(" hay "*"
// không làm hỏng câu truy vấn tìm kiếm.
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- GET /api/products ----------
router.get("/", async (req, res) => {
    try {
        const { search, category, price } = req.query;
        const filter = {};

        if (search && typeof search === "string") {
            const keyword = escapeRegex(search.trim());
            if (keyword) {
                filter.$or = [
                    { name: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                ];
            }
        }

        if (category && typeof category === "string" && category !== "all") {
            filter.category = category;
        }

        if (price && price !== "all") {
            if (price === "under-150") {
                filter.price = { $lt: 150000 };
            } else if (price === "150-300") {
                filter.price = { $gte: 150000, $lte: 300000 };
            } else if (price === "over-300") {
                filter.price = { $gt: 300000 };
            }
        }

        const products = await Product.find(filter).sort({ id: 1 });
        res.json(products);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách sản phẩm" });
    }
});

// ---------- GET /api/products/:id ----------
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Mã sản phẩm không hợp lệ" });
        }

        const product = await Product.findOne({ id });
        if (!product) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }

        res.json(product);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi lấy chi tiết sản phẩm" });
    }
});

// ---------- POST /api/products (chỉ admin) ----------
// Không cần gửi "id": server tự cấp số tiếp theo.
router.post("/", requireAdmin, async (req, res) => {
    try {
        const { name, category, price, unit, origin, image, stock, description, featured } = req.body;

        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return res.status(400).json({ error: "Tên sản phẩm phải có ít nhất 2 ký tự." });
        }
        if (!CATEGORIES.includes(category)) {
            return res.status(400).json({ error: `Danh mục không hợp lệ. Chọn một trong: ${CATEGORIES.join(", ")}` });
        }
        const priceNum = Number(price);
        if (!Number.isFinite(priceNum) || priceNum < 0) {
            return res.status(400).json({ error: "Giá phải là số không âm." });
        }
        const stockNum = stock === undefined ? 0 : Number(stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
            return res.status(400).json({ error: "Tồn kho phải là số nguyên không âm." });
        }
        if (!unit || !String(unit).trim()) {
            return res.status(400).json({ error: "Thiếu quy cách (unit), ví dụ: Hộp 500g." });
        }
        if (!origin || !String(origin).trim()) {
            return res.status(400).json({ error: "Thiếu xuất xứ (origin)." });
        }
        if (!image || !String(image).trim()) {
            return res.status(400).json({ error: "Thiếu đường dẫn ảnh (image), ví dụ: images/ten-anh.jpg." });
        }

        const last = await Product.findOne().sort({ id: -1 });
        const newId = last ? last.id + 1 : 1;

        const product = await Product.create({
            id: newId,
            name: name.trim(),
            category,
            price: priceNum,
            unit: String(unit).trim(),
            origin: String(origin).trim(),
            image: String(image).trim(),
            stock: stockNum,
            description: description ? String(description).trim() : "",
            featured: Boolean(featured),
        });

        res.status(201).json(product);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Trùng mã sản phẩm, vui lòng thử lại." });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        console.error("Lỗi khi thêm sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi thêm sản phẩm" });
    }
});

// ---------- PUT /api/products/:id (chỉ admin) ---------- [MỚI]
// Chỉ cần gửi các trường muốn sửa, ví dụ: { "price": 160000, "stock": 30 }
// Không cho sửa "id".
router.put("/:id", requireAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Mã sản phẩm không hợp lệ" });
        }

        // Chỉ nhận các trường nằm trong danh sách cho phép
        const allowed = ["name", "category", "price", "unit", "origin", "image", "stock", "description", "featured"];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "Không có trường nào để cập nhật." });
        }

        // --- Kiểm tra từng trường nếu có gửi ---
        if (updates.name !== undefined) {
            if (typeof updates.name !== "string" || updates.name.trim().length < 2) {
                return res.status(400).json({ error: "Tên sản phẩm phải có ít nhất 2 ký tự." });
            }
            updates.name = updates.name.trim();
        }
        if (updates.category !== undefined && !CATEGORIES.includes(updates.category)) {
            return res.status(400).json({ error: `Danh mục không hợp lệ. Chọn một trong: ${CATEGORIES.join(", ")}` });
        }
        if (updates.price !== undefined) {
            updates.price = Number(updates.price);
            if (!Number.isFinite(updates.price) || updates.price < 0) {
                return res.status(400).json({ error: "Giá phải là số không âm." });
            }
        }
        if (updates.stock !== undefined) {
            updates.stock = Number(updates.stock);
            if (!Number.isInteger(updates.stock) || updates.stock < 0) {
                return res.status(400).json({ error: "Tồn kho phải là số nguyên không âm." });
            }
        }
        for (const key of ["unit", "origin", "image"]) {
            if (updates[key] !== undefined) {
                if (!String(updates[key]).trim()) {
                    return res.status(400).json({ error: `Trường "${key}" không được để trống.` });
                }
                updates[key] = String(updates[key]).trim();
            }
        }
        if (updates.description !== undefined) updates.description = String(updates.description).trim();
        if (updates.featured !== undefined) updates.featured = Boolean(updates.featured);

        // new: true -> trả về bản đã cập nhật; runValidators -> kiểm tra theo schema
        const product = await Product.findOneAndUpdate(
            { id },
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }

        res.json(product);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi cập nhật sản phẩm" });
    }
});

// ---------- DELETE /api/products/:id (chỉ admin) ----------
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Mã sản phẩm không hợp lệ" });
        }

        const deleted = await Product.findOneAndDelete({ id });
        if (!deleted) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }

        // Đơn hàng cũ không bị ảnh hưởng vì đã lưu sẵn tên + giá lúc đặt (xem Order.js)
        res.json({ message: "Đã xóa sản phẩm", product: deleted });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi xóa sản phẩm" });
    }
});

module.exports = router;