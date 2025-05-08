const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Coupon = require('./Coupon');

const UserCoupon = sequelize.define('UserCoupon', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  coupon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Coupon,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
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
  },
  issued_at : {
    type: DataTypes.DATE,
    allowNull: false
  },
  created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
}, {
  tableName: 'user_coupons',
  timestamps: false
});

// 다대다(M:N) 관계 설정
UserCoupon.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'    // couponRoutes.js 에서 as: 'User' 로 include 했으므로
});
User.hasMany(UserCoupon, {
  foreignKey: 'user_id',
  as: 'userCoupons'
});

UserCoupon.belongsTo(Coupon, {
  foreignKey: 'coupon_id',
  as: 'Coupon'  // couponRoutes.js 에서 as: 'Coupon' 로 include 했으므로
});
Coupon.hasMany(UserCoupon, {
  foreignKey: 'coupon_id',
  as: 'userCoupons'
});

User.belongsToMany(Coupon, {
  through: UserCoupon,
  foreignKey: 'user_id',
  otherKey: 'coupon_id',
  as: 'coupons'
});
Coupon.belongsToMany(User, {
  through: UserCoupon,
  foreignKey: 'coupon_id',
  otherKey: 'user_id',
  as: 'users'
});

module.exports = UserCoupon;
