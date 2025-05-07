const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Admin = require('./User');

const Notice = sequelize.define(
  'Notice',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    admin_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Admin,
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  },
  {
    tableName: 'notices',
    timestamps: false
  }
);

// 관계 설정
Notice.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin' });

module.exports = Notice;
