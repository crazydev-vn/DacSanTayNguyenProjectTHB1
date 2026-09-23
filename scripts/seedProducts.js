// scripts/seedProducts.js
// Chạy: npm run seed
// Đọc data/products.json rồi nạp (upsert) vào MongoDB, để bạn không phải
// gõ tay lại 10 sản phẩm có sẵn. Chạy lại script này an toàn (không tạo
// trùng lặp) vì dùng upsert theo "id".

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");

async function seed() {
    await connectDB();

    const filePath = path.join(__dirname, "..", "data", "products.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const products = JSON.parse(raw);

    let created = 0;
    let updated = 0;

    for (const product of products) {
        const result = await Product.findOneAndUpdate(
            { id: product.id },
            { $set: product },
            { upsert: true, new: true, rawResult: true }
        );
        if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
            updated++;
        } else {
            created++;
        }
    }

    console.log(`✅ Seed hoàn tất: ${created} sản phẩm mới, ${updated} sản phẩm cập nhật.`);
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((error) => {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
});