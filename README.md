project/
├── server.js               # Server Node.js (Express) + gắn API
├── package.json
├── routes/
│   ├── products.routes.js   # API sản phẩm
│   └── orders.routes.js     # API đơn hàng
├── data/
│   ├── products.json        # Dữ liệu sản phẩm (backend đọc)
│   └── orders.json          # Tự tạo khi có đơn hàng gửi lên
└── public/                   # Toàn bộ file front-end tĩnh
    ├── index.html
    ├── products.html
    ├── product-detail.html
    ├── contact.html
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js
    │   └── products.js
    └── images/               # Bạn cần bổ sung ảnh sản phẩm vào đây