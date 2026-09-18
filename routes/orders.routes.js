// ============================================================
// API Sản phẩm
// GET  /api/products            -> danh sách (hỗ trợ ?search=&category=&price=)
// GET  /api/products/:id        -> chi tiết 1 sản phẩm theo id
// ============================================================

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const productsPath = path.join(__dirname, "..", "data", "products.json");

// Đọc file products.json mỗi lần có request (đơn giản, phù hợp quy mô nhỏ)
function readProducts() {
    const raw = fs.readFileSync(productsPath, "utf-8");
    return JSON.parse(raw);
}

// GET /api/products?search=&category=&price=
router.get("/", (req, res) => {
    let products = readProducts();
    const { search, category, price } = req.query;

    if (search) {
        const keyword = search.toLowerCase().trim();
        products = products.filter(
            (p) =>
                p.name.toLowerCase().includes(keyword) ||
                p.description.toLowerCase().includes(keyword)
        );
    }

    if (category && category !== "all") {
        products = products.filter((p) => p.category === category);
    }

    if (price && price !== "all") {
        if (price === "under-150") {
            products = products.filter((p) => p.price < 150000);
        } else if (price === "150-300") {
            products = products.filter((p) => p.price >= 150000 && p.price <= 300000);
        } else if (price === "over-300") {
            products = products.filter((p) => p.price > 300000);
        }
    }

    res.json(products);
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
    const products = readProducts();
    const product = products.find((p) => p.id === Number(req.params.id));

    if (!product) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    res.json(product);
});

module.exports = router;