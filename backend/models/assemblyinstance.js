// backend/models/assemblyinstance.js

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AssemblyInstance extends Model {
    static associate(models) {
      // Relacion con el template (Item de tipo KIT o PRODUCT)
      AssemblyInstance.belongsTo(models.Item, {
        foreignKey: 'template_id',
        as: 'Template'
      });

      // Relacion con el sitio
      AssemblyInstance.belongsTo(models.Site, {
        foreignKey: 'site_id',
        as: 'Site'
      });

      // Relacion con el usuario que creo la instancia
      AssemblyInstance.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'Creator'
      });

      // Relacion con el usuario que completo el ensamblado
      AssemblyInstance.belongsTo(models.User, {
        foreignKey: 'completed_by',
        as: 'Completer'
      });

      // Relacion con el usuario que verifico el ensamblado
      AssemblyInstance.belongsTo(models.User, {
        foreignKey: 'verified_by',
        as: 'Verifier'
      });
    }
  }

  AssemblyInstance.init(
    {
      template_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      site_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      status: {
        type: DataTypes.ENUM('BACKLOG', 'TODO', 'IN_PROGRESS', 'TO_VERIFY', 'DONE', 'CANCELADO'),
        allowNull: false,
        defaultValue: 'BACKLOG'
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // Timestamps para cada estado del flujo Kanban
      backlog_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      todo_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      in_progress_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      to_verify_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      done_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      verified_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'AssemblyInstance',
      tableName: 'AssemblyInstances'
    }
  );

  return AssemblyInstance;
};