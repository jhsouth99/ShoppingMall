// // server/models/index.js
// const User    = require('./User');
// const Seller  = require('./Seller');
// const Product = require('./Product');
// const Order   = require('./Order');
// const OrderItem = require('./OrderItem');
// const Payment = require('./Payment');
// const Category = require('./Category');
// const ProductCategory = require('./ProductCategory');
// const Attribute = require('./Attribute');
// const ProductAttribute = require('./ProductAttribute');
// const ProductOption = require('./ProductOption');
// const Review = require('./Review');
// const Inquiry = require('./Inquiry');
// const Wishlist = require('./Wishlist');
// const CartItem = require('./CartItem');
// const ShippingAddress = require('./ShippingAddress');
// const Notice = require('./Notice');
// const QnA = require('./QnA');
// const ProductImage = require('./ProductImage');
// const GroupPurchase = require('./GroupPurchase');
// const GroupPurchaseOrder = require('./GroupPurchaseOrder');
// const Coupon = require('./Coupon');
// const UserCoupon = require('./UserCoupon');

// // (선택) 관계 설정도 여기에 한꺼번에 묶을 수 있음


// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const ProductOption = require('./ProductOption');
const ProductOptionValue = require('./ProductOptionValue');
const ProductVariantOptionValue = require('./ProductVariantOptionValue');
const ProductVariant = require('./ProductVariant');
const CartItem = require('./CartItem');
const User = require('./User');
const OrderItem = require('./OrderItem');
const ProductVariantShippingMethod = require('./ProductVariantShippingMethod');
const Product = require('./Product');
const PromotionCondition = require('./PromotionCondition');
const Promotion = require('./Promotion');
const PromotionProduct = require('./PromotionProduct');
const ReviewImage = require('./ReviewImage');
const Review = require('./Review');
const Carrier = require('./Carrier');
const ShippingMethod = require('./ShippingMethod');
const SellerShippingMethod = require('./SellerShippingMethod');
const Shipment = require('./Shipment');
const Order = require('./Order');
const ShipmentItem = require('./ShipmentItem');
const Payment = require('./Payment');
const Refund = require('./Refund');
const RefundItem = require('./RefundItem');
const UserCoupon = require('./UserCoupon');
const OrderPromotion = require('./OrderPromotion');
const Coupon = require('./Coupon');
const QnA = require('./QnA');
const Inquiry = require('./Inquiry');
const ShippingAddress = require('./ShippingAddress');
const Notice = require('./Notice');
const BusinessProfile = require('./BusinessProfile');
const UserRole = require('./UserRole');
const WishlistItem = require('./WishlistItem');
const ProductAttributeValue = require('./ProductAttributeValue');
const Attribute = require('./Attribute');
const Category = require('./Category');
const CategoryImage = require('./CategoryImage');
const CategoryAttribute = require('./CategoryAttribute');
const ProductImage = require('./ProductImage');
const ProductTag = require('./ProductTag');
const Tag = require('./Tag');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

// let sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (
//       file.indexOf('.') !== 0 &&
//       file !== basename &&
//       file.slice(-3) === '.js' &&
//       file.indexOf('.test.js') === -1
//     );
//   })
//   .forEach(file => {
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
//   });

// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

// db.sequelize = sequelize;

// User associations
User.hasOne(BusinessProfile, { foreignKey: 'user_id', as: 'business_profile', onDelete: 'CASCADE' });
User.hasMany(UserRole, { foreignKey: 'user_id', as: 'roles', onDelete: 'CASCADE' });
User.hasMany(WishlistItem, { foreignKey: 'user_id', as: 'wishlist', onDelete: 'CASCADE' });
User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cart_items', onDelete: 'CASCADE' });
User.hasMany(UserCoupon, { foreignKey: 'user_id', as: 'user_coupons', onDelete: 'CASCADE' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders', onDelete: 'RESTRICT' }); // 주문은 사용자 삭제 시 유지될 수 있도록 SET NULL 또는 RESTRICT
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews', onDelete: 'CASCADE' });
User.hasMany(QnA, { foreignKey: 'user_id', as: 'qnas_asked', onDelete: 'CASCADE' });
User.hasMany(QnA, { foreignKey: 'seller_id', as: 'qnas_answered', onDelete: 'SET NULL' }); // 판매자 삭제 시 답변은 유지
User.hasMany(Inquiry, { foreignKey: 'user_id', as: 'inquiries', onDelete: 'CASCADE' });
User.hasMany(Inquiry, { foreignKey: 'answered_by_admin_id', as: 'inquiries_answered', onDelete: 'SET NULL' });
User.hasMany(ShippingAddress, { foreignKey: 'user_id', as: 'shipping_addresses', onDelete: 'CASCADE' });
User.hasMany(Product, { foreignKey: 'seller_id', as: 'seller_products', onDelete: 'RESTRICT' }); // 판매 상품이 있으면 판매자 삭제 제한
User.hasMany(SellerShippingMethod, { foreignKey: 'seller_id', as: 'seller_shipping_methods', onDelete: 'CASCADE' });
User.hasMany(Notice, { foreignKey: 'admin_id', as: 'notices_by_admin', onDelete: 'SET NULL' });
User.hasMany(Refund, { foreignKey: 'processed_by', as: 'refunds_processed', onDelete: 'SET NULL' });

BusinessProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserRole.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Category associations
Category.hasMany(Category, { as: 'children', foreignKey: 'parent_id', onDelete: 'SET NULL' }); // 하위 카테고리는 부모 삭제 시 최상위로
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });
Category.hasMany(CategoryImage, { foreignKey: 'category_id', as: 'images', onDelete: 'CASCADE' });
Category.hasMany(CategoryAttribute, { foreignKey: 'category_id', as: 'category_attributes_info', onDelete: 'CASCADE' }); // 이름 변경 주의: CategoryAttribute -> category_attributes_info
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' }); // 카테고리 삭제 시 상품의 category_id는 SET NULL 또는 RESTRICT

CategoryImage.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
CategoryAttribute.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
CategoryAttribute.belongsTo(Attribute, { foreignKey: 'attribute_id', as: 'attribute' });

// Attribute associations
Attribute.hasMany(CategoryAttribute, { foreignKey: 'attribute_id', as: 'category_attributes_info', onDelete: 'CASCADE' }); // 이름 변경 주의
Attribute.hasMany(ProductAttributeValue, { foreignKey: 'attribute_id', as: 'product_values', onDelete: 'CASCADE' });

// Product associations
Product.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options', onDelete: 'CASCADE' });
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
Product.hasMany(ProductAttributeValue, { foreignKey: 'product_id', as: 'attribute_values', onDelete: 'CASCADE' });
Product.hasMany(WishlistItem, { foreignKey: 'product_id', as: 'wishlist_items', onDelete: 'CASCADE' });
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews', onDelete: 'CASCADE' });
Product.hasMany(QnA, { foreignKey: 'product_id', as: 'qnas', onDelete: 'CASCADE' });
Product.belongsToMany(Tag, { through: ProductTag, foreignKey: 'product_id', otherKey: 'tag_id', as: 'tags' });
Product.belongsToMany(Promotion, { through: PromotionProduct, foreignKey: 'product_id', otherKey: 'promotion_id', as: 'applied_promotions' });
Product.hasMany(PromotionProduct, { foreignKey: 'product_id', as: 'promotion_product_entries_for_product' }); // Product -> PromotionProduct


ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductOption.hasMany(ProductOptionValue, { foreignKey: 'product_option_id', as: 'values', onDelete: 'CASCADE' });
ProductOption.hasMany(ProductVariantOptionValue, { foreignKey: 'product_option_id', as: 'variant_links_for_option', onDelete: 'CASCADE' }); // 이름 변경

ProductOptionValue.belongsTo(ProductOption, { foreignKey: 'product_option_id', as: 'option' }); // 이름 변경: product_option -> option
ProductOptionValue.hasMany(ProductVariantOptionValue, { foreignKey: 'product_option_value_id', as: 'variant_links_for_value', onDelete: 'CASCADE' }); // 이름 변경

ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductVariant.hasMany(ProductVariantOptionValue, { foreignKey: 'variant_id', as: 'option_values', onDelete: 'CASCADE' }); // Variant의 옵션 값 조합
ProductVariant.hasMany(CartItem, { foreignKey: 'product_variant_id', as: 'cart_items', onDelete: 'CASCADE' });
ProductVariant.hasMany(OrderItem, { foreignKey: 'product_variant_id', as: 'order_items', onDelete: 'RESTRICT' }); // 주문된 variant는 삭제 제한
ProductVariant.hasMany(ProductVariantShippingMethod, { foreignKey: 'product_variant_id', as: 'shipping_methods_config', onDelete: 'CASCADE' }); // 이름 변경: shipping_methods_info -> shipping_methods_config

ProductVariantOptionValue.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });
ProductVariantOptionValue.belongsTo(ProductOption, { foreignKey: 'product_option_id', as: 'option' }); // 이름 변경
ProductVariantOptionValue.belongsTo(ProductOptionValue, { foreignKey: 'product_option_value_id', as: 'value_detail' }); // 이름 변경: product_option_value -> value_detail

ProductAttributeValue.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductAttributeValue.belongsTo(Attribute, { foreignKey: 'attribute_id', as: 'attribute' });

// Tag associations
Tag.belongsToMany(Product, { through: ProductTag, foreignKey: 'tag_id', otherKey: 'product_id', as: 'products' });
ProductTag.belongsTo(Product, { foreignKey: 'product_id' });
ProductTag.belongsTo(Tag, { foreignKey: 'tag_id' });

// Wishlist associations
WishlistItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
WishlistItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// CartItem associations
CartItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'product_variant' });

// Coupon, Promotion associations
Coupon.hasMany(UserCoupon, { foreignKey: 'coupon_id', as: 'user_coupons', onDelete: 'CASCADE' });
Coupon.hasOne(Promotion, { foreignKey: 'coupon_id', as: 'linked_promotion' }); // 이름 변경: promotion -> linked_promotion (Promotion.coupon과 구분)

UserCoupon.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserCoupon.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon_detail' }); // 이름 변경: coupon -> coupon_detail
UserCoupon.belongsTo(Order, { foreignKey: 'order_id', as: 'order_applied_to' }); // 이름 변경

Promotion.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon_info' }); // 이름 변경: coupon -> coupon_info
Promotion.hasMany(PromotionCondition, { foreignKey: 'promotion_id', as: 'conditions', onDelete: 'CASCADE' });
Promotion.hasMany(PromotionProduct, { foreignKey: 'promotion_id', as: 'promotion_product_entries' }); // Promotion -> PromotionProduct
Promotion.hasMany(OrderPromotion, { foreignKey: 'promotion_id', as: 'applied_to_orders', onDelete: 'CASCADE' });
Promotion.belongsToMany(Product, {through: PromotionProduct, foreignKey: 'promotion_id', otherKey: 'product_id', as: 'applicable_products'}) // 없앨까?

PromotionCondition.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });
PromotionProduct.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });
PromotionProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order associations
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments', onDelete: 'CASCADE' });
Order.hasMany(Shipment, { foreignKey: 'order_id', as: 'shipments', onDelete: 'CASCADE' });
Order.hasMany(UserCoupon, { foreignKey: 'order_id', as: 'used_user_coupons' }); // 이름 변경: used_coupons -> used_user_coupons
Order.hasMany(OrderPromotion, { foreignKey: 'order_id', as: 'applied_order_promotions', onDelete: 'CASCADE' }); // 이름 변경
Order.hasMany(Refund, { foreignKey: 'order_id', as: 'refunds', onDelete: 'CASCADE' }); // 주문 삭제 시 환불 기록은 지움움

OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'product_variant' });
OrderItem.hasOne(Review, { foreignKey: 'order_item_id', as: 'review', onDelete: 'SET NULL' }); // 리뷰는 주문 아이템 삭제 시 연결만 해제
OrderItem.hasMany(ShipmentItem, { foreignKey: 'order_item_id', as: 'shipment_items', onDelete: 'CASCADE' });
OrderItem.hasMany(RefundItem, { foreignKey: 'order_item_id', as: 'refund_items', onDelete: 'CASCADE' });

OrderPromotion.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderPromotion.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });

// Payment associations
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Payment.hasMany(Refund, { foreignKey: 'payment_id', as: 'refunds', onDelete: 'SET NULL' }); // 결제 삭제 시 환불 기록은 남김

// Carrier, ShippingMethod, SellerShippingMethod, Shipment, ShipmentItem associations
Carrier.hasMany(ShippingMethod, { foreignKey: 'carrier_id', as: 'shipping_methods' });

ShippingMethod.belongsTo(Carrier, { foreignKey: 'carrier_id', as: 'carrier' });
ShippingMethod.hasMany(ProductVariantShippingMethod, { foreignKey: 'shipping_method_id', as: 'product_variant_shipping_configs', onDelete: 'CASCADE' }); // 이름 변경
ShippingMethod.hasMany(SellerShippingMethod, { foreignKey: 'shipping_method_id', as: 'seller_shipping_configs', onDelete: 'CASCADE' }); // 이름 변경
ShippingMethod.hasMany(Shipment, { foreignKey: 'shipping_method_id', as: 'shipments' });

ProductVariantShippingMethod.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'product_variant' });
ProductVariantShippingMethod.belongsTo(ShippingMethod, { foreignKey: 'shipping_method_id', as: 'shipping_method' });

SellerShippingMethod.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });
SellerShippingMethod.belongsTo(ShippingMethod, { foreignKey: 'shipping_method_id', as: 'shipping_method' });

Shipment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Shipment.belongsTo(ShippingMethod, { foreignKey: 'shipping_method_id', as: 'shipping_method' });
Shipment.hasMany(ShipmentItem, { foreignKey: 'shipment_id', as: 'items', onDelete: 'CASCADE' });

ShipmentItem.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });
ShipmentItem.belongsTo(OrderItem, { foreignKey: 'order_item_id', as: 'order_item' });

// Review associations
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Review.belongsTo(OrderItem, { foreignKey: 'order_item_id', as: 'order_item' });
Review.hasMany(ReviewImage, { foreignKey: 'review_id', as: 'images', onDelete: 'CASCADE' });

ReviewImage.belongsTo(Review, { foreignKey: 'review_id', as: 'review' });

// QnA associations
QnA.belongsTo(User, { foreignKey: 'user_id', as: 'questioner' }); // 이름 변경: user -> questioner
QnA.belongsTo(User, { foreignKey: 'seller_id', as: 'answerer' }); // 이름 변경: seller -> answerer
QnA.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Inquiry associations
Inquiry.belongsTo(User, { foreignKey: 'user_id', as: 'inquirer' }); // 이름 변경
Inquiry.belongsTo(User, { foreignKey: 'answered_by_admin_id', as: 'admin_answerer' }); // 이름 변경

// ShippingAddress associations
ShippingAddress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Notice associations
Notice.belongsTo(User, { foreignKey: 'admin_id', as: 'admin_author' }); // 이름 변경

// Refund associations
Refund.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Refund.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });
Refund.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' }); // 처리한 관리자/판매자
Refund.hasMany(RefundItem, { foreignKey: 'refund_id', as: 'items', onDelete: 'CASCADE' });

RefundItem.belongsTo(Refund, { foreignKey: 'refund_id', as: 'refund' });
RefundItem.belongsTo(OrderItem, { foreignKey: 'order_item_id', as: 'order_item' });


module.exports = {
  User,
  Product,
  Order,
  OrderItem,
  Payment,
  Category,
  Attribute,
  ProductOption,
  ProductVariant,
  Review,
  Inquiry,
  WishlistItem,
  CartItem,
  ShippingAddress,
  Notice,
  QnA,
  ProductImage,
  Coupon,
  UserCoupon,
  UserRole,
  BusinessProfile,
  ProductAttributeValue,
  ProductOptionValue,
  Tag,
  ProductTag,
  ProductVariantShippingMethod,
  CategoryAttribute,
  ProductVariantOptionValue,
  Shipment,
  ReviewImage,
  ShippingMethod,
  PromotionCondition,
  Promotion,
  Carrier,
  PromotionProduct,
  Refund,
  RefundItem,
  SellerShippingMethod,
};