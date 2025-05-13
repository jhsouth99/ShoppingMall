// models/shipmentItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Shipment = require('./Shipment');
const OrderItem = require('./OrderItem');

const ShipmentItem = sequelize.define('ShipmentItem', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  shipment_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'shipments', key: 'id' }
  },
  order_item_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'order_items', key: 'id' }
  },
  quantity: { // 해당 배송에 포함된 OrderItem의 수량
    type: DataTypes.INTEGER,
    allowNull: true // 분할 배송 등 고려하여 OrderItem.quantity와 다를 수 있음
  }
}, {
  tableName: 'shipment_items',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['shipment_id', 'order_item_id']
    }
  ]
});

module.exports = ShipmentItem;