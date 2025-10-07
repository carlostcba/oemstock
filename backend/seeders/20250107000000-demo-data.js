'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // 1. Crear Sitios
    await queryInterface.bulkInsert('Sites', [
      { id: 1, name: 'Alberti', createdAt: now, updatedAt: now },
      { id: 2, name: 'Delviso', createdAt: now, updatedAt: now },
      { id: 3, name: 'Casa Matriz', createdAt: now, updatedAt: now }
    ], {});

    // 2. Crear Unidades de Medida
    await queryInterface.bulkInsert('uoms', [
      { id: 1, name: 'Unidad', symbol: 'un', createdAt: now, updatedAt: now },
      { id: 2, name: 'Kilogramo', symbol: 'kg', createdAt: now, updatedAt: now },
      { id: 3, name: 'Metro', symbol: 'm', createdAt: now, updatedAt: now }
    ], {});

    // 3. Crear Items (Elementos Base, Kits y Productos)
    await queryInterface.bulkInsert('items', [
      { id: 1, sku: 'EL-001', name: 'Tornillo M6', type: 'ELEMENT', uom_id: 1, active: true, createdAt: now, updatedAt: now },
      { id: 2, sku: 'EL-002', name: 'Tuerca M6', type: 'ELEMENT', uom_id: 1, active: true, createdAt: now, updatedAt: now },
      { id: 3, sku: 'EL-003', name: 'Arandela', type: 'ELEMENT', uom_id: 1, active: true, createdAt: now, updatedAt: now },
      { id: 4, sku: 'EL-004', name: 'Placa Base', type: 'ELEMENT', uom_id: 1, active: true, createdAt: now, updatedAt: now },
      { id: 5, sku: 'KIT-001', name: 'Kit Fijacion Basico', type: 'KIT', uom_id: 1, active: true, createdAt: now, updatedAt: now },
      { id: 6, sku: 'PROD-001', name: 'Producto Final A', type: 'PRODUCT', uom_id: 1, active: true, createdAt: now, updatedAt: now }
    ], {});

    // 4. Crear BOM para el Kit (Kit necesita tornillos, tuercas y arandelas)
    await queryInterface.bulkInsert('item_boms', [
      { parent_item_id: 5, child_item_id: 1, quantity: 4, createdAt: now, updatedAt: now },
      { parent_item_id: 5, child_item_id: 2, quantity: 4, createdAt: now, updatedAt: now },
      { parent_item_id: 5, child_item_id: 3, quantity: 8, createdAt: now, updatedAt: now }
    ], {});

    // 5. Crear BOM para el Producto (Producto necesita placa y kits)
    await queryInterface.bulkInsert('item_boms', [
      { parent_item_id: 6, child_item_id: 4, quantity: 1, createdAt: now, updatedAt: now },
      { parent_item_id: 6, child_item_id: 5, quantity: 2, createdAt: now, updatedAt: now }
    ], {});

    // 6. Crear Stock Inicial en diferentes sitios
    await queryInterface.bulkInsert('Stocks', [
      // Sitio Alberti
      { itemId: 1, siteId: 1, on_hand: 100, reserved: 0, createdAt: now, updatedAt: now },
      { itemId: 2, siteId: 1, on_hand: 100, reserved: 0, createdAt: now, updatedAt: now },
      { itemId: 3, siteId: 1, on_hand: 200, reserved: 0, createdAt: now, updatedAt: now },
      { itemId: 4, siteId: 1, on_hand: 50, reserved: 0, createdAt: now, updatedAt: now },
      
      // Sitio Delviso
      { itemId: 1, siteId: 2, on_hand: 150, reserved: 0, createdAt: now, updatedAt: now },
      { itemId: 2, siteId: 2, on_hand: 150, reserved: 0, createdAt: now, updatedAt: now },
      { itemId: 3, siteId: 2, on_hand: 300, reserved: 0, createdAt: now, updatedAt: now },
      { itemId: 4, siteId: 2, on_hand: 75, reserved: 0, createdAt: now, updatedAt: now }
    ], {});

    // 7. Crear Roles
    await queryInterface.bulkInsert('Roles', [
      { id: 1, name: 'Operario', createdAt: now, updatedAt: now },
      { id: 2, name: 'Supervisor', createdAt: now, updatedAt: now },
      { id: 3, name: 'Administrador', createdAt: now, updatedAt: now }
    ], {});

    // 8. Crear Usuarios
    await queryInterface.bulkInsert('Users', [
      { id: 1, firstName: 'Juan', lastName: 'Perez', email: 'operario@test.com', password: hashedPassword, createdAt: now, updatedAt: now },
      { id: 2, firstName: 'Maria', lastName: 'Gonzalez', email: 'supervisor@test.com', password: hashedPassword, createdAt: now, updatedAt: now },
      { id: 3, firstName: 'Carlos', lastName: 'Rodriguez', email: 'admin@test.com', password: hashedPassword, createdAt: now, updatedAt: now }
    ], {});

    // 9. Asignar Roles a Usuarios en diferentes sitios
    await queryInterface.bulkInsert('UserRoles', [
      { userId: 1, roleId: 1, siteId: 1, createdAt: now, updatedAt: now },
      { userId: 2, roleId: 2, siteId: 1, createdAt: now, updatedAt: now },
      { userId: 2, roleId: 2, siteId: 2, createdAt: now, updatedAt: now },
      { userId: 3, roleId: 3, siteId: 1, createdAt: now, updatedAt: now },
      { userId: 3, roleId: 3, siteId: 2, createdAt: now, updatedAt: now }
    ], {});

    console.log('✅ Datos de prueba insertados correctamente');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserRoles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
    await queryInterface.bulkDelete('Stocks', null, {});
    await queryInterface.bulkDelete('item_boms', null, {});
    await queryInterface.bulkDelete('items', null, {});
    await queryInterface.bulkDelete('uoms', null, {});
    await queryInterface.bulkDelete('Sites', null, {});
  }
};