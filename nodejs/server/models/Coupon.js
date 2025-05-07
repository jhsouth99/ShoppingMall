const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  discount_type: {
    type: DataTypes.ENUM('percent', 'fixed'),  // 퍼센트 할인 or 고정금액 할인
    allowNull: false
  },
  discount_value: {
    type: DataTypes.INTEGER,  // %면 10%, 고정이면 5000 (원)
    allowNull: false
  },
  min_order_price: {
    type: DataTypes.INTEGER,  // 최소 주문 금액
    defaultValue: 0
  },
  usage_limit: {
    type: DataTypes.INTEGER,  // 총 사용 가능 횟수
    defaultValue: null
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Coupon;
