// models/Product.js
// Schema sản phẩm. Giữ lại trường "id" dạng số (khác với _id của Mongo)
// vì toàn bộ frontend (main.js, product-detail.html...) đang dùng
// product.id là số nguyên (?id=1, data-id="1"...). Việc này giúp không
// phải sửa lại code phía client.

const mongoose = require("mongoose");

// Schema = "khuôn mẫu" mô tả 1 sản phẩm trông như thế nào (field nào,
// kiểu dữ liệu gì, bắt buộc hay không). Mongoose dùng khuôn này để:
// 1) validate dữ liệu trước khi ghi vào MongoDB (vd: price phải là số >= 0)
// 2) tạo ra "Product" model bên dưới - chính là công cụ để
//    đọc/ghi collection "products" trong MongoDB (mongoose tự động
//    đặt tên collection là số nhiều, viết thường của "Product").
const productSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true },
        name: { type: String, required: true, trim: true },
        category: { type: String, required: true, index: true },
        price: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true },
        origin: { type: String, required: true },
        image: { type: String, required: true },
        stock: { type: Number, required: true, min: 0, default: 0 },
        description: { type: String, default: "" },
        featured: { type: Boolean, default: false },
    },
    {
        timestamps: true, // tự thêm createdAt, updatedAt
        versionKey: false,
    }
);

// Khi trả JSON về client, ẩn field _id/__v nội bộ của Mongo cho gọn,
// vì frontend chỉ cần dùng "id".
productSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret._id;
        return ret;
    },
});

module.exports = mongoose.model("Product", productSchema);