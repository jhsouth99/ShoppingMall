// server/models/index.js
const User    = require('./User');
const Seller  = require('./Seller');
const Product = require('./Product');
const Order   = require('./Order');
const Payment = require('./Payment');
const Category = require('./Category');
const ProductCategory = require('./ProductCategory');
const Review = require('./Review');
const Inquiry = require('./Inquiry');
const Wishlist = require('./Wishlist');
const CartItem = require('./CartItem');
const ShippingAddress = require('./ShippingAddress');
const Admin = require('./Admin');
const Notice = require('./Notice');
const QnA = require('./QnA');
const ProductImage = require('./ProductImage');
const GroupPurchase = require('./GroupPurchase');
const GroupPurchaseOrder = require('./GroupPurchaseOrder');

// (선택) 관계 설정도 여기에 한꺼번에 묶을 수 있음

module.exports = {
  User,
  Seller,
  Product,
  Order,
  Payment,
  Category,
  ProductCategory,
  Review,
  Inquiry,
  Wishlist,
  CartItem,
  ShippingAddress,
  Admin,
  Notice,
  QnA,
  ProductImage,
  GroupPurchase,
  GroupPurchaseOrder
};
