const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database.js');
const Seller = require('./Seller.js');
const Category = require('./Category.js');

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
  sold_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  view_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  shipping_fee: {
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
  tableName: 'products',
  timestamps: false,   // created_at 컬럼을 직접 정의했으므로 true로 두지 않습니다
  indexes: [
    {
      name: 'ft_products_name_description',
      type: 'FULLTEXT',
      fields: ['name', 'description']
    }
  ]
});

Product.belongsTo(Seller, { foreignKey: 'seller_id', as: 'seller'});
//Product.belongsToMany(Category, { through: 'ProductCategory', foreignKey: 'product_id', otherKey: 'category_id', as: 'categories' });

module.exports = Product;
