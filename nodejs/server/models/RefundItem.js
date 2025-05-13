// models/refundItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Refund = require('./Refund');
const OrderItem = require('./OrderItem');

const RefundItem = sequelize.define('RefundItem', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  refund_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'refunds', key: 'id' }
  },
  order_item_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'order_items', key: 'id' }
  },
  quantity: { // 환불 수량
    type: DataTypes.INTEGER,
    allowNull: false
  },
  item_price_at_refund_time: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  item_total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'refund_items',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['refund_id', 'order_item_id']
    }
  ],
  hooks: { // item_total_amount 자동 계산
    beforeValidate: (refundItemInstance) => {
      if (refundItemInstance.quantity && refundItemInstance.item_price_at_refund_time) {
        refundItemInstance.item_total_amount = (parseFloat(refundItemInstance.quantity) * parseFloat(refundItemInstance.item_price_at_refund_time)).toFixed(2);
      }
    }
  }
});

module.exports = RefundItem;