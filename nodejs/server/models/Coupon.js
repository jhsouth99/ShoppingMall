// models/coupon.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { DiscountType } = require('../enums');
const UserCoupon = require('./UserCoupon');
const Promotion = require('./Promotion');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  discount_type: {
    type: DataTypes.ENUM,
    values: Object.values(DiscountType), // ['PERCENTAGE', 'FIXED_AMOUNT']
    allowNull: false
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: true
  },
  valid_to: {
    type: DataTypes.DATE,
    allowNull: true
  },
  min_purchase_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  usage_limit_per_user: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  total_usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  current_usage_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'coupons',
  timestamps: false // created_at 수동 정의
});

module.exports = Coupon;