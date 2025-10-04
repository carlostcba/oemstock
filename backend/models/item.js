'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Un item pertenece a una Unidad de Medida (Uom)
      Item.belongsTo(models.Uom, { foreignKey: 'uom_id', as: 'uom' });

      // Un item (como Kit/Producto) puede tener muchos hijos en la tabla BOM
      Item.hasMany(models.ItemBom, { foreignKey: 'parent_item_id', as: 'BomChildren' });

      // Un item (como Elemento) puede ser parte de muchos padres en la tabla BOM
      Item.hasMany(models.ItemBom, { foreignKey: 'child_item_id', as: 'BomParents' });

      Item.hasMany(models.Stock, { foreignKey: 'itemId' });
    }
  }
  Item.init({
    sku: DataTypes.STRING,
    name: DataTypes.STRING,
    type: DataTypes.ENUM('ELEMENT', 'KIT', 'PRODUCT'),
    active: DataTypes.BOOLEAN,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Item',
  });
  return Item;
};