import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import TecnicoLayout from './components/layout/TecnicoLayout';

// Public pages
import ReportarPage from './pages/public/ReportarPage';
import ConsultarPage from './pages/public/ConsultarPage';
import LoginPage from './pages/public/LoginPage';

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import TicketsPage from './pages/admin/TicketsPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import OficinasPage from './pages/admin/OficinasPage';
import TiposFallaPage from './pages/admin/TiposFallaPage';
import ReportesPage from './pages/admin/ReportesPage';
import EquiposPage from './pages/admin/EquiposPage';
import InsumosPage from './pages/admin/InsumosPage';

// Tecnico pages
import MisTicketsPage from './pages/tecnico/MisTicketsPage';
import MisReportesPage from './pages/tecnico/MisReportesPage';
import PerfilPage from './pages/tecnico/PerfilPage';
import TecnicoInsumosPage from './pages/tecnico/TecnicoInsumosPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '14px', borderRadius: '10px' },
          }}
        />

        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Navigate to="/reportar" replace />} />
          <Route path="/reportar" element={<ReportarPage />} />
          <Route path="/consultar" element={<ConsultarPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Panel Admin / Supervisor */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPERVISOR']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="oficinas" element={<OficinasPage />} />
            <Route path="tipos-falla" element={<TiposFallaPage />} />
            <Route path="equipos" element={<EquiposPage />} />
            <Route path="insumos" element={<InsumosPage />} />
          </Route>

          {/* Panel Técnico */}
          <Route
            path="/tecnico"
            element={
              <ProtectedRoute roles={['TECNICO']}>
                <TecnicoLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="mis-tickets" replace />} />
            <Route path="mis-tickets" element={<MisTicketsPage />} />
            <Route path="mis-reportes" element={<MisReportesPage />} />
            <Route path="insumos" element={<TecnicoInsumosPage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/reportar" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
