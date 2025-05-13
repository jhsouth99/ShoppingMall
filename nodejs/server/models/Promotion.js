// models/promotion.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { PromotionType, DiscountType } = require('../enums');
const Coupon = require('./Coupon');
const PromotionCondition = require('./PromotionCondition');
const Product = require('./Product');
const PromotionProduct = require('./PromotionProduct');
const OrderPromotion = require('./OrderPromotion');

const Promotion = sequelize.define('Promotion', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  promotion_type: {
    type: DataTypes.ENUM,
    values: Object.values(PromotionType),
    allowNull: false
  },
  discount_type: {
    type: DataTypes.ENUM,
    values: Object.values(DiscountType),
    allowNull: false
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  max_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  coupon_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    unique: true, // 1:1 관계, CODE_COUPON 타입일 때
    references: { model: 'coupons', key: 'id' }
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
  tableName: 'promotions',
  timestamps: false // 수동 정의
});

module.exports = Promotion;