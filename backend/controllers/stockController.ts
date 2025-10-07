import { Request, Response } from 'express';
const db = require('../models');

/**
 * POST /api/stock/assembly - Iniciar un ensamblado (Reservar stock)
 */
export const createAssembly = async (req: Request, res: Response) => {
    const { templateId, quantity, siteId } = req.body;

    if (typeof templateId !== 'number' || typeof quantity !== 'number' || typeof siteId !== 'number') {
        return res.status(400).json({ message: 'Los campos templateId, quantity, y siteId son requeridos y deben ser números.' });
    }
    if (quantity <= 0) {
        return res.status(400).json({ message: 'La cantidad (quantity) debe ser mayor que cero.' });
    }

    const transaction = await db.sequelize.transaction();
    try {
        const bomItems = await db.ItemBom.findAll({ where: { parent_item_id: templateId } });
        if (bomItems.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'La plantilla no tiene materiales asociados.' });
        }

        for (const bomItem of bomItems) {
            const requiredQuantity = bomItem.quantity * quantity;
            const childStock = await db.Stock.findOne({
                where: { itemId: bomItem.child_item_id, siteId: siteId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            const availableStock = (childStock?.on_hand || 0) - (childStock?.reserved || 0);
            if (!childStock || availableStock < requiredQuantity) {
                await transaction.rollback();
                const childItem = await db.Item.findByPk(bomItem.child_item_id);
                return res.status(409).json({ message: `Stock insuficiente para el componente: ${childItem?.name}` });
            }

            childStock.reserved += requiredQuantity;
            await childStock.save({ transaction });
        }

        await transaction.commit();
        res.status(200).json({ message: 'Stock reservado para ensamblado exitosamente' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error en el proceso de ensamblado:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el ensamblado' });
    }
};