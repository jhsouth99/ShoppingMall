// models/shipment.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { ShipmentStatus } = require('../enums');
const Order = require('./Order');
const ShippingMethod = require('./ShippingMethod');
const ShipmentItem = require('./ShipmentItem');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'orders', key: 'id' }
  },
  shipping_method_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'shipping_methods', key: 'id' }
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  carrier_name_snapshot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(ShipmentStatus),
    allowNull: false
  },
  recipient_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipient_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipient_address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipient_address_detail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recipient_zipcode: {
    type: DataTypes.STRING,
    allowNull: false
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
  tableName: 'shipments',
  timestamps: false, // 수동 정의
  indexes: [
    { fields: ['order_id'] }
  ]
});

module.exports = Shipment;