// models/shippingAddress.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const ShippingAddress = sequelize.define('ShippingAddress', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  name: { // 주소 별칭
    type: DataTypes.STRING,
    allowNull: false
  },
  recipient_name: { // 수령인 
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address_detail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zipcode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'KR'
  },
  is_default: { // isDefault -> is_default
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: { // Prisma createdAt
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
  // Prisma 스키마에 updatedAt 없었음
}, {
  tableName: 'shipping_addresses', // shipping_address -> shipping_addresses
  timestamps: false, // created_at 수동 관리
  indexes: [
    { fields: ['user_id'] }
  ]
});

module.exports = ShippingAddress;