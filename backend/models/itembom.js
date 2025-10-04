'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ItemBom extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ItemBom.belongsTo(models.Item, { as: 'Parent', foreignKey: 'parent_item_id' });
      ItemBom.belongsTo(models.Item, { as: 'Child', foreignKey: 'child_item_id' });
    }
  }
  ItemBom.init({
    parent_item_id: DataTypes.INTEGER,
    child_item_id: DataTypes.INTEGER,
    quantity: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'ItemBom',
  });
  return ItemBom;
};