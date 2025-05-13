// models/shippingMethod.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Carrier = require('./Carrier');
const ProductVariantShippingMethod = require('./ProductVariantShippingMethod');
const SellerShippingMethod = require('./SellerShippingMethod');
const Shipment = require('./Shipment');

const ShippingMethod = sequelize.define('ShippingMethod', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  carrier_id: {
    type: DataTypes.INTEGER.UNSIGNED, // Carrier ID 타입과 일치
    allowNull: true, // 직접배송 등 carrier 없을 수 있음
    references: { model: 'carriers', key: 'id' }
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  estimated_days: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
  // Prisma 스키마에 created_at/updated_at 없었음
}, {
  tableName: 'shipping_methods', // shipping_method -> shipping_methods
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['name', 'carrier_id'] // carrier_id가 NULL일 수 있는 복합 유니크
    }
  ]
});

module.exports = ShippingMethod;