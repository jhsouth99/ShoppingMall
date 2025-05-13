// models/orderItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { OrderItemStatus } = require('../enums');
const Order = require('./Order');
const ProductVariant = require('./ProductVariant');
const Review = require('./Review');
const ShipmentItem = require('./ShipmentItem');
const RefundItem = require('./RefundItem');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'orders', key: 'id' }
  },
  product_variant_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'product_variants', key: 'id' }
  },
  comment: { // ProductOptionValue.comment_needed = true 일 때 사용
    type: DataTypes.STRING,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price_at_purchase: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_price_at_purchase: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(OrderItemStatus),
    allowNull: false
  }
}, {
  tableName: 'order_items',
  timestamps: false,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['product_variant_id'] }
  ],
  hooks: { // total_price_at_purchase 자동 계산
    beforeValidate: (orderItemInstance) => {
      if (orderItemInstance.quantity && orderItemInstance.price_at_purchase) {
        orderItemInstance.total_price_at_purchase = (parseFloat(orderItemInstance.quantity) * parseFloat(orderItemInstance.price_at_purchase)).toFixed(2);
      }
    }
  }
});

module.exports = OrderItem;