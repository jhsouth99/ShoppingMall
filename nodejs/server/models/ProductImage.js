const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');

const ProductImage = sequelize.define(
  'ProductImage',
  {
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
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    alt_text: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '이미지 설명(alt 속성)'
    },
    image_type: {
      type: DataTypes.ENUM('thumbnail', 'detail', 'zoom'),
      allowNull: false,
      defaultValue: 'thumbnail',
      comment: '이미지 유형'
    },
    sort_order: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  {
    tableName: 'product_images',
    timestamps: false
  }
);

// 관계 설정
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = ProductImage;
