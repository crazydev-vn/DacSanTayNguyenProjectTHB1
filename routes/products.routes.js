// ============================================================
// VAI TRÒ: định nghĩa API sản phẩm. Đây là nơi API LẤY DỮ LIỆU từ MongoDB.
//   GET    /api/products       -> danh sách sản phẩm (có thể lọc)
//   GET    /api/products/:id   -> chi tiết 1 sản phẩm
//   POST   /api/products       -> thêm 1 sản phẩm mới (CHỈ admin)   [MỚI]
//   DELETE /api/products/:id   -> xóa 1 sản phẩm (CHỈ admin)
// ============================================================

const express = require("express");
const Product = require("../models/Product");   // công cụ đọc collection "products"
const requireAdmin = require("../middleware/requireAdmin"); // người gác cổng cho API quản trị

const router = express.Router();    // router = nhóm các đường dẫn API

// [MỚI] Danh sách mã danh mục hợp lệ (khớp với bộ lọc ở trang Sản phẩm)
const CATEGORIES = ["ca-phe", "mat-ong", "mac-ca", "tieu", "bo", "tho-cam", "dac-san-khac"];

// Escape các ký tự đặc biệt của regex để từ khóa người dùng nhập
// (vd "(", "*", "[") không làm hỏng câu truy vấn.
// Thêm "\" trước ký tự đặc biệt của regex để từ khóa như "(" hay "*"
// không làm hỏng câu truy vấn tìm kiếm.
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- GET /api/products ----------
// Trình duyệt gọi: /api/products  hoặc  /api/products?category=ca-phe&price=under-150
router.get("/", async (req, res) => {
    try {
        // req.query = phần sau dấu "?" trên địa chỉ, Express tự tách sẵn
        const { search, category, price } = req.query;

        // filter = "điều kiện lọc" gửi cho MongoDB. Rỗng {} = lấy tất cả.
        const filter = {};

        if (search && typeof search === "string") {
            const keyword = escapeRegex(search.trim());
            if (keyword) {
                // tìm trong tên HOẶC mô tả, không phân biệt hoa/thường
                filter.$or = [
                    { name: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                ];
            }
        }

        if (category && typeof category === "string" && category !== "all") {
            filter.category = category; // chỉ lấy đúng danh mục
        }

        if (price && price !== "all") {
            if (price === "under-150") {
                filter.price = { $lt: 150000 }; // dưới 150k
            } else if (price === "150-300") {
                filter.price = { $gte: 150000, $lte: 300000 };  // từ 150k đến 300k
            } else if (price === "over-300") {
                filter.price = { $gt: 300000 }; // trên 300k
            }
        }

        // Product.find(filter): MongoDB tìm các sản phẩm khớp điều kiện.
        // .sort({ id: 1 }): sắp xếp id tăng dần (1,2,3...).
        const products = await Product.find(filter).sort({ id: 1 });
        res.json(products); // gửi mảng sản phẩm về trình duyệt dạng JSON
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách sản phẩm" });
    }
});

// ---------- GET /api/products/:id ----------
// ":id" là phần thay đổi, vd /api/products/5 thì req.params.id = "5"
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);   // đổi chuỗi "5" thành số 5
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Mã sản phẩm không hợp lệ" });
        }

        const product = await Product.findOne({ id });  // tìm 1 sản phẩm theo id
        if (!product) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }

        res.json(product);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi lấy chi tiết sản phẩm" });
    }
});

// ---------- POST /api/products (chỉ admin) ---------- [MỚI]
// Gọi: POST /api/products kèm header "x-admin-key" và body JSON, ví dụ:
// { "name": "...", "category": "ca-phe", "price": 150000, "unit": "Hộp 500g",
//   "origin": "Đắc Lắc", "image": "images/abc.jpg", "stock": 20,
//   "description": "...", "featured": false }
// Không cần gửi "id": server tự cấp số tiếp theo.
router.post("/", requireAdmin, async (req, res) => {
    try {
        const { name, category, price, unit, origin, image, stock, description, featured } = req.body;

        // --- 1. Kiểm tra dữ liệu (server luôn kiểm tra lại, không tin client) ---
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
        // stock không gửi thì mặc định 0. Nếu gửi thì phải là số nguyên không âm.
        const stockNum = stock === undefined ? 0 : Number(stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
            return res.status(400).json({ error: "Tồn kho phải là số nguyên không âm." });
        }
        // 3 trường này bắt buộc theo Product.js
        if (!unit || !String(unit).trim()) {
            return res.status(400).json({ error: "Thiếu quy cách (unit), ví dụ: Hộp 500g." });
        }
        if (!origin || !String(origin).trim()) {
            return res.status(400).json({ error: "Thiếu xuất xứ (origin)." });
        }
        if (!image || !String(image).trim()) {
            return res.status(400).json({ error: "Thiếu đường dẫn ảnh (image), ví dụ: images/ten-anh.jpg." });
        }

        // --- 2. Tự cấp id: lấy sản phẩm có id lớn nhất, cộng thêm 1 (bảng trống thì bắt đầu từ 1) ---
        const last = await Product.findOne().sort({ id: -1 });
        const newId = last ? last.id + 1 : 1;

        // --- 3. Lưu vào MongoDB ---
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

        res.status(201).json(product); // 201 = tạo thành công, trả sản phẩm vừa tạo về
    } catch (error) {
        // Mã 11000 = trùng id (xảy ra khi 2 admin thêm cùng lúc) -> bảo thử lại
        if (error.code === 11000) {
            return res.status(409).json({ error: "Trùng mã sản phẩm, vui lòng thử lại." });
        }
        // Lỗi do Mongoose kiểm tra dữ liệu (theo schema trong Product.js)
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        console.error("Lỗi khi thêm sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi thêm sản phẩm" });
    }
});

// ---------- DELETE /api/products/:id (chỉ admin) ----------
// Gọi: DELETE /api/products/5 kèm header "x-admin-key: <ADMIN_KEY>".
// Thứ tự trong router.delete(...): request đi qua requireAdmin TRƯỚC,
// nếu đúng khóa mới chạy tiếp hàm xử lý phía sau.
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);   // đổi chuỗi "5" thành số 5 (sản phẩm dùng id kiểu số)
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Mã sản phẩm không hợp lệ" });
        }

        // findOneAndDelete: tìm sản phẩm theo id rồi xóa luôn,
        // trả về chính sản phẩm vừa xóa (hoặc null nếu không tìm thấy).
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

module.exports = router;    // để server.js gắn vào đường dẫn /api/products