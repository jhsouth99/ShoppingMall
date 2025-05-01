const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database.js');
const Product = require('./Product');

const ProductOption = sequelize.define('ProductOption', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  option_name: {
    type: DataTypes.STRING(50),
    allowNull: false
    // 예: 'size', 'color'
  },
  option_value: {
    type: DataTypes.STRING(50),
    allowNull: false
    // 예: '250', 'red'
  },
  price_modifier: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
    // 기본 가격에서 +/− 변경분
  },
  stock: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'product_options',
  timestamps: false
});

// 관계 설정
Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = ProductOption;
