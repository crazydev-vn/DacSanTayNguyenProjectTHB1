// Schema sản phẩm. Giữ lại trường "id" dạng số (khác với _id của Mongo)
// vì toàn bộ frontend (main.js, product-detail.html...) đang dùng
// product.id là số nguyên (?id=1, data-id="1"...). Việc này giúp không
// phải sửa lại code phía client.


// VAI TRÒ: mô tả "1 sản phẩm trông như thế nào" (khuôn mẫu / schema)
// -> tạo ra "Product" - công cụ để đọc/ghi collection "products" trong MongoDB.
// Ví dụ: Product.find() = lấy sản phẩm, Product.findOne() = lấy 1 sản phẩm.
const mongoose = require("mongoose");

// Schema = "khuôn mẫu" mô tả 1 sản phẩm trông như thế nào (field nào,
// kiểu dữ liệu gì, bắt buộc hay không). Mongoose dùng khuôn này để:
// 1) validate dữ liệu trước khi ghi vào MongoDB (vd: price phải là số >= 0)
// 2) tạo ra "Product" model bên dưới - chính là công cụ để
//    đọc/ghi collection "products" trong MongoDB (mongoose tự động
//    đặt tên collection là số nhiều, viết thường của "Product").


// Schema = danh sách field + kiểu dữ liệu + quy tắc (bắt buộc, số nhỏ nhất...).
// Mongoose dùng nó để kiểm tra dữ liệu trước khi ghi vào database.
const productSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true }, // mã số 1,2,3... (frontend dùng ?id=1)
        name: { type: String, required: true, trim: true },
        category: { type: String, required: true, index: true },    // index = tìm theo danh mục nhanh hơn
        price: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true }, // quy cách: "Hộp 500g"...
        origin: { type: String, required: true },   // xuất xứ
        image: { type: String, required: true },
        stock: { type: Number, required: true, min: 0, default: 0 },    // số lượng tồn kho
        description: { type: String, default: "" },
        featured: { type: Boolean, default: false },    // sản phẩm nổi bật
    },
    {
        timestamps: true, // tự thêm createdAt, updatedAt
        versionKey: false,
    }
);
// Khi trả JSON về trình duyệt thì bỏ _id nội bộ của Mongo cho gọn
// (frontend chỉ cần dùng field "id" kiểu số ở trên).

productSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret._id;
        return ret;
    },
});

// Tạo model "Product" -> Mongoose tự dùng collection tên "products".
module.exports = mongoose.model("Product", productSchema);