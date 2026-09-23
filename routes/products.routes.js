// ============================================================
// API Sản phẩm (đã chuyển từ đọc file JSON sang truy vấn MongoDB)
// GET  /api/products            -> danh sách (hỗ trợ ?search=&category=&price=)
// GET  /api/products/:id        -> chi tiết 1 sản phẩm theo id (số)
// ============================================================

const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// GET /api/products?search=&category=&price=
// Luồng dữ liệu: client gửi query string (?search=...) -> Express tự
// parse thành object req.query -> route này DỊCH các điều kiện đó
// thành 1 object "filter" đúng cú pháp truy vấn MongoDB -> đưa filter
// cho Product.find() để MongoDB tự lọc ngay trong database (nhanh hơn
// nhiều so với lấy hết rồi lọc bằng JS như bản dùng file JSON cũ).
router.get("/", async (req, res) => {
    try {
        const { search, category, price } = req.query;
        const filter = {}; // filter rỗng = lấy tất cả, mỗi điều kiện dưới đây sẽ bổ sung thêm vào đây

        if (search) {
            const keyword = search.trim();
            // Tìm gần đúng, không phân biệt hoa/thường trong tên hoặc mô tả
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
            ];
        }

        if (category && category !== "all") {
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

        // Product.find(filter) = lệnh mongoose gửi thật sự tới MongoDB,
        // trả về mảng document khớp điều kiện; .sort({id:1}) yêu cầu
        // MongoDB sắp xếp sẵn trước khi trả về, đỡ phải sort lại ở JS.
        const products = await Product.find(filter).sort({ id: 1 });
        res.json(products); // Express tự chuyển mảng object -> chuỗi JSON gửi về client
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách sản phẩm" });
    }
});

// GET /api/products/:id
// :id trong đường dẫn là "tham số động", Express lấy giá trị thật
// (vd "5" trong /api/products/5) đưa vào req.params.id dạng chuỗi ->
// phải Number() lại vì field "id" trong MongoDB được lưu dạng số.
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findOne({ id: Number(req.params.id) });

        if (!product) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }

        res.json(product);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
        res.status(500).json({ error: "Lỗi server khi lấy chi tiết sản phẩm" });
    }
});

module.exports = router;