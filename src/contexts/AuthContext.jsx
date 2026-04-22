import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    
    if (token && usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
    setCargando(false);
  }, []);

  const login = async (correo, password) => {
    const { data } = await api.post('/auth/login', { correo, password });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const value = {
    usuario,
    cargando,
    login,
    logout,
    isAdmin: usuario?.rol === 'ADMIN',
    isSupervisor: usuario?.rol === 'SUPERVISOR',
    isTecnico: usuario?.rol === 'TECNICO',
    isAuthenticated: !!usuario,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
