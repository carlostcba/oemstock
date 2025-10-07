import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Comprobar si ya existe un token al cargar la app
    return !!localStorage.getItem('authToken');
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Si el estado de autenticación cambia, actualizamos el token en la API
    const token = localStorage.getItem('authToken');
    api.setAuthToken(token);
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        setIsAuthenticated(true);
        navigate('/dashboard'); // Redirigir al dashboard tras un login exitoso
      } else {
        throw new Error('No se recibió token en la respuesta.');
      }
    } catch (error) {
      // El error ya viene formateado desde api.ts, solo lo relanzamos
      console.error('Error en el login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    navigate('/login'); // Redirigir a la página de login
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación.
 * Asegura que se use dentro de un AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};