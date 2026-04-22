import { useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Search, Loader2, Ticket, Clock, User, Building2, MessageSquare } from 'lucide-react';

const estadoConfig = {
  ABIERTO: { color: 'bg-blue-100 text-blue-700', label: 'Abierto' },
  ASIGNADO: { color: 'bg-yellow-100 text-yellow-700', label: 'Asignado' },
  EN_PROCESO: { color: 'bg-orange-100 text-orange-700', label: 'En proceso' },
  RESUELTO: { color: 'bg-green-100 text-green-700', label: 'Resuelto' },
  CERRADO: { color: 'bg-gray-100 text-gray-600', label: 'Cerrado' },
};

export default function ConsultarPage() {
  const [codigo, setCodigo] = useState('');
  const [ticket, setTicket] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const handleBuscar = async (e) => {
    e.preventDefault(); if (!codigo.trim()) return;
    setBuscando(true); setBuscado(true); setTicket(null);
    try { const { data } = await api.get(`/tickets/consultar/${codigo.trim()}`); setTicket(data); }
    catch { toast.error('No se encontró el ticket'); }
    finally { setBuscando(false); }
  };

  const fmt = (f) => f ? new Date(f).toLocaleString('es-CO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

  return (
    <div className="min-h-screen bg-[#f0f5f2] flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-[#0a4a2d] px-6 py-5 text-center">
            <img src="/logo-white.png" alt="Puerto Colombia" className="h-10 mx-auto mb-2" />
            <p className="text-[#f9f7d9] text-lg font-bold tracking-[3px]">SAVIA</p>
            <p className="text-[#08ae62] text-xs mt-1">Consultar estado de ticket</p>
          </div>
          <form onSubmit={handleBuscar} className="p-6">
            <div className="flex gap-2">
              <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: TIC260401-001"
                className="flex-1 px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm font-mono tracking-wider uppercase focus:border-[#08ae62] outline-none" />
              <button type="submit" disabled={buscando || !codigo.trim()}
                className="px-5 py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center gap-2">
                {buscando ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Buscar
              </button>
            </div>
          </form>
        </div>

        {buscado && !buscando && ticket && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Ticket className="text-[#0a4a2d]" size={18}/>
                  <span className="font-mono font-bold text-[#0a4a2d] tracking-wider">{ticket.codigoTicket}</span>
                </div>
                <p className="text-sm text-gray-500">{ticket.nombreSolicitante}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoConfig[ticket.estado]?.color}`}>{estadoConfig[ticket.estado]?.label}</span>
            </div>
            <div className="flex items-center gap-1">
              {['ABIERTO','ASIGNADO','EN_PROCESO','RESUELTO','CERRADO'].map((e, i) => {
                const idx = ['ABIERTO','ASIGNADO','EN_PROCESO','RESUELTO','CERRADO'].indexOf(ticket.estado);
                return (
                  <div key={e} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-1.5 w-full rounded-full ${i<=idx ? 'bg-[#08ae62]' : 'bg-gray-200'}`}/>
                    <span className={`text-[10px] ${i<=idx ? 'text-[#0a4a2d] font-medium' : 'text-gray-400'}`}>{estadoConfig[e]?.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500"><Building2 size={14}/>{ticket.oficina?.nombre}</div>
              <div className="flex items-center gap-2 text-gray-500"><Clock size={14}/>{fmt(ticket.fechaCreacion)}</div>
              <div className="flex items-center gap-2 text-gray-500"><User size={14}/>{ticket.tecnico?.nombre||'Sin asignar'}</div>
            </div>
            {ticket.comentarios?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><MessageSquare size={14}/> Últimos comentarios</h3>
                <div className="space-y-2">
                  {ticket.comentarios.map((c,i) => (
                    <div key={i} className="bg-[#f0f5f2] rounded-lg p-3">
                      <div className="flex justify-between mb-1"><span className="text-xs font-medium text-gray-700">{c.usuario?.nombre}</span><span className="text-xs text-gray-400">{fmt(c.fecha)}</span></div>
                      <p className="text-xs text-gray-600">{c.contenido}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {buscado && !buscando && !ticket && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500 text-sm">No se encontró un ticket con ese código.</p>
          </div>
        )}
        <div className="text-center"><a href="/reportar" className="text-sm text-[#08ae62] hover:underline">¿Necesita reportar una nueva incidencia?</a></div>
      </div>
    </div>
  );
}
