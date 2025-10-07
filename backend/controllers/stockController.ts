import { Request, Response } from 'express';
const db = require('../models');

/**
 * POST /api/stock/assembly - Crear una instancia de ensamblado y reservar stock
 */
export const createAssembly = async (req: Request, res: Response) => {
    const { templateId, quantity, siteId, notes } = req.body;
    const userId = (req as any).user?.id; // Obtenido del middleware de autenticacion

    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (typeof templateId !== 'number' || typeof quantity !== 'number' || typeof siteId !== 'number') {
        return res.status(400).json({ 
            message: 'Los campos templateId, quantity, y siteId son requeridos y deben ser numeros.' 
        });
    }

    if (quantity <= 0) {
        return res.status(400).json({ message: 'La cantidad (quantity) debe ser mayor que cero.' });
    }

    const transaction = await db.sequelize.transaction();
    
    try {
        // Verificar que el template existe y es de tipo KIT o PRODUCT
        const template = await db.Item.findByPk(templateId);
        if (!template) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Plantilla no encontrada.' });
        }

        if (template.type !== 'KIT' && template.type !== 'PRODUCT') {
            await transaction.rollback();
            return res.status(400).json({ 
                message: 'Solo se pueden ensamblar plantillas de tipo KIT o PRODUCT.' 
            });
        }

        // Obtener la lista de materiales (BOM)
        const bomItems = await db.ItemBom.findAll({ 
            where: { parent_item_id: templateId },
            transaction 
        });

        if (bomItems.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'La plantilla no tiene materiales asociados.' });
        }

        // Verificar disponibilidad y reservar stock
        const insufficientComponents = [];
        
        for (const bomItem of bomItems) {
            const requiredQuantity = bomItem.quantity * quantity;
            
            const childStock = await db.Stock.findOne({
                where: { itemId: bomItem.child_item_id, siteId: siteId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            const availableStock = (childStock?.on_hand || 0) - (childStock?.reserved || 0);
            
            if (!childStock || availableStock < requiredQuantity) {
                const childItem = await db.Item.findByPk(bomItem.child_item_id);
                insufficientComponents.push({
                    name: childItem?.name || 'Desconocido',
                    required: requiredQuantity,
                    available: availableStock
                });
            }
        }

        // Si hay componentes insuficientes, retornar error detallado
        if (insufficientComponents.length > 0) {
            await transaction.rollback();
            return res.status(409).json({ 
                message: 'Stock insuficiente para algunos componentes',
                insufficientComponents 
            });
        }

        // Reservar el stock
        for (const bomItem of bomItems) {
            const requiredQuantity = bomItem.quantity * quantity;
            
            const childStock = await db.Stock.findOne({
                where: { itemId: bomItem.child_item_id, siteId: siteId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            childStock.reserved += requiredQuantity;
            await childStock.save({ transaction });
        }

        // Crear la instancia de ensamblado
        const assemblyInstance = await db.AssemblyInstance.create({
            template_id: templateId,
            site_id: siteId,
            quantity: quantity,
            status: 'RESERVADO',
            created_by: userId,
            notes: notes || null
        }, { transaction });

        await transaction.commit();
        
        res.status(201).json({ 
            message: 'Instancia de ensamblado creada exitosamente',
            assemblyInstance 
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error en el proceso de ensamblado:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el ensamblado' });
    }
};

/**
 * GET /api/stock/assemblies - Obtener todas las instancias de ensamblado
 */
export const getAssemblies = async (req: Request, res: Response) => {
    try {
        const { status, siteId } = req.query;
        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (siteId) {
            where.site_id = parseInt(siteId as string, 10);
        }

        const assemblies = await db.AssemblyInstance.findAll({
            where,
            include: [
                {
                    model: db.Item,
                    as: 'Template',
                    attributes: ['id', 'sku', 'name', 'type']
                },
                {
                    model: db.Site,
                    as: 'Site',
                    attributes: ['id', 'name']
                },
                {
                    model: db.User,
                    as: 'Creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: db.User,
                    as: 'Completer',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(assemblies);
    } catch (error) {
        console.error('Error al obtener instancias de ensamblado:', error);
        res.status(500).json({ message: 'Error al obtener las instancias de ensamblado' });
    }
};

/**
 * GET /api/stock/assemblies/:id - Obtener una instancia especifica
 */
export const getAssemblyById = async (req: Request, res: Response) => {
    try {
        const assemblyId = parseInt(req.params.id, 10);

        if (isNaN(assemblyId)) {
            return res.status(400).json({ message: 'ID invalido' });
        }

        const assembly = await db.AssemblyInstance.findByPk(assemblyId, {
            include: [
                {
                    model: db.Item,
                    as: 'Template',
                    attributes: ['id', 'sku', 'name', 'type']
                },
                {
                    model: db.Site,
                    as: 'Site',
                    attributes: ['id', 'name']
                },
                {
                    model: db.User,
                    as: 'Creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: db.User,
                    as: 'Completer',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });

        if (!assembly) {
            return res.status(404).json({ message: 'Instancia de ensamblado no encontrada' });
        }

        res.json(assembly);
    } catch (error) {
        console.error('Error al obtener la instancia:', error);
        res.status(500).json({ message: 'Error al obtener la instancia de ensamblado' });
    }
};

/**
 * POST /api/stock/assemblies/:id/complete - Completar un ensamblado
 * Consume los componentes del stock y agrega el item ensamblado al stock
 */
export const completeAssembly = async (req: Request, res: Response) => {
    const assemblyId = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (isNaN(assemblyId)) {
        return res.status(400).json({ message: 'ID invalido' });
    }

    const transaction = await db.sequelize.transaction();

    try {
        // Obtener la instancia de ensamblado
        const assembly = await db.AssemblyInstance.findByPk(assemblyId, { transaction });

        if (!assembly) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Instancia de ensamblado no encontrada' });
        }

        if (assembly.status !== 'RESERVADO') {
            await transaction.rollback();
            return res.status(400).json({ 
                message: `No se puede completar un ensamblado en estado ${assembly.status}` 
            });
        }

        // Obtener el BOM del template
        const bomItems = await db.ItemBom.findAll({
            where: { parent_item_id: assembly.template_id },
            transaction
        });

        // Consumir los componentes del stock
        for (const bomItem of bomItems) {
            const requiredQuantity = bomItem.quantity * assembly.quantity;

            const childStock = await db.Stock.findOne({
                where: { 
                    itemId: bomItem.child_item_id, 
                    siteId: assembly.site_id 
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!childStock) {
                await transaction.rollback();
                return res.status(500).json({ 
                    message: 'Error: Stock no encontrado para un componente' 
                });
            }

            // Consumir: reducir on_hand y liberar reserva
            childStock.on_hand -= requiredQuantity;
            childStock.reserved -= requiredQuantity;

            // Validacion de seguridad
            if (childStock.on_hand < 0 || childStock.reserved < 0) {
                await transaction.rollback();
                return res.status(500).json({ 
                    message: 'Error: Estado de stock inconsistente' 
                });
            }

            await childStock.save({ transaction });
        }

        // Agregar el item ensamblado al stock
        let assembledStock = await db.Stock.findOne({
            where: { 
                itemId: assembly.template_id, 
                siteId: assembly.site_id 
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (assembledStock) {
            assembledStock.on_hand += assembly.quantity;
            await assembledStock.save({ transaction });
        } else {
            // Si no existe stock para este item en este sitio, crearlo
            await db.Stock.create({
                itemId: assembly.template_id,
                siteId: assembly.site_id,
                on_hand: assembly.quantity,
                reserved: 0
            }, { transaction });
        }

        // Actualizar el estado de la instancia
        assembly.status = 'ENSAMBLADO';
        assembly.completed_at = new Date();
        assembly.completed_by = userId;
        await assembly.save({ transaction });

        await transaction.commit();

        res.json({ 
            message: 'Ensamblado completado exitosamente',
            assembly 
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al completar el ensamblado:', error);
        res.status(500).json({ message: 'Error interno al completar el ensamblado' });
    }
};

/**
 * POST /api/stock/assemblies/:id/cancel - Cancelar un ensamblado
 * Libera el stock reservado
 */
export const cancelAssembly = async (req: Request, res: Response) => {
    const assemblyId = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (isNaN(assemblyId)) {
        return res.status(400).json({ message: 'ID invalido' });
    }

    const transaction = await db.sequelize.transaction();

    try {
        const assembly = await db.AssemblyInstance.findByPk(assemblyId, { transaction });

        if (!assembly) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Instancia de ensamblado no encontrada' });
        }

        if (assembly.status !== 'RESERVADO') {
            await transaction.rollback();
            return res.status(400).json({ 
                message: `No se puede cancelar un ensamblado en estado ${assembly.status}` 
            });
        }

        // Obtener el BOM y liberar las reservas
        const bomItems = await db.ItemBom.findAll({
            where: { parent_item_id: assembly.template_id },
            transaction
        });

        for (const bomItem of bomItems) {
            const requiredQuantity = bomItem.quantity * assembly.quantity;

            const childStock = await db.Stock.findOne({
                where: { 
                    itemId: bomItem.child_item_id, 
                    siteId: assembly.site_id 
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (childStock) {
                childStock.reserved -= requiredQuantity;
                
                if (childStock.reserved < 0) {
                    childStock.reserved = 0;
                }
                
                await childStock.save({ transaction });
            }
        }

        // Actualizar el estado
        assembly.status = 'CANCELADO';
        await assembly.save({ transaction });

        await transaction.commit();

        res.json({ 
            message: 'Ensamblado cancelado exitosamente',
            assembly 
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al cancelar el ensamblado:', error);
        res.status(500).json({ message: 'Error interno al cancelar el ensamblado' });
    }
};

/**
 * GET /api/stock - Obtener todo el stock
 */
export const getAllStock = async (req: Request, res: Response) => {
    try {
        const { siteId, itemId } = req.query;
        const where: any = {};

        if (siteId) {
            where.siteId = parseInt(siteId as string, 10);
        }

        if (itemId) {
            where.itemId = parseInt(itemId as string, 10);
        }

        const stock = await db.Stock.findAll({
            where,
            include: [
                {
                    model: db.Item,
                    as: 'Item',
                    attributes: ['id', 'sku', 'name', 'type'],
                    include: [{ model: db.Uom, as: 'uom' }]
                },
                {
                    model: db.Site,
                    as: 'Site',
                    attributes: ['id', 'name']
                }
            ],
            order: [['itemId', 'ASC'], ['siteId', 'ASC']]
        });

        res.json(stock);
    } catch (error) {
        console.error('Error al obtener stock:', error);
        res.status(500).json({ message: 'Error al obtener el stock' });
    }
};

/**
 * POST /api/stock/adjust - Ajustar stock manualmente (solo admin)
 */
export const adjustStock = async (req: Request, res: Response) => {
    const { itemId, siteId, quantity, adjustment_type, notes } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!itemId || !siteId || quantity === undefined) {
        return res.status(400).json({ 
            message: 'itemId, siteId y quantity son requeridos' 
        });
    }

    if (!['ENTRADA', 'SALIDA', 'AJUSTE'].includes(adjustment_type)) {
        return res.status(400).json({ 
            message: 'adjustment_type debe ser ENTRADA, SALIDA o AJUSTE' 
        });
    }

    const transaction = await db.sequelize.transaction();

    try {
        // Buscar o crear el registro de stock
        let stock = await db.Stock.findOne({
            where: { itemId, siteId },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (stock) {
            // Actualizar stock existente
            if (adjustment_type === 'ENTRADA' || adjustment_type === 'AJUSTE') {
                stock.on_hand += quantity;
            } else if (adjustment_type === 'SALIDA') {
                if (stock.on_hand < quantity) {
                    await transaction.rollback();
                    return res.status(400).json({ 
                        message: 'No hay suficiente stock para realizar la salida' 
                    });
                }
                stock.on_hand -= quantity;
            }
            await stock.save({ transaction });
        } else {
            // Crear nuevo registro de stock
            if (adjustment_type === 'SALIDA') {
                await transaction.rollback();
                return res.status(400).json({ 
                    message: 'No existe stock para realizar una salida' 
                });
            }

            stock = await db.Stock.create({
                itemId,
                siteId,
                on_hand: quantity,
                reserved: 0
            }, { transaction });
        }

        // TODO: Registrar en auditoria el ajuste de stock
        // await db.AuditLog.create({
        //     user_id: userId,
        //     action: 'STOCK_ADJUSTMENT',
        //     resource: 'stock',
        //     details: JSON.stringify({ itemId, siteId, quantity, adjustment_type, notes })
        // }, { transaction });

        await transaction.commit();

        res.json({ 
            message: 'Stock ajustado exitosamente',
            stock 
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al ajustar stock:', error);
        res.status(500).json({ message: 'Error al ajustar el stock' });
    }
};

/**
 * GET /api/stock/by-site/:siteId - Obtener stock de un sitio especifico
 */
export const getStockBySite = async (req: Request, res: Response) => {
    try {
        const siteId = parseInt(req.params.siteId, 10);

        if (isNaN(siteId)) {
            return res.status(400).json({ message: 'ID de sitio invalido' });
        }

        const stock = await db.Stock.findAll({
            where: { siteId },
            include: [
                {
                    model: db.Item,
                    as: 'Item',
                    attributes: ['id', 'sku', 'name', 'type'],
                    include: [{ model: db.Uom, as: 'uom' }]
                }
            ],
            order: [['itemId', 'ASC']]
        });

        res.json(stock);
    } catch (error) {
        console.error('Error al obtener stock del sitio:', error);
        res.status(500).json({ message: 'Error al obtener el stock del sitio' });
    }
};