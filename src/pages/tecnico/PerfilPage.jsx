import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Loader2, Lock, UserCog, ShieldCheck, Mail, CheckCircle } from 'lucide-react';

export default function PerfilPage() {
  const { usuario } = useAuth();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [cambiando, setCambiando] = useState(false);

  const handleCambiarPassword = async (e) => {
    e.preventDefault();

    if (passwordNueva !== passwordConfirmar) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordNueva.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setCambiando(true);
    try {
      await api.put('/auth/cambiar-password', {
        passwordActual,
        passwordNueva,
      });
      toast.success('Contraseña actualizada exitosamente');
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setCambiando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-[#0a4a2d]">Mi perfil</h1>

      {/* Info del usuario */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
        <div className="bg-[#0a4a2d] px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#08ae62]/25 flex items-center justify-center text-[#08ae62] text-xl font-bold">
              {usuario?.nombre?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-[#f9f7d9] text-lg font-semibold">{usuario?.nombre}</p>
              <span className="text-[#08ae62] text-sm flex items-center gap-1"><ShieldCheck size={14} /> {usuario?.rol}</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-[#f0f5f2] rounded-lg p-4">
              <Mail className="text-[#08ae62]" size={20} />
              <div>
                <p className="text-xs text-gray-400">Correo</p>
                <p className="text-sm font-medium text-[#0a4a2d]">{usuario?.correo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#f0f5f2] rounded-lg p-4">
              <UserCog className="text-[#08ae62]" size={20} />
              <div>
                <p className="text-xs text-gray-400">Rol en el sistema</p>
                <p className="text-sm font-medium text-[#0a4a2d]">{usuario?.rol}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#d1ddd6] flex items-center gap-2">
          <Lock className="text-[#0a4a2d]" size={18} />
          <h2 className="text-sm font-semibold text-[#0a4a2d]">Cambiar contraseña</h2>
        </div>
        <form onSubmit={handleCambiarPassword} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña actual <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="password" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} required
                placeholder="Ingrese su contraseña actual"
                className="w-full pl-9 pr-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="password" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} required
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-9 pr-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
            </div>
            {passwordNueva && passwordNueva.length < 8 && (
              <p className="text-xs text-red-500 mt-1">Debe tener al menos 8 caracteres</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Confirmar nueva contraseña <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="password" value={passwordConfirmar} onChange={e => setPasswordConfirmar(e.target.value)} required
                placeholder="Repita la nueva contraseña"
                className="w-full pl-9 pr-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
            </div>
            {passwordConfirmar && passwordNueva !== passwordConfirmar && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
            {passwordConfirmar && passwordNueva === passwordConfirmar && passwordConfirmar.length >= 8 && (
              <p className="text-xs text-[#08ae62] mt-1 flex items-center gap-1"><CheckCircle size={12} /> Las contraseñas coinciden</p>
            )}
          </div>

          <button type="submit" disabled={cambiando || !passwordActual || !passwordNueva || passwordNueva !== passwordConfirmar || passwordNueva.length < 8}
            className="w-full py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
            {cambiando ? <><Loader2 className="animate-spin" size={16} /> Cambiando...</> : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
