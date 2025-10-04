"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth = __importStar(require("./auth"));
const db = require('../models');
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Servidor OEMSPOT funcionando!');
});
// --- Rutas para gestion de Items y Stock ---
// GET /api/items/templates - Obtener todas las plantillas (Kits y Productos)
app.get('/api/items/templates', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const templates = yield db.Item.findAll({
            where: {
                type: ['KIT', 'PRODUCT']
            },
            include: ['uom'] // Incluir unidad de medida
        });
        res.json(templates);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las plantillas' });
    }
}));
// GET /api/items/:id/bom - Obtener el Bill of Materials de una plantilla
app.get('/api/items/:id/bom', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parentId = req.params.id;
        const bom = yield db.ItemBom.findAll({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la lista de materiales' });
    }
}));
app.post('/auth/register', auth.register);
app.post('/auth/login', auth.login);
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
