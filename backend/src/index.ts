
import express, { Request, Response } from 'express';
import * as auth from './auth';
const db = require('../models');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor OEMSPOT funcionando!');
});

// --- Rutas para gestion de Items y Stock ---

// GET /api/items/templates - Obtener todas las plantillas (Kits y Productos)
app.get('/api/items/templates', async (req: Request, res: Response) => {
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
});

// GET /api/items/:id/bom - Obtener el Bill of Materials de una plantilla
app.get('/api/items/:id/bom', async (req: Request, res: Response) => {
  try {
    const parentId = req.params.id;
    const bom = await db.ItemBom.findAll({
      where: { parent_item_id: parentId },
      // Incluir los datos completos del item hijo
      include: [{
        model: db.Item,
        as: 'Child',
        include: ['uom']
      }]
    });

    if (!bom) {
      return res.status(404).json({ message: 'No se encontró la lista de materiales para el item' });
    }

    res.json(bom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la lista de materiales' });
  }
});

// POST /api/stock/assembly - Iniciar un ensamblado (Reservar stock)
app.post('/api/stock/assembly', async (req: Request, res: Response) => {
  const { templateId, quantity, siteId } = req.body;

  if (!templateId || !quantity || !siteId) {
    return res.status(400).json({ message: 'templateId, quantity, y siteId son requeridos' });
  }

  const transaction = await db.sequelize.transaction();

  try {
    // 1. Obtener la lista de materiales (BOM)
    const bomItems = await db.ItemBom.findAll({ where: { parent_item_id: templateId } });

    if (bomItems.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'La plantilla no tiene materiales asociados.' });
    }

    // 2. Verificar disponibilidad de todos los componentes
    for (const bomItem of bomItems) {
      const requiredQuantity = bomItem.quantity * quantity;
      const childStock = await db.Stock.findOne({ 
        where: { itemId: bomItem.child_item_id, siteId: siteId }
      });

      const availableStock = (childStock?.on_hand || 0) - (childStock?.reserved || 0);

      if (!childStock || availableStock < requiredQuantity) {
        await transaction.rollback();
        const childItem = await db.Item.findByPk(bomItem.child_item_id);
        return res.status(400).json({ message: `Stock insuficiente para el componente: ${childItem.name}` });
      }
    }

    // 3. Si todo está disponible, reservar los componentes
    for (const bomItem of bomItems) {
      const requiredQuantity = bomItem.quantity * quantity;
      const childStock = await db.Stock.findOne({ 
        where: { itemId: bomItem.child_item_id, siteId: siteId },
        transaction
      });

      // Sequelize findOne/create returns an array [instance, created]
      const [stockItem, created] = await db.Stock.findOrCreate({
        where: { itemId: bomItem.child_item_id, siteId: siteId },
        defaults: { on_hand: 0, reserved: 0 },
        transaction
      });

      stockItem.reserved += requiredQuantity;
      await stockItem.save({ transaction });
    }

    await transaction.commit();
    res.status(200).json({ message: 'Stock reservado para ensamblado exitosamente' });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en el proceso de ensamblado:', error);
    res.status(500).json({ message: 'Error interno del servidor al procesar el ensamblado' });
  }
});

app.post('/auth/register', auth.register);
app.post('/auth/login', auth.login);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
