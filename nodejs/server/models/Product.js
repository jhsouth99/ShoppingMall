// models/product.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const ProductOption = require('./ProductOption');
const ProductVariant = require('./ProductVariant');
const ProductImage = require('./ProductImage');
const Tag = require('./Tag');
const ProductTag = require('./ProductTag');
const WishlistItem = require('./WishlistItem');
const Review = require('./Review');
const QnA = require('./QnA');
const ProductAttributeValue = require('./ProductAttributeValue');
const Promotion = require('./Promotion');
const PromotionProduct = require('./PromotionProduct');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  seller_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: Category, key: 'id' }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  detailed_content: {
    type: DataTypes.TEXT('long'), // 매우 긴 HTML 내용을 위해 'long' 옵션 고려
    allowNull: true,
    comment: '상품 상세 설명 (HTML 형식)'
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  is_business_only: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  view_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  sold_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
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
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'products',
  timestamps: false, // 수동 정의
  // paranoid: true, // deleted_at 수동 관리
  indexes: [
    { fields: ['seller_id'] },
    { fields: ['category_id'] },
    { fields: ['name'] },
    { fields: ['base_price'] },
    { fields: ['created_at'] },
    {
      name: 'ft_products_name_description',
      type: 'FULLTEXT',
      fields: ['name', 'description']
    }
  ]
});

module.exports = Product;