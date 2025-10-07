import { Request, Response } from 'express';
const db = require('../models');

/**
 * GET /api/items/templates - Obtener todas las plantillas (Kits y Productos)
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await db.Item.findAll({
      where: {
        type: ['KIT', 'PRODUCT']
      },
      include: [{ model: db.Uom, as: 'uom' }]
    });
    res.json(templates);
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    res.status(500).json({ message: 'Error al obtener las plantillas' });
  }
};

/**
 * GET /api/items - Obtener todos los items
 */
export const getAllItems = async (req: Request, res: Response) => {
  try {
    const { type, active } = req.query;
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    const items = await db.Item.findAll({
      where,
      include: [{ model: db.Uom, as: 'uom' }],
      order: [['createdAt', 'DESC']]
    });

    res.json(items);
  } catch (error) {
    console.error('Error al obtener items:', error);
    res.status(500).json({ message: 'Error al obtener los items' });
  }
};

/**
 * GET /api/items/:id - Obtener un item especifico
 */
export const getItemById = async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({ message: 'ID invalido' });
    }

    const item = await db.Item.findByPk(itemId, {
      include: [{ model: db.Uom, as: 'uom' }]
    });

    if (!item) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error al obtener item:', error);
    res.status(500).json({ message: 'Error al obtener el item' });
  }
};

/**
 * POST /api/items - Crear un nuevo item
 */
export const createItem = async (req: Request, res: Response) => {
  const { sku, name, type, uom_id, active, notes, bom } = req.body;

  // Validaciones
  if (!sku || !name || !type || !uom_id) {
    return res.status(400).json({ 
      message: 'Los campos sku, name, type y uom_id son requeridos' 
    });
  }

  if (!['ELEMENT', 'KIT', 'PRODUCT'].includes(type)) {
    return res.status(400).json({ 
      message: 'El tipo debe ser ELEMENT, KIT o PRODUCT' 
    });
  }

  const transaction = await db.sequelize.transaction();

  try {
    // Verificar que el SKU no exista
    const existingItem = await db.Item.findOne({ 
      where: { sku },
      transaction 
    });

    if (existingItem) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El SKU ya existe' });
    }

    // Crear el item
    const item = await db.Item.create({
      sku,
      name,
      type,
      uom_id,
      active: active !== undefined ? active : true,
      notes: notes || null
    }, { transaction });

    // Si es KIT o PRODUCT y tiene BOM, crear las relaciones
    if ((type === 'KIT' || type === 'PRODUCT') && bom && Array.isArray(bom)) {
      for (const bomItem of bom) {
        if (!bomItem.child_item_id || !bomItem.quantity) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'Cada componente del BOM debe tener child_item_id y quantity' 
          });
        }

        // Verificar que el child_item existe
        const childItem = await db.Item.findByPk(bomItem.child_item_id, { transaction });
        if (!childItem) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: `Item con ID ${bomItem.child_item_id} no encontrado` 
          });
        }

        // Crear la relacion BOM
        await db.ItemBom.create({
          parent_item_id: item.id,
          child_item_id: bomItem.child_item_id,
          quantity: bomItem.quantity
        }, { transaction });
      }
    }

    await transaction.commit();

    // Recargar el item con sus relaciones
    const itemWithRelations = await db.Item.findByPk(item.id, {
      include: [{ model: db.Uom, as: 'uom' }]
    });

    res.status(201).json({ 
      message: 'Item creado exitosamente',
      item: itemWithRelations 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear item:', error);
    res.status(500).json({ message: 'Error al crear el item' });
  }
};

/**
 * PUT /api/items/:id - Actualizar un item
 */
export const updateItem = async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id, 10);
  const { sku, name, type, uom_id, active, notes, bom } = req.body;

  if (isNaN(itemId)) {
    return res.status(400).json({ message: 'ID invalido' });
  }

  const transaction = await db.sequelize.transaction();

  try {
    const item = await db.Item.findByPk(itemId, { transaction });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    // Si se esta cambiando el SKU, verificar que no exista
    if (sku && sku !== item.sku) {
      const existingItem = await db.Item.findOne({ 
        where: { sku },
        transaction 
      });

      if (existingItem) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El SKU ya existe' });
      }
    }

    // Actualizar el item
    await item.update({
      sku: sku || item.sku,
      name: name || item.name,
      type: type || item.type,
      uom_id: uom_id || item.uom_id,
      active: active !== undefined ? active : item.active,
      notes: notes !== undefined ? notes : item.notes
    }, { transaction });

    // Si hay BOM y es KIT o PRODUCT, actualizar el BOM
    if ((item.type === 'KIT' || item.type === 'PRODUCT') && bom && Array.isArray(bom)) {
      // Eliminar el BOM existente
      await db.ItemBom.destroy({
        where: { parent_item_id: itemId },
        transaction
      });

      // Crear el nuevo BOM
      for (const bomItem of bom) {
        if (!bomItem.child_item_id || !bomItem.quantity) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'Cada componente del BOM debe tener child_item_id y quantity' 
          });
        }

        const childItem = await db.Item.findByPk(bomItem.child_item_id, { transaction });
        if (!childItem) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: `Item con ID ${bomItem.child_item_id} no encontrado` 
          });
        }

        await db.ItemBom.create({
          parent_item_id: itemId,
          child_item_id: bomItem.child_item_id,
          quantity: bomItem.quantity
        }, { transaction });
      }
    }

    await transaction.commit();

    const itemWithRelations = await db.Item.findByPk(itemId, {
      include: [{ model: db.Uom, as: 'uom' }]
    });

    res.json({ 
      message: 'Item actualizado exitosamente',
      item: itemWithRelations 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar item:', error);
    res.status(500).json({ message: 'Error al actualizar el item' });
  }
};

/**
 * DELETE /api/items/:id - Eliminar un item (soft delete)
 */
export const deleteItem = async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id, 10);

  if (isNaN(itemId)) {
    return res.status(400).json({ message: 'ID invalido' });
  }

  try {
    const item = await db.Item.findByPk(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    // Soft delete: marcar como inactivo
    await item.update({ active: false });

    res.json({ message: 'Item desactivado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    res.status(500).json({ message: 'Error al eliminar el item' });
  }
};

/**
 * GET /api/items/:id/bom - Obtener el Bill of Materials de una plantilla
 */
export const getBom = async (req: Request, res: Response) => {
  try {
    const parentId = parseInt(req.params.id, 10);
    
    if (isNaN(parentId)) {
      return res.status(400).json({ message: 'El ID del item debe ser un numero.' });
    }

    const parentItem = await db.Item.findByPk(parentId);
    if (!parentItem) {
      return res.status(404).json({ message: 'No se encontro el item de la plantilla.' });
    }

    const bom = await db.ItemBom.findAll({
      where: { parent_item_id: parentId },
      include: [{
        model: db.Item,
        as: 'Child',
        attributes: ['id', 'sku', 'name', 'type'],
        include: [{ 
          model: db.Uom, 
          as: 'uom', 
          attributes: ['id', 'name', 'symbol'] 
        }]
      }]
    });

    if (bom.length === 0) {
      return res.status(404).json({ message: 'No se encontro la lista de materiales para el item' });
    }

    res.json(bom);
  } catch (error) {
    console.error('Error al obtener BOM:', error);
    res.status(500).json({ message: 'Error al obtener la lista de materiales' });
  }
};

/**
 * GET /api/items/elements - Obtener solo elementos base (para seleccionar en BOM)
 */
export const getElements = async (req: Request, res: Response) => {
  try {
    const elements = await db.Item.findAll({
      where: {
        type: 'ELEMENT',
        active: true
      },
      include: [{ model: db.Uom, as: 'uom' }],
      order: [['name', 'ASC']]
    });

    res.json(elements);
  } catch (error) {
    console.error('Error al obtener elementos:', error);
    res.status(500).json({ message: 'Error al obtener los elementos' });
  }
};