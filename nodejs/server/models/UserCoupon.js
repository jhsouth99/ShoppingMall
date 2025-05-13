// models/userCoupon.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Coupon = require('./Coupon');
const Order = require('./Order');

const UserCoupon = sequelize.define('UserCoupon', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  coupon_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'coupons', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  order_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true, // 쿠폰 발급 시점에는 null일 수 있음
    references: { model: 'orders', key: 'id' }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'user_coupons',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'coupon_id', 'order_id']
      // order_id가 NULL일 수 있는 복합 유니크 제약은 DB에 따라 다르게 동작할 수 있으므로,
      // 애플리케이션 레벨에서 추가적인 유효성 검사가 필요할 수 있습니다.
    },
    { fields: ['order_id'] }
  ]
});

module.exports = UserCoupon;