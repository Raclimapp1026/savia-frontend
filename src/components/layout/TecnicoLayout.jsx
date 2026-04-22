import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Ticket, LogOut, Menu, X, Wrench, UserCog, FileText, Droplets, Circle } from 'lucide-react';

const ESTADOS_PRESENCIA = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'bg-green-500', textColor: 'text-green-600' },
  { value: 'AUSENTE', label: 'Ausente', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { value: 'EN_DESCANSO', label: 'En descanso', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { value: 'NO_DISPONIBLE', label: 'No disponible', color: 'bg-red-500', textColor: 'text-red-600' },
];

export default function TecnicoLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [presencia, setPresencia] = useState(usuario?.estadoPresencia || 'DISPONIBLE');
  const [menuPresencia, setMenuPresencia] = useState(false);

  const navItems = [
    { to: 'mis-tickets', label: 'Mis tickets', icon: Ticket },
    { to: 'mis-reportes', label: 'Mis reportes', icon: FileText },
    { to: 'insumos', label: 'Insumos', icon: Droplets },
    { to: 'perfil', label: 'Mi perfil', icon: UserCog },
  ];

  const cambiarPresencia = async (estado) => {
    try {
      await api.put('/auth/presencia', { estado });
      setPresencia(estado);
      setMenuPresencia(false);
      const label = ESTADOS_PRESENCIA.find(e => e.value === estado)?.label;
      toast.success(`Estado: ${label}`);
    } catch { toast.error('Error al cambiar estado'); }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/login');
  };

  const estadoActual = ESTADOS_PRESENCIA.find(e => e.value === presencia) || ESTADOS_PRESENCIA[3];

  return (
    <div className="min-h-screen bg-[#f0f5f2] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a4a2d] text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-5 border-b border-white/10 text-center">
          <img src="/logo-white.png" alt="Puerto Colombia" className="h-10 mx-auto mb-2" />
          <p className="text-[#f9f7d9] text-base font-bold tracking-[3px]">SAVIA</p>
          <p className="text-[#08ae62] text-[10px] mt-0.5">Panel técnico</p>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 text-white/70"><X size={20} /></button>
        </div>

        {/* Info usuario + estado de presencia */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 bg-white/5 rounded-lg">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#08ae62]/25 flex items-center justify-center text-[#08ae62] text-sm font-bold">{usuario?.nombre?.charAt(0)?.toUpperCase()}</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a4a2d] ${estadoActual.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f9f7d9] truncate">{usuario?.nombre}</p>
              <span className="text-[10px] text-[#08ae62] flex items-center gap-1"><Wrench size={10} /> Técnico</span>
            </div>
          </div>

          {/* Selector de presencia */}
          <div className="mt-2 relative">
            <button onClick={() => setMenuPresencia(!menuPresencia)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${estadoActual.color}`} />
                <span className="text-[#f9f7d9]">{estadoActual.label}</span>
              </div>
              <span className="text-white/40 text-[10px]">Cambiar</span>
            </button>

            {menuPresencia && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0c5c38] rounded-lg border border-white/10 overflow-hidden z-10">
                {ESTADOS_PRESENCIA.map(e => (
                  <button key={e.value} onClick={() => cambiarPresencia(e.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/10 transition-all ${presencia === e.value ? 'bg-white/10 text-[#f9f7d9]' : 'text-[#9fccb3]'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${e.color}`} />
                    {e.label}
                    {presencia === e.value && <span className="ml-auto text-[#08ae62] text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[#08ae62]/15 text-[#f9f7d9]' : 'text-[#9fccb3] hover:bg-white/5'}`}>
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#9fccb3] hover:bg-red-500/20 hover:text-red-200 w-full">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#d1ddd6] px-4 lg:px-6 h-14 flex items-center sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500"><Menu size={22} /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${estadoActual.color}`} />
            <span className={`text-xs font-medium ${estadoActual.textColor}`}>{estadoActual.label}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
