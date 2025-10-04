
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, password: string) => {
    // Simulación de llamada a la API
    console.log("Intentando iniciar sesión con:", { email, password });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Lógica de login simulada: cualquier usuario/contraseña funciona por ahora
    if (email && password) {
      console.log("Login exitoso");
      setIsAuthenticated(true);
    } else {
      console.log("Login fallido");
      throw new Error("Usuario o contraseña incorrectos");
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
