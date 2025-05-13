// models/promotionCondition.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PromotionConditionType, CardIssuer } = require('../enums');
const Promotion = require('./Promotion');

const PromotionCondition = sequelize.define('PromotionCondition', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  promotion_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'promotions', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  condition_type: {
    type: DataTypes.ENUM,
    values: Object.values(PromotionConditionType),
    allowNull: false
  },
  value: { // 일반적인 조건 값 (문자열)
    type: DataTypes.STRING,
    allowNull: true
  },
  card_issuer_value: {
    type: DataTypes.ENUM,
    values: Object.values(CardIssuer),
    allowNull: true
  },
  string_value: {
    type: DataTypes.STRING,
    allowNull: true
  },
  decimal_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  tableName: 'promotion_conditions',
  timestamps: false
});

module.exports = PromotionCondition;