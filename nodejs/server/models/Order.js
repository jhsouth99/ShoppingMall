// models/order.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { OrderStatus } = require('../enums');
const User = require('./User');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Shipment = require('./Shipment');
const UserCoupon = require('./UserCoupon');
const OrderPromotion = require('./OrderPromotion');
const Refund = require('./Refund');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  recipient_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipient_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipient_address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipient_address_detail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recipient_zipcode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(OrderStatus),
    allowNull: false
  },
  sub_total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shipping_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  coupon_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  promotion_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  final_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'orders',
  timestamps: false, // 수동 정의
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ],
  hooks: { // 계산 필드 (Sequelize hook 사용)
    beforeValidate: (orderInstance) => {
      const couponDiscount = parseFloat(orderInstance.coupon_discount_amount || 0);
      const promotionDiscount = parseFloat(orderInstance.promotion_discount_amount || 0);
      orderInstance.total_discount_amount = (couponDiscount + promotionDiscount).toFixed(2);

      const subTotal = parseFloat(orderInstance.sub_total_amount || 0);
      const shipping = parseFloat(orderInstance.shipping_fee || 0);
      orderInstance.final_amount = (subTotal + shipping - parseFloat(orderInstance.total_discount_amount)).toFixed(2);
    }
  }
});

module.exports = Order;