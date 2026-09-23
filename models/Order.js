// models/Order.js
// Schema đơn hàng. "items" lưu lại đúng các sản phẩm khách đã chọn tại
// thời điểm đặt hàng (tên, giá, ảnh...) để sau này dù giá sản phẩm gốc
// có thay đổi, lịch sử đơn hàng vẫn chính xác.

const mongoose = require("mongoose");

// orderItemSchema là schema "con", KHÔNG tự thành 1 collection riêng -
// nó chỉ mô tả hình dạng của từng phần tử trong mảng "items" bên dưới.
// Mongo sẽ lưu nguyên mảng items này lồng bên trong document đơn hàng
// (không tách bảng như SQL) - đây là cách MongoDB xử lý quan hệ
// "1 đơn hàng có nhiều sản phẩm": nhúng thẳng dữ liệu vào, đọc 1 lần
// là có đủ thông tin, không cần JOIN nhiều bảng như SQL.
const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: Number, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        customerName: { type: String, required: true, trim: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        note: { type: String, default: "" },
        items: { type: [orderItemSchema], required: true },
        totalPrice: { type: Number, required: true },
        status: {
            type: String,
            enum: ["pending", "confirmed", "shipping", "completed", "cancelled"],
            default: "pending",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Order", orderSchema);