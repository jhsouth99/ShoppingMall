// models/user.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require("bcrypt");
const BusinessProfile = require('./BusinessProfile');
const UserRole = require('./UserRole');
const WishlistItem = require('./WishlistItem');
const CartItem = require('./CartItem');
const UserCoupon = require('./UserCoupon');
const Order = require('./Order');
const Review = require('./Review');
const QnA = require('./QnA');
const Inquiry = require('./Inquiry');
const ShippingAddress = require('./ShippingAddress');
const Product = require('./Product');
const SellerShippingMethod = require('./SellerShippingMethod');
const Notice = require('./Notice');
const Refund = require('./Refund');

const SALT_ROUNDS = 10;

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED, // Prisma의 String @id @default(cuid())에 해당
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
  // updatedAt은 Prisma 스키마에 없었으므로 생략. 필요시 추가.
}, {
  tableName: 'users', // user -> users (복수형)
  timestamps: false, // created_at, (updated_at)을 수동으로 정의했으므로 false
  // paranoid: true, // Sequelize의 paranoid 모드 대신 deleted_at 수동 관리
  indexes: [
    { unique: true, fields: ['username'] },
    { unique: true, fields: ['phone'] },
    { unique: true, fields: ['email'] }
  ],
  hooks: {
    // Create 전, 비밀번호를 해싱
    beforeCreate: async (user, options) => {
      if (user.password) {
        const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
        user.password = hash;
      }
    },
    // Update 시 password 필드가 바뀌었다면 다시 해싱
    beforeUpdate: async (user, options) => {
      if (user.changed('password')) {
        const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
        user.password = hash;
      }
    }
  }
});


// User 인스턴스 메소드 추가
User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;