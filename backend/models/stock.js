'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Stock.belongsTo(models.Item, { foreignKey: 'itemId' });
      Stock.belongsTo(models.Site, { foreignKey: 'siteId' });
    }
  }
  Stock.init({
    on_hand: DataTypes.INTEGER,
    reserved: DataTypes.INTEGER,
    itemId: DataTypes.INTEGER,
    siteId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Stock',
  });
  return Stock;
};