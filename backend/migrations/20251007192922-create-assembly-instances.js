// backend/migrations/XXXXXXXXXXXXXX-update-assembly-instances.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Agregar la columna assigned_to
      await queryInterface.addColumn('AssemblyInstances', 'assigned_to', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // 2. Agregar la columna verified_by
      await queryInterface.addColumn('AssemblyInstances', 'verified_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // 3. Agregar columnas de timestamps del flujo Kanban
      await queryInterface.addColumn('AssemblyInstances', 'backlog_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('AssemblyInstances', 'todo_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('AssemblyInstances', 'in_progress_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('AssemblyInstances', 'to_verify_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('AssemblyInstances', 'done_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      // 4. Para SQLite, no podemos modificar el ENUM directamente
      // Necesitamos recrear la tabla
      
      // Crear tabla temporal con la nueva estructura
      await queryInterface.sequelize.query(`
        CREATE TABLE AssemblyInstances_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id INTEGER NOT NULL,
          site_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          status TEXT CHECK(status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'TO_VERIFY', 'DONE', 'CANCELADO')) NOT NULL DEFAULT 'BACKLOG',
          created_by INTEGER NOT NULL,
          assigned_to INTEGER,
          backlog_at DATETIME,
          todo_at DATETIME,
          in_progress_at DATETIME,
          to_verify_at DATETIME,
          done_at DATETIME,
          completed_at DATETIME,
          completed_by INTEGER,
          verified_by INTEGER,
          notes TEXT,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (template_id) REFERENCES Items(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (site_id) REFERENCES Sites(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (assigned_to) REFERENCES Users(id) ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (completed_by) REFERENCES Users(id) ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY (verified_by) REFERENCES Users(id) ON DELETE SET NULL ON UPDATE CASCADE
        )
      `, { transaction });

      // Copiar datos existentes, mapeando los estados antiguos a los nuevos
      await queryInterface.sequelize.query(`
        INSERT INTO AssemblyInstances_new (
          id, template_id, site_id, quantity, status, created_by, 
          completed_at, completed_by, notes, createdAt, updatedAt,
          assigned_to, backlog_at, todo_at, in_progress_at, to_verify_at, done_at, verified_by
        )
        SELECT 
          id, template_id, site_id, quantity,
          CASE 
            WHEN status = 'RESERVADO' THEN 'BACKLOG'
            WHEN status = 'ENSAMBLADO' THEN 'DONE'
            WHEN status = 'CANCELADO' THEN 'CANCELADO'
            ELSE 'BACKLOG'
          END as status,
          created_by, completed_at, completed_by, notes, createdAt, updatedAt,
          NULL as assigned_to,
          createdAt as backlog_at,
          NULL as todo_at,
          NULL as in_progress_at,
          completed_at as to_verify_at,
          CASE WHEN status = 'ENSAMBLADO' THEN completed_at ELSE NULL END as done_at,
          CASE WHEN status = 'ENSAMBLADO' THEN completed_by ELSE NULL END as verified_by
        FROM AssemblyInstances
      `, { transaction });

      // Eliminar tabla antigua
      await queryInterface.dropTable('AssemblyInstances', { transaction });

      // Renombrar tabla nueva
      await queryInterface.renameTable('AssemblyInstances_new', 'AssemblyInstances', { transaction });

      // Recrear índices
      await queryInterface.addIndex('AssemblyInstances', ['status'], {
        name: 'assembly_instances_status',
        transaction
      });

      await queryInterface.addIndex('AssemblyInstances', ['site_id'], {
        name: 'assembly_instances_site_id',
        transaction
      });

      await queryInterface.addIndex('AssemblyInstances', ['template_id'], {
        name: 'assembly_instances_template_id',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Recrear tabla con estructura antigua
      await queryInterface.sequelize.query(`
        CREATE TABLE AssemblyInstances_old (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id INTEGER NOT NULL,
          site_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          status TEXT CHECK(status IN ('RESERVADO', 'ENSAMBLADO', 'CANCELADO')) NOT NULL DEFAULT 'RESERVADO',
          created_by INTEGER NOT NULL,
          completed_at DATETIME,
          completed_by INTEGER,
          notes TEXT,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (template_id) REFERENCES Items(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (site_id) REFERENCES Sites(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (completed_by) REFERENCES Users(id) ON DELETE SET NULL ON UPDATE CASCADE
        )
      `, { transaction });

      // Copiar datos, mapeando los nuevos estados a los antiguos
      await queryInterface.sequelize.query(`
        INSERT INTO AssemblyInstances_old (
          id, template_id, site_id, quantity, status, created_by, 
          completed_at, completed_by, notes, createdAt, updatedAt
        )
        SELECT 
          id, template_id, site_id, quantity,
          CASE 
            WHEN status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'TO_VERIFY') THEN 'RESERVADO'
            WHEN status = 'DONE' THEN 'ENSAMBLADO'
            WHEN status = 'CANCELADO' THEN 'CANCELADO'
            ELSE 'RESERVADO'
          END as status,
          created_by, completed_at, completed_by, notes, createdAt, updatedAt
        FROM AssemblyInstances
      `, { transaction });

      await queryInterface.dropTable('AssemblyInstances', { transaction });
      await queryInterface.renameTable('AssemblyInstances_old', 'AssemblyInstances', { transaction });

      // Recrear índices
      await queryInterface.addIndex('AssemblyInstances', ['status'], {
        name: 'assembly_instances_status',
        transaction
      });

      await queryInterface.addIndex('AssemblyInstances', ['site_id'], {
        name: 'assembly_instances_site_id',
        transaction
      });

      await queryInterface.addIndex('AssemblyInstances', ['template_id'], {
        name: 'assembly_instances_template_id',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};