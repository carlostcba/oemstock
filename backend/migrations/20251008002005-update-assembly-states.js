'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar nuevas columnas para timestamps de cada estado
    await queryInterface.addColumn('AssemblyInstances', 'backlog_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('AssemblyInstances', 'todo_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('AssemblyInstances', 'in_progress_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('AssemblyInstances', 'to_verify_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('AssemblyInstances', 'done_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('AssemblyInstances', 'verified_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Actualizar los estados existentes a los nuevos
    await queryInterface.sequelize.query(`
      UPDATE AssemblyInstances 
      SET status = 'BACKLOG', backlog_at = createdAt 
      WHERE status = 'RESERVADO'
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE AssemblyInstances 
      SET status = 'DONE', done_at = completed_at 
      WHERE status = 'ENSAMBLADO'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('AssemblyInstances', 'backlog_at');
    await queryInterface.removeColumn('AssemblyInstances', 'todo_at');
    await queryInterface.removeColumn('AssemblyInstances', 'in_progress_at');
    await queryInterface.removeColumn('AssemblyInstances', 'to_verify_at');
    await queryInterface.removeColumn('AssemblyInstances', 'done_at');
    await queryInterface.removeColumn('AssemblyInstances', 'verified_by');
  }
};