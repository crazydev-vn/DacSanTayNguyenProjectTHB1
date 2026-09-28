// scripts/seedProducts.js
// VAI TRÒ: đưa dữ liệu từ data/products.json VÀO MongoDB.
// Chạy bằng: npm run seed (chỉ cần khi mới cài hoặc muốn nạp lại dữ liệu mẫu)
// Chạy lại nhiều lần vẫn an toàn: sản phẩm có sẵn thì cập nhật, chưa có thì thêm.
// LƯU Ý: chạy lại sẽ đưa "stock" về số ghi trong products.json.

require("dotenv").config(); // đọc file .env
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");

async function seed() {
    await connectDB(); // 1. kết nối MongoDB

    // 2. đọc file products.json thành mảng JS
    const filePath = path.join(__dirname, "..", "data", "products.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const products = JSON.parse(raw);

    let created = 0;
    let updated = 0;

    // 3. với từng sản phẩm: tìm theo "id", có rồi thì cập nhật, chưa có thì thêm mới (upsert)
    for (const product of products) {
        const result = await Product.findOneAndUpdate(
            { id: product.id },
            { $set: product },
            { upsert: true, new: true, includeResultMetadata: true }
        );
        if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
            updated++;
        } else {
            created++;
        }
    }

    console.log(`✅ Seed hoàn tất: ${created} sản phẩm mới, ${updated} sản phẩm cập nhật.`);
    await mongoose.disconnect(); // 4. đóng kết nối rồi thoát
    process.exit(0);
}

seed().catch((error) => {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
});