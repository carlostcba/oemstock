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
            include: ['uom'] // Incluir unidad de medida
        });
        res.json(templates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las plantillas' });
    }
};

/**
 * GET /api/items/:id/bom - Obtener el Bill of Materials de una plantilla
 */
export const getBom = async (req: Request, res: Response) => {
    try {
        const parentId = parseInt(req.params.id, 10);
        if (isNaN(parentId)) {
            return res.status(400).json({ message: 'El ID del item debe ser un número.' });
        }

        const parentItem = await db.Item.findByPk(parentId);
        if (!parentItem) {
            return res.status(404).json({ message: 'No se encontró el item de la plantilla.' });
        }

        const bom = await db.ItemBom.findAll({
            where: { parent_item_id: parentId },
            include: [{
                model: db.Item,
                as: 'Child',
                attributes: ['id', 'sku', 'name', 'type'],
                include: [{ model: db.Uom, as: 'uom', attributes: ['id', 'name', 'symbol'] }]
            }]
        });

        res.json(bom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la lista de materiales' });
    }
};