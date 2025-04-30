// server/models/Product.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  discount: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isHot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'products',
  timestamps: false       // createdAt/updatedAt 사용 시 true
});

module.exports = Product;