// models/payment.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { PaymentMethodType, CardIssuer, PaymentStatus } = require('../enums');

const Payment = sequelize.define('Payment', {
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
  payment_method_type: {
    type: DataTypes.ENUM,
    values: Object.values(PaymentMethodType),
    allowNull: false
  },
  card_issuer: {
    type: DataTypes.ENUM,
    values: Object.values(CardIssuer),
    allowNull: true // 카드 결제 아닐 시 null
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(PaymentStatus),
    allowNull: false
  },
  transaction_id: { // 결제사 거래 ID
    type: DataTypes.STRING,
    allowNull: true, // 결제 시작 전에는 null
    unique: true
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'payments',
  timestamps: false, // 수동 정의
  indexes: [
    { fields: ['order_id'] },
    { unique: true, fields: ['transaction_id'] }
  ]
});

module.exports = Payment;