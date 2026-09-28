// VAI TRÒ: khuôn mẫu của 1 đơn hàng, lưu trong collection "orders".
// "items" lưu bản chụp sản phẩm tại lúc đặt (tên, giá...) nên sau này
// giá sản phẩm có đổi thì đơn cũ vẫn đúng.

const mongoose = require("mongoose");

// Khuôn của TỪNG MÓN trong đơn. Không tạo collection riêng,
// mà được nhúng thẳng vào bên trong document đơn hàng.
const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: Number, required: true },    // id sản phẩm
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 }, // số lượng mua
        image: { type: String },
    },
    { _id: false }  // món trong đơn không cần _id riêng
);

const orderSchema = new mongoose.Schema(
    {
        customerName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, match: /^[0-9]{10}$/ },  // đúng 10 chữ số
        address: { type: String, required: true },
        note: { type: String, default: "" },
        items: { type: [orderItemSchema], required: true }, // danh sách món
        totalPrice: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["pending", "confirmed", "shipping", "completed", "cancelled"],
            default: "pending", // đơn mới luôn ở trạng thái "chờ xử lý"
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Order", orderSchema);