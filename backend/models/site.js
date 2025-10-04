'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Site extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Site.belongsToMany(models.User, { through: 'UserRoles', foreignKey: 'siteId', otherKey: 'userId' });
      Site.hasMany(models.Stock, { foreignKey: 'siteId' });
    }
  }
  Site.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Site',
  });
  return Site;
};