import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  email: string;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET no esta configurado en las variables de entorno');
    return res.status(500).json({ message: 'Error de configuracion del servidor' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Agregar el usuario al objeto request para usarlo en los controladores
    (req as any).user = {
      id: decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    return res.status(403).json({ message: 'Token invalido o expirado' });
  }
};