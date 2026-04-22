import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Loader2, FileText, Filter, Calendar, Download } from 'lucide-react';
import { exportarPDF } from '../../utils/exportar';

const estadoBadge = { ASIGNADO:'bg-yellow-100 text-yellow-700', EN_PROCESO:'bg-orange-100 text-orange-700', RESUELTO:'bg-green-100 text-green-700', CERRADO:'bg-gray-100 text-gray-600' };
const prioridadBadge = { BAJA:'bg-green-100 text-green-700', MEDIA:'bg-yellow-100 text-yellow-700', ALTA:'bg-orange-100 text-orange-700', CRITICA:'bg-red-100 text-red-700' };

export default function MisReportesPage() {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({ estado: '', fechaDesde: '', fechaHasta: '' });

  const cargar = async () => {
    setCargando(true);
    try {
      const params = { limite: 500 };
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      const { data } = await api.get('/tickets/mis-tickets', { params });
      setTickets(data.data);
      if (data.data.length === 0) toast('No se encontraron tickets con esos filtros', { icon: '📋' });
    } catch { toast.error('Error cargando datos'); }
    finally { setCargando(false); }
  };

  const exportarPDFTecnico = () => {
    if (tickets.length === 0) { toast.error('Primero genere el reporte'); return; }

    const columnas = ['Código', 'Solicitante', 'Oficina', 'Tipo Falla', 'Prioridad', 'Estado', 'Fecha'];
    const filas = tickets.map(t => [
      t.codigoTicket,
      t.nombreSolicitante,
      t.oficina?.nombre || '',
      t.tipoFalla?.nombre || '',
      t.prioridad,
      t.estado?.replace('_', ' '),
      t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleDateString('es-CO') : '',
    ]);

    const fecha = new Date().toISOString().slice(0, 10);
    let subtitulo = `Total: ${tickets.length} tickets atendidos`;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      subtitulo += ` | Periodo: ${filtros.fechaDesde || '...'} a ${filtros.fechaHasta || '...'}`;
    }
    if (filtros.estado) subtitulo += ` | Estado: ${filtros.estado}`;

    exportarPDF(columnas, filas, 'Reporte de Tickets Atendidos', `MisTickets_${fecha}`, { subtitulo });
    toast.success(`${tickets.length} tickets exportados a PDF`);
  };

  const fmt = (f) => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  // Resumen
  const resumen = tickets.reduce((acc, t) => {
    acc[t.estado] = (acc[t.estado] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#0a4a2d]">Mis reportes</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
        <p className="text-sm font-semibold text-[#0a4a2d] mb-3 flex items-center gap-2"><Filter size={16} /> Filtrar mis tickets</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha desde</label>
            <input type="date" value={filtros.fechaDesde} onChange={e => setFiltros({ ...filtros, fechaDesde: e.target.value })}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha hasta</label>
            <input type="date" value={filtros.fechaHasta} onChange={e => setFiltros({ ...filtros, fechaHasta: e.target.value })}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todos</option>
              <option value="ASIGNADO">Asignado</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="RESUELTO">Resuelto</option>
              <option value="CERRADO">Cerrado</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={cargar} disabled={cargando}
            className="px-5 py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center gap-2">
            {cargando ? <Loader2 className="animate-spin" size={16} /> : <Filter size={16} />} Generar reporte
          </button>
          <button onClick={() => { setFiltros({ estado: '', fechaDesde: '', fechaHasta: '' }); setTickets([]); }}
            className="px-5 py-2.5 border border-[#d1ddd6] rounded-lg text-sm font-medium text-gray-600 hover:bg-[#f0f5f2]">
            Limpiar
          </button>
        </div>
      </div>

      {/* Resultados */}
      {tickets.length > 0 && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
              <p className="text-2xl font-bold text-[#0a4a2d]">{tickets.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            {Object.entries(resumen).map(([estado, cant]) => (
              <div key={estado} className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
                <p className="text-2xl font-bold text-[#0a4a2d]">{cant}</p>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${estadoBadge[estado] || 'bg-gray-100 text-gray-600'}`}>{estado.replace('_', ' ')}</span>
              </div>
            ))}
          </div>

          {/* Botón exportar */}
          <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
            <button onClick={exportarPDFTecnico}
              className="w-full py-3 bg-[#0a4a2d] text-white rounded-lg text-sm font-medium hover:bg-[#08ae62] transition-all flex items-center justify-center gap-2">
              <FileText size={18} /> Descargar reporte en PDF
            </button>
          </div>

          {/* Tabla preview */}
          <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d1ddd6] bg-[#f0f5f2]/50">
              <p className="text-sm font-medium text-[#0a4a2d]">Vista previa ({tickets.length} tickets)</p>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0"><tr className="bg-[#f0f5f2]">
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Código</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Solicitante</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Oficina</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Tipo</th>
                  <th className="text-center px-3 py-2 font-medium text-gray-500 text-xs">Prioridad</th>
                  <th className="text-center px-3 py-2 font-medium text-gray-500 text-xs">Estado</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Fecha</th>
                </tr></thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-[#f0f5f2]/30">
                      <td className="px-3 py-2 font-mono text-xs font-semibold text-[#0a4a2d]">{t.codigoTicket}</td>
                      <td className="px-3 py-2 text-xs">{t.nombreSolicitante}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{t.oficina?.nombre}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{t.tipoFalla?.nombre}</td>
                      <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${prioridadBadge[t.prioridad]}`}>{t.prioridad}</span></td>
                      <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge[t.estado]}`}>{t.estado.replace('_', ' ')}</span></td>
                      <td className="px-3 py-2 text-xs text-gray-500">{fmt(t.fechaCreacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
