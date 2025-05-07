const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCoupon = sequelize.define('UserCoupon', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  coupon_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true  // 사용 시 주문 번호 기록
  }
});

module.exports = UserCoupon;
