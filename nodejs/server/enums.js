const RoleType = { ADMIN: 'ADMIN', BUYER_INDIVIDUAL: 'BUYER_INDIVIDUAL', BUYER_BUSINESS: 'BUYER_BUSINESS', SELLER: 'SELLER' };
const CategoryImageType = { BANNER: 'BANNER', ICON: 'ICON' };
const ProductImageType = { THUMBNAIL: 'THUMBNAIL', DETAIL: 'DETAIL', ZOOM: 'ZOOM' };
const DiscountType = { PERCENTAGE: 'PERCENTAGE', FIXED_AMOUNT: 'FIXED_AMOUNT' };
const OrderStatus = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', SHIPPED: 'SHIPPED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED', RETURNED: 'RETURNED', PARTIALLY_RETURNED: 'PARTIALLY_RETURNED' };
const OrderItemStatus = { PENDING: 'PENDING', PREPARING: 'PREPARING', SHIPPED: 'SHIPPED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED', RETURN_REQUESTED: 'RETURN_REQUESTED', RETURNED: 'RETURNED' };
const PaymentMethodType = { CREDIT_CARD: 'CREDIT_CARD', BANK_TRANSFER: 'BANK_TRANSFER', VIRTUAL_ACCOUNT: 'VIRTUAL_ACCOUNT', KAKAO_PAY: 'KAKAO_PAY', NAVER_PAY: 'NAVER_PAY' };
const PaymentStatus = { PENDING: 'PENDING', COMPLETED: 'COMPLETED', FAILED: 'FAILED', REFUNDED: 'REFUNDED', PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED' };
const AttributeDataType = { TEXT: 'TEXT', NUMBER: 'NUMBER', BOOLEAN: 'BOOLEAN', DATE: 'DATE' };
const ShipmentStatus = { PREPARING: 'PREPARING', LABEL_PRINTED: 'LABEL_PRINTED', PICKED_UP: 'PICKED_UP', IN_TRANSIT: 'IN_TRANSIT', OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY', DELIVERED: 'DELIVERED', FAILED_ATTEMPT: 'FAILED_ATTEMPT' };
const RefundReasonType = { DEFECTIVE: 'DEFECTIVE', WRONG_ITEM: 'WRONG_ITEM', CHANGE_OF_MIND: 'CHANGE_OF_MIND', ETC: 'ETC' };
const RefundStatus = { REQUESTED: 'REQUESTED', PROCESSING: 'PROCESSING', APPROVED: 'APPROVED', REJECTED: 'REJECTED', COMPLETED: 'COMPLETED' };
const PromotionType = { CART_DISCOUNT: 'CART_DISCOUNT', PRODUCT_DISCOUNT: 'PRODUCT_DISCOUNT', CARD_BENEFIT: 'CARD_BENEFIT', SHIPPING_DISCOUNT: 'SHIPPING_DISCOUNT', CODE_COUPON: 'CODE_COUPON' };
const PromotionConditionType = { MIN_PURCHASE_AMOUNT: 'MIN_PURCHASE_AMOUNT', CARD_ISSUER: 'CARD_ISSUER', SPECIFIC_PRODUCTS: 'SPECIFIC_PRODUCTS', USER_GROUP: 'USER_GROUP' };
const CardIssuer = { HYUNDAI_CARD: 'HYUNDAI_CARD', SAMSUNG_CARD: 'SAMSUNG_CARD', KB_KOOKMIN_CARD: 'KB_KOOKMIN_CARD', SHINHAN_CARD: 'SHINHAN_CARD', LOTTE_CARD: 'LOTTE_CARD', HANA_CARD: 'HANA_CARD', WOORI_CARD: 'WOORI_CARD', NH_CARD: 'NH_CARD', BC_CARD: 'BC_CARD' };


// enums.js

// const RoleType = [
//   'ADMIN',
//   'BUYER_INDIVIDUAL',
//   'BUYER_BUSINESS',
//   'SELLER'
// ];

// const CategoryImageType = [
//   'BANNER',
//   'ICON'
// ];

// const ProductImageType = [
//   'THUMBNAIL',
//   'DETAIL',
//   'ZOOM'
// ];

// const DiscountType = [
//   'PERCENTAGE',
//   'FIXED_AMOUNT'
// ];

// const OrderStatus = [
//   'PENDING',
//   'PROCESSING',
//   'SHIPPED',
//   'DELIVERED',
//   'CANCELLED',
//   'RETURNED'
// ].map(elem => "ORDER_" + elem);

// const OrderItemStatus = [
//   'PENDING',
//   'PREPARING',
//   'SHIPPED',
//   'DELIVERED',
//   'CANCELLED',
//   'RETURN_REQUESTED',
//   'RETURNED'
// ].map(elem => "ORDER_ITEM_" + elem);

// const PaymentMethodType = [
//   'CREDIT_CARD',
//   'BANK_TRANSFER',
//   'VIRTUAL_ACCOUNT',
//   'KAKAO_PAY',
//   'NAVER_PAY'
// ];

// const PaymentStatus = [
//   'PENDING',
//   'COMPLETED',
//   'FAILED',
//   'REFUNDED',
//   'PARTIALLY_REFUNDED'
// ].map(elem => "PAYMENT_" + elem);;

// const AttributeDataType = [
//   'TEXT',
//   'NUMBER',
//   'BOOLEAN',
//   'DATE'
// ];

// const ShipmentStatus = [
//   'PREPARING',
//   'LABEL_PRINTED',
//   'PICKED_UP',
//   'IN_TRANSIT',
//   'OUT_FOR_DELIVERY',
//   'DELIVERED',
//   'FAILED_ATTEMPT'
// ];

// const RefundReasonType = [
//   'DEFECTIVE',
//   'WRONG_ITEM',
//   'CHANGE_OF_MIND',
//   'ETC'
// ];

// const RefundStatus = [
//   'REQUESTED',
//   'PROCESSING',
//   'APPROVED',
//   'REJECTED',
//   'COMPLETED'
// ];

// const PromotionType = [
//   'CART_DISCOUNT',
//   'PRODUCT_DISCOUNT',
//   'CARD_BENEFIT',
//   'SHIPPING_DISCOUNT',
//   'CODE_COUPON'
// ];

// const PromotionConditionType = [
//   'MIN_PURCHASE_AMOUNT',
//   'CARD_ISSUER',
//   'SPECIFIC_PRODUCTS',
//   'USER_GROUP'
// ];

// const CardIssuer = [
//   'HYUNDAI_CARD',
//   'SAMSUNG_CARD',
//   'KB_KOOKMIN_CARD',
//   'SHINHAN_CARD',
//   'LOTTE_CARD',
//   'HANA_CARD',
//   'WOORI_CARD',
//   'NH_CARD',
//   'BC_CARD'
// ];

module.exports = {
  RoleType, CategoryImageType, ProductImageType, DiscountType, OrderStatus, OrderItemStatus,
  PaymentMethodType, PaymentStatus, AttributeDataType, ShipmentStatus, RefundReasonType,
  RefundStatus, PromotionType, PromotionConditionType, CardIssuer,
};