// models/carrier.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ShippingMethod = require('./ShippingMethod');

const Carrier = sequelize.define('Carrier', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tracking_url_format: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'carriers',
  timestamps: false
});

module.exports = Carrier;