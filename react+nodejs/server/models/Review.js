const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const User    = require('./User');

const Review = sequelize.define(
  'Review',
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
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: { min: 1, max: 5 }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  {
    tableName: 'reviews',
    timestamps: false
  }
);

// 관계 설정
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Review.belongsTo(User,    { foreignKey: 'user_id',    as: 'user'    });

module.exports = Review;
