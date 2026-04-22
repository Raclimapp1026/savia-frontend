import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Ticket, Users, Building2, Wrench, LogOut, Menu, X, ShieldCheck, ChevronRight, FileText, Package, Droplets } from 'lucide-react';

export default function AdminLayout() {
  const { usuario, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN','SUPERVISOR'] },
    { to: 'tickets', label: 'Tickets', icon: Ticket, roles: ['ADMIN','SUPERVISOR'] },
    { to: 'reportes', label: 'Reportes', icon: FileText, roles: ['ADMIN','SUPERVISOR'] },
    { to: 'equipos', label: 'Inventario', icon: Package, roles: ['ADMIN','SUPERVISOR'] },
    { to: 'insumos', label: 'Insumos', icon: Droplets, roles: ['ADMIN','SUPERVISOR'] },
    { to: 'usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
    { to: 'oficinas', label: 'Oficinas', icon: Building2, roles: ['ADMIN'] },
    { to: 'tipos-falla', label: 'Tipos de falla', icon: Wrench, roles: ['ADMIN'] },
  ].filter(i => i.roles.includes(usuario?.rol));

  return (
    <div className="min-h-screen bg-[#f0f5f2] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}/>}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a4a2d] text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-5 border-b border-white/10 text-center">
          <img src="/logo-white.png" alt="Puerto Colombia" className="h-10 mx-auto mb-2" />
          <p className="text-[#f9f7d9] text-base font-bold tracking-[3px]">SAVIA</p>
          <p className="text-[#08ae62] text-[10px] mt-0.5">Soporte técnico</p>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 text-white/70"><X size={20}/></button>
        </div>
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#08ae62]/25 flex items-center justify-center text-[#08ae62] text-sm font-bold">
              {usuario?.nombre?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[#f9f7d9]">{usuario?.nombre}</p>
              <span className="text-[10px] text-[#08ae62] flex items-center gap-1"><ShieldCheck size={10}/>{usuario?.rol}</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive ? 'bg-[#08ae62]/15 text-[#f9f7d9]' : 'text-[#9fccb3] hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={18}/> {item.label} <ChevronRight size={14} className="ml-auto opacity-40"/>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#9fccb3] hover:bg-red-500/20 hover:text-red-200 w-full">
            <LogOut size={18}/> Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#d1ddd6] px-4 lg:px-6 h-14 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500"><Menu size={22}/></button>
          <div className="flex-1"/>
          <span className="text-xs text-gray-400 hidden sm:block">SAVIA v1.0</span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto"><Outlet/></main>
      </div>
    </div>
  );
}
