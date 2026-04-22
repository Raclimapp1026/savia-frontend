import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Loader2, FileSpreadsheet, FileText, Download, Filter, Calendar } from 'lucide-react';
import { exportarExcel, exportarPDF, formatearTicketsParaExport, ticketsAFilasPDF, COLUMNAS_TICKETS_PDF } from '../../utils/exportar';

export default function ReportesPage() {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [oficinas, setOficinas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [tiposFalla, setTiposFalla] = useState([]);

  const [filtros, setFiltros] = useState({
    estado: '', prioridad: '', oficinaId: '', tecnicoId: '', tipoFallaId: '',
    fechaDesde: '', fechaHasta: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/oficinas').then(r => setOficinas(r.data)),
      api.get('/usuarios/tecnicos').then(r => setTecnicos(r.data)),
      api.get('/tipos-falla').then(r => setTiposFalla(r.data)),
    ]).catch(() => {});
  }, []);

  const cargarTickets = async () => {
    setCargando(true);
    try {
      const params = { limite: 1000 };
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get('/tickets', { params });
      setTickets(data.data);
      if (data.data.length === 0) toast('No se encontraron tickets con esos filtros', { icon: '📋' });
    } catch { toast.error('Error cargando datos'); }
    finally { setCargando(false); }
  };

  const handleExportExcel = () => {
    if (tickets.length === 0) { toast.error('Primero genere el reporte'); return; }
    const datos = formatearTicketsParaExport(tickets);
    const fecha = new Date().toISOString().slice(0, 10);
    exportarExcel(datos, `Reporte_SAVIA_${fecha}`, 'Tickets');
    toast.success(`${tickets.length} tickets exportados a Excel`);
  };

  const handleExportPDF = () => {
    if (tickets.length === 0) { toast.error('Primero genere el reporte'); return; }
    const filas = ticketsAFilasPDF(tickets);
    const fecha = new Date().toISOString().slice(0, 10);

    let subtitulo = `Total: ${tickets.length} tickets`;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      subtitulo += ` | Periodo: ${filtros.fechaDesde || '...'} a ${filtros.fechaHasta || '...'}`;
    }
    if (filtros.estado) subtitulo += ` | Estado: ${filtros.estado}`;
    if (filtros.prioridad) subtitulo += ` | Prioridad: ${filtros.prioridad}`;

    exportarPDF(COLUMNAS_TICKETS_PDF, filas, 'Reporte de Tickets', `Reporte_SAVIA_${fecha}`, { subtitulo });
    toast.success(`${tickets.length} tickets exportados a PDF`);
  };

  const limpiarFiltros = () => {
    setFiltros({ estado:'', prioridad:'', oficinaId:'', tecnicoId:'', tipoFallaId:'', fechaDesde:'', fechaHasta:'' });
    setTickets([]);
  };

  const estadoResumen = () => {
    const resumen = {};
    tickets.forEach(t => { resumen[t.estado] = (resumen[t.estado] || 0) + 1; });
    return resumen;
  };

  const prioridadResumen = () => {
    const resumen = {};
    tickets.forEach(t => { resumen[t.prioridad] = (resumen[t.prioridad] || 0) + 1; });
    return resumen;
  };

  const estadoBadge = { ABIERTO:'bg-blue-100 text-blue-700', ASIGNADO:'bg-yellow-100 text-yellow-700', EN_PROCESO:'bg-orange-100 text-orange-700', RESUELTO:'bg-green-100 text-green-700', CERRADO:'bg-gray-100 text-gray-600' };
  const prioridadBadge = { BAJA:'bg-green-100 text-green-700', MEDIA:'bg-yellow-100 text-yellow-700', ALTA:'bg-orange-100 text-orange-700', CRITICA:'bg-red-100 text-red-700' };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#0a4a2d]">Reportes</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
        <p className="text-sm font-semibold text-[#0a4a2d] mb-3 flex items-center gap-2"><Filter size={16}/> Filtros del reporte</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha desde</label>
            <input type="date" value={filtros.fechaDesde} onChange={e => setFiltros({...filtros, fechaDesde: e.target.value})}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha hasta</label>
            <input type="date" value={filtros.fechaHasta} onChange={e => setFiltros({...filtros, fechaHasta: e.target.value})}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todos</option>
              <option value="ABIERTO">Abierto</option><option value="ASIGNADO">Asignado</option>
              <option value="EN_PROCESO">En proceso</option><option value="RESUELTO">Resuelto</option><option value="CERRADO">Cerrado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Prioridad</label>
            <select value={filtros.prioridad} onChange={e => setFiltros({...filtros, prioridad: e.target.value})}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todas</option>
              <option value="BAJA">Baja</option><option value="MEDIA">Media</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Oficina</label>
            <select value={filtros.oficinaId} onChange={e => setFiltros({...filtros, oficinaId: e.target.value})}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todas</option>
              {oficinas.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Técnico</label>
            <select value={filtros.tecnicoId} onChange={e => setFiltros({...filtros, tecnicoId: e.target.value})}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todos</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de falla</label>
            <select value={filtros.tipoFallaId} onChange={e => setFiltros({...filtros, tipoFallaId: e.target.value})}
              className="w-full px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todos</option>
              {tiposFalla.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={cargarTickets} disabled={cargando}
            className="px-5 py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center gap-2">
            {cargando ? <Loader2 className="animate-spin" size={16}/> : <Filter size={16}/>} Generar reporte
          </button>
          <button onClick={limpiarFiltros} className="px-5 py-2.5 border border-[#d1ddd6] rounded-lg text-sm font-medium text-gray-600 hover:bg-[#f0f5f2]">
            Limpiar
          </button>
        </div>
      </div>

      {/* Resultados y exportación */}
      {tickets.length > 0 && (
        <>
          {/* Resumen rápido */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
              <p className="text-2xl font-bold text-[#0a4a2d]">{tickets.length}</p>
              <p className="text-xs text-gray-500">Total tickets</p>
            </div>
            {Object.entries(estadoResumen()).map(([estado, cant]) => (
              <div key={estado} className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
                <p className="text-2xl font-bold text-[#0a4a2d]">{cant}</p>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${estadoBadge[estado]}`}>{estado.replace('_',' ')}</span>
              </div>
            ))}
          </div>

          {/* Botones de exportación */}
          <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
            <p className="text-sm font-semibold text-[#0a4a2d] mb-3 flex items-center gap-2"><Download size={16}/> Exportar datos</p>
            <div className="flex gap-3">
              <button onClick={handleExportExcel}
                className="flex-1 py-3 bg-[#0a4a2d] text-white rounded-lg text-sm font-medium hover:bg-[#08ae62] transition-all flex items-center justify-center gap-2">
                <FileSpreadsheet size={18}/> Descargar Excel
              </button>
              <button onClick={handleExportPDF}
                className="flex-1 py-3 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] transition-all flex items-center justify-center gap-2">
                <FileText size={18}/> Descargar PDF
              </button>
            </div>
          </div>

          {/* Preview tabla */}
          <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d1ddd6] bg-[#f0f5f2]/50">
              <p className="text-sm font-medium text-[#0a4a2d]">Vista previa ({tickets.length} registros)</p>
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
                  <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Técnico</th>
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
                      <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge[t.estado]}`}>{t.estado.replace('_',' ')}</span></td>
                      <td className="px-3 py-2 text-xs text-gray-600">{t.tecnico?.nombre || '—'}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{new Date(t.fechaCreacion).toLocaleDateString('es-CO')}</td>
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
