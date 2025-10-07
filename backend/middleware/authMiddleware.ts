import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto';

// Extender la interfaz Request de Express para incluir la propiedad 'user'
declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' }); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Si el token expiró, err.name será 'TokenExpiredError'
      return res.status(403).json({ message: 'Token inválido o expirado.' }); // Forbidden
    }

    // Adjuntar el payload del usuario decodificado a la solicitud para uso posterior
    req.user = user;

    next();
  });
};

export {};