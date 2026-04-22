import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setCargando(true);
    try {
      const usuario = await login(correo, password);
      toast.success(`Bienvenido, ${usuario.nombre}`);
      navigate(usuario.rol === 'TECNICO' ? '/tecnico/mis-tickets' : '/admin/dashboard');
    } catch (error) { toast.error(error.response?.data?.message || 'Error al iniciar sesión'); }
    finally { setCargando(false); }
  };

  return (
    <div className="min-h-screen bg-[#f0f5f2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full overflow-hidden">
        <div className="bg-[#0a4a2d] px-6 py-8 text-center">
          <img src="/logo-white.png" alt="Puerto Colombia - Oficina TIC" className="h-14 mx-auto mb-3" />
          <div className="w-12 h-0.5 bg-[#08ae62] mx-auto mb-2 rounded-full" />
          <h1 className="text-[#f9f7d9] text-2xl font-bold tracking-[3px]">SAVIA</h1>
          <p className="text-[#08ae62] text-sm mt-1">Acceso al sistema</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Correo institucional</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required placeholder="correo@entidad.gov.co"
                className="w-full pl-10 pr-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm focus:ring-2 focus:ring-[#08ae62]/20 focus:border-[#08ae62] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm focus:ring-2 focus:ring-[#08ae62]/20 focus:border-[#08ae62] outline-none" />
            </div>
          </div>
          <button type="submit" disabled={cargando}
            className="w-full py-3 bg-[#08ae62] text-white rounded-lg font-semibold text-sm hover:bg-[#0a4a2d] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {cargando ? <><Loader2 className="animate-spin" size={18}/> Ingresando...</> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
