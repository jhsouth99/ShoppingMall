const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database.js');
const Seller = require('./Seller.js')

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  seller_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: Seller, key: 'id' }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  discount: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  stock: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  min_order_qty: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1
  },
  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isHot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_business_only: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'products',
  timestamps: false   // created_at 컬럼을 직접 정의했으므로 true로 두지 않습니다
});

Product.belongsTo(Seller, { foreignKey: 'seller_id', as: 'seller'});

module.exports = Product;
