// backend/controllers/userController.ts

import { Request, Response } from 'express';
const db = require('../models');

/**
 * GET /api/users - Obtener todos los usuarios
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await db.User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email'],
            order: [['firstName', 'ASC'], ['lastName', 'ASC']]
        });

        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};