import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import * as auth from './auth';
const db = require('../models');
import { authenticateToken } from '../middleware/authMiddleware';
import * as itemController from '../controllers/itemController';
import * as stockController from '../controllers/stockController';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas publicas (autenticacion)
app.post('/auth/register', auth.register);
app.post('/auth/login', auth.login);

// Router para rutas protegidas
const apiRouter = express.Router();
apiRouter.use(authenticateToken);

// --- Rutas de Items ---
// Obtener todos los items (con filtros opcionales)
apiRouter.get('/items', itemController.getAllItems);

// Obtener solo elementos base (para usar en BOM)
apiRouter.get('/items/elements', itemController.getElements);

// Obtener plantillas (Kits y Productos)
apiRouter.get('/items/templates', itemController.getTemplates);

// Crear nuevo item
apiRouter.post('/items', itemController.createItem);

// Obtener item por ID
apiRouter.get('/items/:id', itemController.getItemById);

// Actualizar item
apiRouter.put('/items/:id', itemController.updateItem);

// Eliminar item (soft delete)
apiRouter.delete('/items/:id', itemController.deleteItem);

// Obtener BOM de una plantilla
apiRouter.get('/items/:id/bom', itemController.getBom);

// --- Rutas de Stock ---
// IMPORTANTE: Las rutas mas especificas deben ir ANTES que las genericas
// Obtener stock por sitio (ANTES de /stock/:algo)
apiRouter.get('/stock/by-site/:siteId', stockController.getStockBySite);

// Ajustar stock manualmente (ANTES de /stock/:algo)
apiRouter.post('/stock/adjust', stockController.adjustStock);

// Obtener todo el stock (ruta generica)
apiRouter.get('/stock', stockController.getAllStock);

// --- Rutas de Ensamblado ---
// Crear nueva instancia de ensamblado (reservar stock)
apiRouter.post('/stock/assembly', stockController.createAssembly);

// Obtener todas las instancias de ensamblado
apiRouter.get('/stock/assemblies', stockController.getAssemblies);

// Obtener una instancia especifica
apiRouter.get('/stock/assemblies/:id', stockController.getAssemblyById);

// Completar un ensamblado
apiRouter.post('/stock/assemblies/:id/complete', stockController.completeAssembly);

// Cancelar un ensamblado
apiRouter.post('/stock/assemblies/:id/cancel', stockController.cancelAssembly);

// Montar el router de la API
app.use('/api', apiRouter);

// Ruta raiz
app.get('/', (req: Request, res: Response) => {
  res.send('Servidor OemStock funcionando!');
});

// Sincronizar la base de datos y arrancar el servidor
db.sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log('Modelos de base de datos sincronizados correctamente.');
  });
}).catch((error: any) => {
  console.error('No se pudo conectar o sincronizar la base de datos:', error);
  process.exit(1);
});