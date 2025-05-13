// models/refund.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { RefundReasonType, RefundStatus } = require('../enums');
const Order = require('./Order');
const Payment = require('./Payment');
const User = require('./User');
const RefundItem = require('./RefundItem');

const Refund = sequelize.define('Refund', {
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
  payment_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true, // 주문 단위 환불 시 null 가능
    references: { model: 'payments', key: 'id' }
  },
  product_items_total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shipping_fee_deduction: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  other_deductions: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  final_refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  refund_reason: {
    type: DataTypes.ENUM,
    values: Object.values(RefundReasonType),
    allowNull: false
  },
  refund_reason_detail: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(RefundStatus),
    allowNull: false
  },
  requested_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  processed_at: { 
    type: DataTypes.DATE,
    allowNull: true
  },
  processed_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
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
  tableName: 'refunds',
  timestamps: false, // 수동 정의
  indexes: [
    { fields: ['order_id'] },
    { fields: ['payment_id'] },
    { fields: ['processed_by'] },
    { unique: true, fields: ['transaction_id'] }
  ],
  hooks: { // final_refund_amount 자동 계산
    beforeValidate: (refundInstance) => {
      const itemsTotal = parseFloat(refundInstance.product_items_total_amount || 0);
      const shippingDeduction = parseFloat(refundInstance.shipping_fee_deduction || 0);
      const otherDeduction = parseFloat(refundInstance.other_deductions || 0);
      refundInstance.final_refund_amount = (itemsTotal - shippingDeduction - otherDeduction).toFixed(2);
    }
  }
});

module.exports = Refund;