'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    static associate(models) {
      // Asociacion con Item
      Stock.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'Item'
      });

      // Asociacion con Site
      Stock.belongsTo(models.Site, {
        foreignKey: 'siteId',
        as: 'Site'
      });
    }
  }
  
  Stock.init({
    on_hand: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reserved: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Stock',
    tableName: 'Stocks'
  });
  
  return Stock;
};