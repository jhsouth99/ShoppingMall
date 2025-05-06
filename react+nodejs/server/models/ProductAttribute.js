const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database.js');
const Product = require('./Product.js');
const Attribute = require('./Attribute.js');

const ProductAttribute = sequelize.define('ProductAttribute', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: Product, key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  attribute_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: Attribute, key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  attribute_value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'product_attributes',
  timestamps: false,
  indexes: [
    { name: 'idx_product_attr_product', fields: ['product_id'] },
    { name: 'idx_product_attr_attribute', fields: ['attribute_id'] }
  ]
});

// Associations
Product.hasMany(ProductAttribute, { foreignKey: 'product_id', as: 'attributes' });
ProductAttribute.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Attribute.hasMany(ProductAttribute, { foreignKey: 'attribute_id', as: 'productAttributes' });
ProductAttribute.belongsTo(Attribute, { foreignKey: 'attribute_id', as: 'attribute' });

module.exports = ProductAttribute;
