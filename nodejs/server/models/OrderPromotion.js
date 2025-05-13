// models/orderPromotion.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./Order');
const Promotion = require('./Promotion');

const OrderPromotion = sequelize.define('OrderPromotion', {
  order_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'orders', key: 'id' }
  },
  promotion_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: { model: 'promotions', key: 'id' }
  },
  discount_amount_applied: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'order_promotions',
  timestamps: false
});

module.exports = OrderPromotion;