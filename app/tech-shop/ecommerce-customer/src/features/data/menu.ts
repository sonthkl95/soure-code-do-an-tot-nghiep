export const categories = [
  {
    id: "laptop",
    name: "Laptop",
    children: [
      {
        id: "laptop-gaming",
        name: "Laptop Gaming",
        children: [
          { id: "asus-rog", name: "ASUS ROG" },
          { id: "msi-gaming", name: "MSI Gaming" },
          { id: "acer-predator", name: "Acer Predator" },
          { id: "lenovo-legion", name: "Lenovo Legion" },
        ],
      },
      {
        id: "laptop-office",
        name: "Laptop Văn Phòng",
        children: [
          { id: "dell-latitude", name: "Dell Latitude" },
          { id: "hp-elitebook", name: "HP EliteBook" },
          { id: "asus-vivobook", name: "ASUS VivoBook" },
        ],
      },
      {
        id: "macbook",
        name: "MacBook",
        children: [
          { id: "macbook-air", name: "MacBook Air" },
          { id: "macbook-pro", name: "MacBook Pro" },
        ],
      },
    ],
  },

  {
    id: "pc",
    name: "PC & Linh Kiện",
    children: [
      {
        id: "pc-gaming",
        name: "PC Gaming",
        children: [
          { id: "pc-gaming-i5", name: "PC Gaming Core i5" },
          { id: "pc-gaming-i7", name: "PC Gaming Core i7" },
        ],
      },
      {
        id: "linh-kien",
        name: "Linh Kiện Máy Tính",
        children: [
          { id: "cpu", name: "CPU" },
          { id: "gpu", name: "Card Màn Hình" },
          { id: "ram", name: "RAM" },
          { id: "ssd", name: "SSD" },
          { id: "psu", name: "Nguồn (PSU)" },
        ],
      },
    ],
  },

  {
    id: "mobile",
    name: "Điện Thoại",
    children: [
      {
        id: "smartphone",
        name: "Smartphone",
        children: [
          { id: "iphone", name: "iPhone" },
          { id: "samsung", name: "Samsung" },
          { id: "xiaomi", name: "Xiaomi" },
          { id: "oppo", name: "OPPO" },
        ],
      },
      {
        id: "tablet",
        name: "Tablet",
        children: [
          { id: "ipad", name: "iPad" },
          { id: "samsung-tab", name: "Samsung Galaxy Tab" },
        ],
      },
    ],
  },

  {
    id: "accessories",
    name: "Phụ Kiện",
    children: [
      {
        id: "gaming-gear",
        name: "Gaming Gear",
        children: [
          { id: "keyboard", name: "Bàn Phím" },
          { id: "mouse", name: "Chuột" },
          { id: "headset", name: "Tai Nghe" },
        ],
      },
      {
        id: "office-accessories",
        name: "Phụ Kiện Văn Phòng",
        children: [
          { id: "monitor", name: "Màn Hình" },
          { id: "webcam", name: "Webcam" },
          { id: "printer", name: "Máy In" },
        ],
      },
    ],
  },
];
