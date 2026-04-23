import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Send, CheckCircle, Copy, Loader2, Search, LogIn } from 'lucide-react';

export default function ReportarPage() {
  const [searchParams] = useSearchParams();
  const [oficinas, setOficinas] = useState([]);
  const [tiposFalla, setTiposFalla] = useState([]);
  const [enviado, setEnviado] = useState(false);
  const [ticketCreado, setTicketCreado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [form, setForm] = useState({
    nombreSolicitante: '', correoSolicitante: '', celularSolicitante: '',
    oficinaId: searchParams.get('oficina') || '', tipoFallaId: '', descripcion: '',
  });

  useEffect(() => {
    Promise.all([api.get('/oficinas/activas'), api.get('/tipos-falla/activos')])
      .then(([o, t]) => { setOficinas(o.data); setTiposFalla(t.data); })
      .catch(() => toast.error('Error cargando datos'))
      .finally(() => setCargandoDatos(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setCargando(true);
    try {
      const { data } = await api.post('/tickets', form);
      setTicketCreado(data); setEnviado(true); toast.success('Solicitud registrada');
    } catch (error) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al registrar');
    } finally { setCargando(false); }
  };

  if (cargandoDatos) return <div className="min-h-screen bg-[#f0f5f2] flex items-center justify-center"><Loader2 className="animate-spin text-[#08ae62]" size={32} /></div>;

  if (enviado && ticketCreado) return (
    <div className="min-h-screen bg-[#f0f5f2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        <div className="bg-[#0a4a2d] px-6 py-5 text-center">
          <img src="/logo-white.png" alt="Puerto Colombia" className="h-12 mx-auto mb-2" />
          <p className="text-[#f9f7d9] text-lg font-bold tracking-[3px]">SAVIA</p>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-[#08ae62]" size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#0a4a2d] mb-2">Solicitud registrada</h2>
          <p className="text-gray-500 text-sm mb-6">Su solicitud fue recibida exitosamente. El administrador revisará y asignará la prioridad correspondiente.</p>
          <div className="bg-[#f0f5f2] rounded-xl p-5 mb-6">
            <p className="text-xs text-[#08ae62] font-medium mb-1">Su código de ticket</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-bold text-[#0a4a2d] tracking-wider">{ticketCreado.codigoTicket}</span>
              <button onClick={() => { navigator.clipboard.writeText(ticketCreado.codigoTicket); toast.success('Copiado'); }}
                className="p-2 hover:bg-[#e8f0eb] rounded-lg"><Copy className="text-[#08ae62]" size={18} /></button>
            </div>
          </div>
          <div className="bg-[#f9f7d9]/40 border border-[#f9f7d9] rounded-lg p-4 mb-6 text-left">
            <p className="text-[#0a4a2d] text-xs font-medium mb-1">Importante</p>
            <p className="text-[#0a4a2d]/70 text-xs">Guarde este código para consultar el estado de su solicitud.</p>
          </div>
          <div className="flex gap-3">
            <a href="/consultar" className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 text-center">Consultar estado</a>
            <button onClick={() => { setEnviado(false); setTicketCreado(null); setForm({
              nombreSolicitante:'',correoSolicitante:'',celularSolicitante:'',oficinaId:searchParams.get('oficina')||'',tipoFallaId:'',descripcion:'',
            }); }} className="flex-1 py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] transition-colors">Nueva solicitud</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f5f2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
        <div className="bg-[#0a4a2d] px-6 py-6 text-center">
          <img src="/logo-white.png" alt="Puerto Colombia - Oficina TIC" className="h-14 mx-auto mb-3" />
          <div className="w-12 h-0.5 bg-[#08ae62] mx-auto mb-2 rounded-full" />
          <h1 className="text-[#f9f7d9] text-xl font-bold tracking-[3px]">SAVIA</h1>
          <p className="text-[#08ae62] text-xs mt-1">Sistema de atención vital e integral de asistencia</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-semibold text-[#0a4a2d]">Reportar incidencia</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo <span className="text-red-500">*</span></label>
            <input type="text" name="nombreSolicitante" value={form.nombreSolicitante} onChange={handleChange} required placeholder="Ej: Juan Pérez García"
              className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm focus:ring-2 focus:ring-[#08ae62]/20 focus:border-[#08ae62] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico <span className="text-red-500">*</span></label>
            <input type="email" name="correoSolicitante" value={form.correoSolicitante} onChange={handleChange} required placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm focus:ring-2 focus:ring-[#08ae62]/20 focus:border-[#08ae62] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Número de celular <span className="text-red-500">*</span></label>
            <input type="tel" name="celularSolicitante" value={form.celularSolicitante} onChange={handleChange} required placeholder="3001234567"
              className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm focus:ring-2 focus:ring-[#08ae62]/20 focus:border-[#08ae62] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Oficina <span className="text-red-500">*</span></label>
              <select name="oficinaId" value={form.oficinaId} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm focus:border-[#08ae62] outline-none">
                <option value="">Seleccione...</option>
                {oficinas.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de falla <span className="text-red-500">*</span></label>
              <select name="tipoFallaId" value={form.tipoFallaId} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm focus:border-[#08ae62] outline-none">
                <option value="">Seleccione...</option>
                {tiposFalla.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción del problema <span className="text-red-500">*</span></label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={4} required placeholder="Describa detalladamente el problema que está presentando..."
              className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm focus:border-[#08ae62] outline-none resize-none" />
            <p className="text-[10px] text-gray-400 mt-1">Entre más detalles proporcione, mejor podremos atender su solicitud.</p>
          </div>
          <button type="submit" disabled={cargando}
            className="w-full py-3 bg-[#08ae62] text-white rounded-lg font-semibold text-sm hover:bg-[#0a4a2d] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {cargando ? <><Loader2 className="animate-spin" size={18}/> Enviando...</> : <><Send size={18}/> Enviar solicitud</>}
          </button>
        </form>

        {/* Navegación */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <a href="/consultar" className="flex-1 py-2.5 border border-[#d1ddd6] rounded-lg text-sm font-medium text-[#0a4a2d] hover:bg-[#f0f5f2] text-center transition-all flex items-center justify-center gap-2">
            <Search size={16}/> Consultar ticket
          </a>
          <a href="/login" className="flex-1 py-2.5 border border-[#0a4a2d] rounded-lg text-sm font-medium text-[#0a4a2d] hover:bg-[#0a4a2d] hover:text-white text-center transition-all flex items-center justify-center gap-2">
            <LogIn size={16}/> Iniciar sesión
          </a>
        </div>
      </div>
    </div>
  );
}
