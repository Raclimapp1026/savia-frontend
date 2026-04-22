import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, roles = [] }) {
  const { usuario, cargando, isAuthenticated } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(usuario.rol)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
