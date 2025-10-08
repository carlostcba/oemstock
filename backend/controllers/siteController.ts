// backend/controllers/siteController.ts

import { Request, Response } from 'express';
const db = require('../models');

/**
 * GET /api/sites - Obtener todos los sitios
 */
export const getAllSites = async (req: Request, res: Response) => {
    try {
        const sites = await db.Site.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });

        res.json(sites);
    } catch (error) {
        console.error('Error al obtener sitios:', error);
        res.status(500).json({ message: 'Error al obtener sitios' });
    }
};