import dotenv from 'dotenv';
dotenv.config(); // Carga las variables de entorno desde el archivo .env

import express, { Request, Response } from 'express';
import * as auth from './auth';
const db = require('../models');
import { authenticateToken } from '../middleware/authMiddleware';
import * as itemController from '../controllers/itemController';
import * as stockController from '../controllers/stockController';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Rutas públicas (autenticación)
app.post('/auth/register', auth.register);
app.post('/auth/login', auth.login);

// Crear un router para las rutas protegidas de la API
const apiRouter = express.Router();
apiRouter.use(authenticateToken); // Aplicar middleware de autenticación a todas las rutas de /api

// --- Rutas para gestion de Items y Stock ---

// GET /api/items/templates - Obtener todas las plantillas (Kits y Productos)
apiRouter.get('/items/templates', itemController.getTemplates);

// GET /api/items/:id/bom - Obtener el Bill of Materials de una plantilla
apiRouter.get('/items/:id/bom', itemController.getBom);

// POST /api/stock/assembly - Iniciar un ensamblado (Reservar stock)
apiRouter.post('/stock/assembly', stockController.createAssembly);

// Montar el router de la API en el prefijo /api
app.use('/api', apiRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor OEMSPOT funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
