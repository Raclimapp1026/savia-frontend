import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Search, Loader2, Filter, User, ChevronLeft, ChevronRight, CheckCircle, X, ClipboardList, Image as ImageIcon, Eye, UserCheck, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const estadoBadge = { ABIERTO:'bg-blue-100 text-blue-700', ASIGNADO:'bg-yellow-100 text-yellow-700', EN_PROCESO:'bg-orange-100 text-orange-700', RESUELTO:'bg-[#08ae62]/10 text-[#0a4a2d]', CERRADO:'bg-gray-100 text-gray-600' };
const prioridadBadge = { BAJA:'bg-green-100 text-green-700', MEDIA:'bg-yellow-100 text-yellow-700', ALTA:'bg-orange-100 text-orange-700', CRITICA:'bg-red-100 text-red-700' };

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [tecnicos, setTecnicos] = useState([]);

  // Modales
  const [asignarModal, setAsignarModal] = useState(null);
  const [reasignarModal, setReasignarModal] = useState(null);
  const [visualizarModal, setVisualizarModal] = useState(null);
  const [cerrarModal, setCerrarModal] = useState(null);

  // Estado de formularios
  const [tecnicoAsignar, setTecnicoAsignar] = useState('');
  const [prioridadAsignar, setPrioridadAsignar] = useState('MEDIA');
  const [tecnicoReasignar, setTecnicoReasignar] = useState('');
  const [motivoReasignar, setMotivoReasignar] = useState('');
  const [observacionCierre, setObservacionCierre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [filtros, setFiltros] = useState({ estado:'', prioridad:'', busqueda:'', pagina:1 });

  const cargarTickets = async () => {
    setCargando(true);
    try {
      const params = { ...filtros, limite:15 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/tickets', { params });
      setTickets(data.data); setMeta(data.meta);
    } catch { toast.error('Error cargando tickets'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargarTickets(); }, [filtros.estado, filtros.prioridad, filtros.pagina]);
  useEffect(() => { api.get('/usuarios/tecnicos').then(r=>setTecnicos(r.data)).catch(()=>{}); }, []);

  const abrirAsignar = (ticket) => {
    setAsignarModal(ticket);
    setTecnicoAsignar('');
    setPrioridadAsignar(ticket.prioridad || 'MEDIA');
  };

  const procesarAsignar = async () => {
    if (!tecnicoAsignar || !asignarModal) return;
    setGuardando(true);
    try {
      // Primero cambiar prioridad si es diferente
      if (prioridadAsignar !== asignarModal.prioridad) {
        await api.put(`/tickets/${asignarModal.id}/prioridad`, { prioridad: prioridadAsignar });
      }
      // Luego asignar técnico
      await api.put(`/tickets/${asignarModal.id}/asignar`, { tecnicoId: tecnicoAsignar });
      toast.success('Ticket asignado');
      setAsignarModal(null);
      cargarTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al asignar');
    } finally { setGuardando(false); }
  };

  const abrirReasignar = (ticket) => {
    setReasignarModal(ticket);
    setTecnicoReasignar('');
    setMotivoReasignar('');
  };

  const procesarReasignar = async () => {
    if (!tecnicoReasignar || !reasignarModal) return;
    if (tecnicoReasignar === reasignarModal.tecnicoId) {
      toast.error('Debe seleccionar un técnico diferente al actual');
      return;
    }
    setGuardando(true);
    try {
      await api.put(`/tickets/${reasignarModal.id}/asignar`, { tecnicoId: tecnicoReasignar });
      toast.success('Ticket reasignado');
      setReasignarModal(null);
      cargarTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al reasignar');
    } finally { setGuardando(false); }
  };

  const abrirVisualizar = async (ticket) => {
    try {
      const { data } = await api.get(`/tickets/${ticket.id}`);
      setVisualizarModal(data);
    } catch { toast.error('Error cargando detalle'); }
  };

  const abrirCerrar = async (ticket) => {
    try {
      const { data } = await api.get(`/tickets/${ticket.id}`);
      setCerrarModal(data);
      setObservacionCierre('');
    } catch { toast.error('Error cargando detalle'); }
  };

  const cerrarTicket = async () => {
    if (!cerrarModal) return;
    try {
      await api.put(`/tickets/${cerrarModal.id}/estado`, { estado:'CERRADO', observacion: observacionCierre || 'Ticket cerrado por el administrador' });
      toast.success('Ticket cerrado');
      setCerrarModal(null);
      cargarTickets();
    } catch (error) { toast.error(error.response?.data?.message || 'Error'); }
  };

  const fmt = (f) => f ? new Date(f).toLocaleDateString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
  const fotoURL = (path) => {
    if (!path) return null;
    const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    return `${base}${path}`;
  };

  const descargarPDFTicket = (ticket) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    let y = 0;

    // Header SAVIA
    doc.setFillColor(10, 74, 45);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(249, 247, 217);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SAVIA', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(8, 174, 98);
    doc.text('Sistema de atencion vital e integral de asistencia', 14, 19);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, pw - 14, 13, { align: 'right' });

    // Titulo
    y = 38;
    doc.setTextColor(10, 74, 45);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Historial del Ticket ${ticket.codigoTicket}`, 14, y);
    y += 4;

    // Linea verde
    doc.setDrawColor(8, 174, 98);
    doc.setLineWidth(0.5);
    doc.line(14, y, pw - 14, y);
    y += 8;

    // Info general - tabla
    doc.setFontSize(11);
    doc.setTextColor(10, 74, 45);
    doc.setFont('helvetica', 'bold');
    doc.text('Informacion general', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      body: [
        ['Solicitante', ticket.nombreSolicitante, 'Correo', ticket.correoSolicitante],
        ['Celular', ticket.celularSolicitante, 'Oficina', ticket.oficina?.nombre || ''],
        ['Tipo de falla', ticket.tipoFalla?.nombre || '', 'Prioridad', ticket.prioridad],
        ['Tecnico', ticket.tecnico?.nombre || 'N/A', 'Estado', ticket.estado?.replace('_', ' ')],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240,245,242], cellWidth: 30 }, 2: { fontStyle: 'bold', fillColor: [240,245,242], cellWidth: 30 } },
      headStyles: { fillColor: [10, 74, 45] },
    });
    y = doc.lastAutoTable.finalY + 6;

    // Fechas
    doc.setFontSize(11);
    doc.setTextColor(10, 74, 45);
    doc.setFont('helvetica', 'bold');
    doc.text('Cronologia', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      body: [
        ['Creacion', fmt(ticket.fechaCreacion), 'Asignacion', fmt(ticket.fechaAsignacion)],
        ['Resolucion', fmt(ticket.fechaResolucion), 'Cierre', fmt(ticket.fechaCierre)],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240,245,242], cellWidth: 30 }, 2: { fontStyle: 'bold', fillColor: [240,245,242], cellWidth: 30 } },
    });
    y = doc.lastAutoTable.finalY + 6;

    // Descripcion
    if (ticket.descripcion) {
      doc.setFontSize(11);
      doc.setTextColor(10, 74, 45);
      doc.setFont('helvetica', 'bold');
      doc.text('Descripcion del problema', 14, y);
      y += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(ticket.descripcion, pw - 28);
      doc.text(lines, 14, y);
      y += lines.length * 4.5 + 6;
    }

    // Diagnostico
    if (ticket.diagnostico) {
      doc.setFontSize(11);
      doc.setTextColor(10, 74, 45);
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnostico tecnico', 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        body: [
          ['Tipo equipo', ticket.diagnostico.tipoEquipo?.replace('_', ' '), 'Marca', ticket.diagnostico.marca],
          ['Modelo', ticket.diagnostico.modelo, 'Serial', ticket.diagnostico.serial],
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [249,247,217], cellWidth: 30 }, 2: { fontStyle: 'bold', fillColor: [249,247,217], cellWidth: 30 } },
      });
      y = doc.lastAutoTable.finalY + 4;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Observaciones del soporte:', 14, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const obsLines = doc.splitTextToSize(ticket.diagnostico.observaciones || '', pw - 28);
      doc.text(obsLines, 14, y);
      y += obsLines.length * 4 + 6;
    }

    // Historial de cambios
    if (ticket.historialEstados?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setTextColor(10, 74, 45);
      doc.setFont('helvetica', 'bold');
      doc.text('Historial de cambios', 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Estado', 'Usuario', 'Observacion']],
        body: ticket.historialEstados.map(h => [
          fmt(h.fecha),
          h.estadoNuevo?.replace('_', ' '),
          h.usuario?.nombre || '',
          h.observacion || '',
        ]),
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [10, 74, 45], textColor: [255,255,255] },
        alternateRowStyles: { fillColor: [240, 245, 242] },
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    // Comentarios
    if (ticket.comentarios?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setTextColor(10, 74, 45);
      doc.setFont('helvetica', 'bold');
      doc.text('Comentarios', 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Usuario', 'Comentario']],
        body: ticket.comentarios.map(c => [
          fmt(c.fecha),
          c.usuario?.nombre || '',
          c.contenido || '',
        ]),
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [10, 74, 45], textColor: [255,255,255] },
        alternateRowStyles: { fillColor: [240, 245, 242] },
      });
    }

    // Footer en todas las paginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('SAVIA - Alcaldia de Puerto Colombia - Oficina TIC', 14, doc.internal.pageSize.getHeight() - 8);
      doc.text(`Pagina ${i} de ${pageCount}`, pw - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save(`Ticket_${ticket.codigoTicket}.pdf`);
    toast.success('PDF descargado');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#0a4a2d]">Gestión de tickets</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] p-4">
        <form onSubmit={(e)=>{e.preventDefault();setFiltros({...filtros,pagina:1});cargarTickets();}} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <input type="text" value={filtros.busqueda} onChange={(e)=>setFiltros({...filtros,busqueda:e.target.value})} placeholder="Código, nombre o correo..."
                className="w-full pl-9 pr-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={filtros.estado} onChange={e=>setFiltros({...filtros,estado:e.target.value,pagina:1})} className="px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todos</option><option value="ABIERTO">Abierto</option><option value="ASIGNADO">Asignado</option><option value="EN_PROCESO">En proceso</option><option value="RESUELTO">Resuelto</option><option value="CERRADO">Cerrado</option>
            </select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Prioridad</label>
            <select value={filtros.prioridad} onChange={e=>setFiltros({...filtros,prioridad:e.target.value,pagina:1})} className="px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todas</option><option value="BAJA">Baja</option><option value="MEDIA">Media</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option>
            </select></div>
          <button type="submit" className="px-4 py-2 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] flex items-center gap-2"><Filter size={14}/> Filtrar</button>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
        {cargando ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#08ae62]" size={28}/></div>
        : tickets.length===0 ? <div className="text-center py-16 text-gray-400 text-sm">No se encontraron tickets</div>
        : <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#d1ddd6] bg-[#f0f5f2]/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Código</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Solicitante</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Oficina</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Tipo</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Prioridad</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Técnico</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Acciones</th>
            </tr></thead>
            <tbody>{tickets.map(t=>(
              <tr key={t.id} className="border-b border-gray-50 hover:bg-[#f0f5f2]/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-[#0a4a2d]">{t.codigoTicket}</td>
                <td className="px-4 py-3"><p className="font-medium text-gray-700 text-xs">{t.nombreSolicitante}</p><p className="text-gray-400 text-[11px]">{t.correoSolicitante}</p></td>
                <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{t.oficina?.nombre}</td>
                <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{t.tipoFalla?.nombre}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${prioridadBadge[t.prioridad]}`}>{t.prioridad}</span></td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${estadoBadge[t.estado]}`}>{t.estado.replace('_',' ')}</span></td>
                <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{t.tecnico?.nombre||'—'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {t.estado === 'ABIERTO' && (
                      <button onClick={()=>abrirAsignar(t)} className="text-xs px-2.5 py-1 bg-[#08ae62] text-white rounded-lg hover:bg-[#0a4a2d] flex items-center gap-1" title="Asignar">
                        <UserCheck size={12}/> Asignar
                      </button>
                    )}
                    {(t.estado === 'ASIGNADO' || t.estado === 'EN_PROCESO') && (
                      <button onClick={()=>abrirReasignar(t)} className="text-xs px-2.5 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-1" title="Reasignar">
                        <RefreshCw size={12}/> Reasignar
                      </button>
                    )}
                    {t.estado === 'RESUELTO' && (
                      <button onClick={()=>abrirCerrar(t)} className="text-xs px-2.5 py-1 bg-[#0a4a2d] text-white rounded-lg hover:bg-[#08ae62] flex items-center gap-1" title="Cerrar">
                        <CheckCircle size={12}/> Cerrar
                      </button>
                    )}
                    {t.estado === 'CERRADO' && (
                      <button onClick={()=>abrirVisualizar(t)} className="text-xs px-2.5 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-1" title="Visualizar historial">
                        <Eye size={12}/> Visualizar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
        {meta.totalPaginas>1 && <div className="flex items-center justify-between px-4 py-3 border-t border-[#d1ddd6]">
          <span className="text-xs text-gray-500">{meta.total} tickets — Pág. {meta.pagina} de {meta.totalPaginas}</span>
          <div className="flex gap-1">
            <button disabled={meta.pagina<=1} onClick={()=>setFiltros({...filtros,pagina:filtros.pagina-1})} className="p-1.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"><ChevronLeft size={16}/></button>
            <button disabled={meta.pagina>=meta.totalPaginas} onClick={()=>setFiltros({...filtros,pagina:filtros.pagina+1})} className="p-1.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"><ChevronRight size={16}/></button>
          </div>
        </div>}
      </div>

      {/* MODAL ASIGNAR con Prioridad */}
      {asignarModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setAsignarModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <div className="bg-[#0a4a2d] px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-[#f9f7d9] font-bold flex items-center gap-2"><UserCheck size={18}/> Asignar ticket</h3>
                <p className="text-[#08ae62] text-xs mt-1">{asignarModal.codigoTicket}</p>
              </div>
              <button onClick={()=>setAsignarModal(null)}><X size={20} className="text-white/60"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#f0f5f2] rounded-lg p-3 space-y-1 text-xs">
                <div><span className="text-gray-400">Solicitante:</span> <span className="font-medium">{asignarModal.nombreSolicitante}</span></div>
                <div><span className="text-gray-400">Oficina:</span> <span className="font-medium">{asignarModal.oficina?.nombre}</span></div>
                <div><span className="text-gray-400">Tipo falla:</span> <span className="font-medium">{asignarModal.tipoFalla?.nombre}</span></div>
                {asignarModal.descripcion && <div><span className="text-gray-400">Descripción:</span> <p className="mt-1 text-gray-700">{asignarModal.descripcion}</p></div>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Asignar prioridad <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value:'BAJA', label:'Baja', s:'bg-green-50 border-green-200 text-green-700' },
                    { value:'MEDIA', label:'Media', s:'bg-yellow-50 border-yellow-200 text-yellow-700' },
                    { value:'ALTA', label:'Alta', s:'bg-orange-50 border-orange-200 text-orange-700' },
                    { value:'CRITICA', label:'Crítica', s:'bg-red-50 border-red-200 text-red-700' },
                  ].map(p => (
                    <button key={p.value} type="button" onClick={()=>setPrioridadAsignar(p.value)}
                      className={`py-2 rounded-lg border text-xs font-medium transition-all ${p.s} ${prioridadAsignar===p.value ? 'ring-2 ring-[#08ae62] scale-105' : 'opacity-60'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Técnico <span className="text-red-500">*</span></label>
                {tecnicos.length === 0 ? <p className="text-xs text-gray-400">No hay técnicos disponibles</p> : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {tecnicos.map((t, idx) => {
                      const presColor = { DISPONIBLE:'bg-green-500', AUSENTE:'bg-yellow-500', EN_DESCANSO:'bg-blue-500', NO_DISPONIBLE:'bg-red-500' };
                      const presLabel = { DISPONIBLE:'Disponible', AUSENTE:'Ausente', EN_DESCANSO:'En descanso', NO_DISPONIBLE:'No disponible' };
                      const esRecomendado = idx === 0 && t.estadoPresencia === 'DISPONIBLE';
                      const esDisponible = t.estadoPresencia === 'DISPONIBLE';
                      return (
                        <button key={t.id} type="button" onClick={() => setTecnicoAsignar(t.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${tecnicoAsignar === t.id ? 'border-[#08ae62] bg-[#08ae62]/5 ring-1 ring-[#08ae62]' : 'border-[#d1ddd6] hover:border-[#08ae62]/50'} ${!esDisponible ? 'opacity-60' : ''}`}>
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-[#f0f5f2] flex items-center justify-center text-[#0a4a2d] text-xs font-bold">{t.nombre?.charAt(0)?.toUpperCase()}</div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${presColor[t.estadoPresencia] || 'bg-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-gray-700 truncate">{t.nombre}</p>
                              {esRecomendado && <span className="px-1.5 py-0.5 bg-[#08ae62]/10 text-[#08ae62] text-[9px] font-bold rounded">SUGERIDO</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400">{presLabel[t.estadoPresencia] || 'Desconocido'}</span>
                              <span className="text-[10px] text-gray-400">•</span>
                              <span className="text-[10px] text-gray-400">{t._count?.ticketsAsignados || 0} tickets activos</span>
                            </div>
                          </div>
                          {tecnicoAsignar === t.id && <div className="w-5 h-5 rounded-full bg-[#08ae62] flex items-center justify-center"><span className="text-white text-[10px]">✓</span></div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={()=>setAsignarModal(null)} className="flex-1 py-2.5 border border-[#d1ddd6] rounded-lg text-sm font-medium text-gray-600 hover:bg-[#f0f5f2]">Cancelar</button>
                <button onClick={procesarAsignar} disabled={!tecnicoAsignar||guardando} className="flex-1 py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center justify-center gap-2">
                  {guardando && <Loader2 className="animate-spin" size={16}/>} Asignar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REASIGNAR */}
      {reasignarModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setReasignarModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <div className="bg-amber-600 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold flex items-center gap-2"><RefreshCw size={18}/> Reasignar ticket</h3>
                <p className="text-amber-100 text-xs mt-1">{reasignarModal.codigoTicket}</p>
              </div>
              <button onClick={()=>setReasignarModal(null)}><X size={20} className="text-white/60"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="font-medium">Técnico actual: {reasignarModal.tecnico?.nombre}</p>
                  <p className="mt-1">Seleccione un técnico diferente para reasignar este ticket.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Nuevo técnico <span className="text-red-500">*</span></label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {tecnicos.filter(t => t.id !== reasignarModal.tecnicoId).map(t => {
                    const presColor = { DISPONIBLE:'bg-green-500', AUSENTE:'bg-yellow-500', EN_DESCANSO:'bg-blue-500', NO_DISPONIBLE:'bg-red-500' };
                    const presLabel = { DISPONIBLE:'Disponible', AUSENTE:'Ausente', EN_DESCANSO:'En descanso', NO_DISPONIBLE:'No disponible' };
                    const esDisponible = t.estadoPresencia === 'DISPONIBLE';
                    return (
                      <button key={t.id} type="button" onClick={() => setTecnicoReasignar(t.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${tecnicoReasignar === t.id ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-[#d1ddd6] hover:border-amber-300'} ${!esDisponible ? 'opacity-60' : ''}`}>
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-[#f0f5f2] flex items-center justify-center text-[#0a4a2d] text-xs font-bold">{t.nombre?.charAt(0)?.toUpperCase()}</div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${presColor[t.estadoPresencia] || 'bg-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{t.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">{presLabel[t.estadoPresencia]}</span>
                            <span className="text-[10px] text-gray-400">•</span>
                            <span className="text-[10px] text-gray-400">{t._count?.ticketsAsignados || 0} tickets activos</span>
                          </div>
                        </div>
                        {tecnicoReasignar === t.id && <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"><span className="text-white text-[10px]">✓</span></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Motivo de la reasignación</label>
                <textarea value={motivoReasignar} onChange={e=>setMotivoReasignar(e.target.value)} rows={3}
                  placeholder="Ej: El técnico actual no se encuentra disponible..."
                  className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] resize-none"/>
              </div>

              <div className="flex gap-3">
                <button onClick={()=>setReasignarModal(null)} className="flex-1 py-2.5 border border-[#d1ddd6] rounded-lg text-sm font-medium text-gray-600 hover:bg-[#f0f5f2]">Cancelar</button>
                <button onClick={procesarReasignar} disabled={!tecnicoReasignar||guardando} className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {guardando && <Loader2 className="animate-spin" size={16}/>} Reasignar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERRAR con diagnóstico */}
      {cerrarModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setCerrarModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="bg-[#0a4a2d] px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-[#f9f7d9] font-bold">Cerrar ticket</h3>
                <p className="text-[#08ae62] text-xs mt-1">{cerrarModal.codigoTicket}</p>
              </div>
              <button onClick={()=>setCerrarModal(null)}><X size={20} className="text-white/60"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#f0f5f2] rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Solicitante:</span> <span className="font-medium">{cerrarModal.nombreSolicitante}</span></div>
                <div><span className="text-gray-400">Oficina:</span> <span className="font-medium">{cerrarModal.oficina?.nombre}</span></div>
                <div><span className="text-gray-400">Técnico:</span> <span className="font-medium">{cerrarModal.tecnico?.nombre||'N/A'}</span></div>
                <div><span className="text-gray-400">Tipo falla:</span> <span className="font-medium">{cerrarModal.tipoFalla?.nombre}</span></div>
              </div>
              {cerrarModal.diagnostico ? (
                <div className="bg-[#f9f7d9]/30 border border-[#f9f7d9] rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2 flex items-center gap-2"><ClipboardList size={14}/> Diagnóstico del técnico</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div><span className="text-gray-400">Tipo equipo:</span> <span className="font-medium">{cerrarModal.diagnostico.tipoEquipo?.replace('_',' ')}</span></div>
                    <div><span className="text-gray-400">Marca:</span> <span className="font-medium">{cerrarModal.diagnostico.marca}</span></div>
                    <div><span className="text-gray-400">Modelo:</span> <span className="font-medium">{cerrarModal.diagnostico.modelo}</span></div>
                    <div><span className="text-gray-400">Serial:</span> <span className="font-medium">{cerrarModal.diagnostico.serial}</span></div>
                  </div>
                  <div className="text-xs mb-2"><span className="text-gray-400">Observaciones:</span><p className="mt-1 text-gray-700 bg-white/60 rounded p-2">{cerrarModal.diagnostico.observaciones}</p></div>
                  {cerrarModal.diagnostico.fotoEvidencia && (
                    <div>
                      <span className="text-gray-400 text-xs flex items-center gap-1 mb-1"><ImageIcon size={12}/> Evidencia fotográfica:</span>
                      <img src={fotoURL(cerrarModal.diagnostico.fotoEvidencia)} alt="Evidencia" className="w-full max-h-48 object-cover rounded-lg border border-[#d1ddd6] cursor-pointer"
                        onClick={()=>window.open(fotoURL(cerrarModal.diagnostico.fotoEvidencia),'_blank')}/>
                    </div>
                  )}
                </div>
              ) : <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">No se encontró diagnóstico técnico.</div>}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Observación de cierre (opcional)</label>
                <textarea value={observacionCierre} onChange={e=>setObservacionCierre(e.target.value)} rows={3}
                  placeholder="Confirmar que la solución fue verificada..."
                  className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] resize-none"/>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setCerrarModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button onClick={cerrarTicket} className="flex-1 py-2.5 bg-[#0a4a2d] text-white rounded-lg text-sm font-medium hover:bg-[#08ae62] flex items-center justify-center gap-2">
                  <CheckCircle size={16}/> Cerrar ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR historial del ticket cerrado */}
      {visualizarModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setVisualizarModal(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold flex items-center gap-2"><Eye size={18}/> Historial del ticket</h3>
                <p className="text-gray-200 text-xs mt-1 font-mono">{visualizarModal.codigoTicket}</p>
              </div>
              <button onClick={()=>setVisualizarModal(null)}><X size={20} className="text-white/60"/></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Info general */}
              <div className="bg-[#f0f5f2] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2">Información general</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Solicitante:</span> <span className="font-medium">{visualizarModal.nombreSolicitante}</span></div>
                  <div><span className="text-gray-400">Correo:</span> <span className="font-medium">{visualizarModal.correoSolicitante}</span></div>
                  <div><span className="text-gray-400">Celular:</span> <span className="font-medium">{visualizarModal.celularSolicitante}</span></div>
                  <div><span className="text-gray-400">Oficina:</span> <span className="font-medium">{visualizarModal.oficina?.nombre}</span></div>
                  <div><span className="text-gray-400">Tipo falla:</span> <span className="font-medium">{visualizarModal.tipoFalla?.nombre}</span></div>
                  <div><span className="text-gray-400">Prioridad:</span> <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${prioridadBadge[visualizarModal.prioridad]}`}>{visualizarModal.prioridad}</span></div>
                  <div><span className="text-gray-400">Técnico:</span> <span className="font-medium">{visualizarModal.tecnico?.nombre||'N/A'}</span></div>
                  <div><span className="text-gray-400">Estado:</span> <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge[visualizarModal.estado]}`}>CERRADO</span></div>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white border border-[#d1ddd6] rounded-lg p-3">
                  <p className="text-gray-400">Creación</p>
                  <p className="font-medium text-[#0a4a2d]">{fmt(visualizarModal.fechaCreacion)}</p>
                </div>
                <div className="bg-white border border-[#d1ddd6] rounded-lg p-3">
                  <p className="text-gray-400">Asignación</p>
                  <p className="font-medium text-[#0a4a2d]">{fmt(visualizarModal.fechaAsignacion)}</p>
                </div>
                <div className="bg-white border border-[#d1ddd6] rounded-lg p-3">
                  <p className="text-gray-400">Resolución</p>
                  <p className="font-medium text-[#0a4a2d]">{fmt(visualizarModal.fechaResolucion)}</p>
                </div>
                <div className="bg-white border border-[#d1ddd6] rounded-lg p-3">
                  <p className="text-gray-400">Cierre</p>
                  <p className="font-medium text-[#0a4a2d]">{fmt(visualizarModal.fechaCierre)}</p>
                </div>
              </div>

              {visualizarModal.descripcion && (
                <div className="bg-[#f0f5f2] rounded-lg p-3">
                  <span className="text-gray-400 text-xs">Descripción original del problema</span>
                  <p className="text-sm mt-1">{visualizarModal.descripcion}</p>
                </div>
              )}

              {/* Diagnóstico */}
              {visualizarModal.diagnostico && (
                <div className="bg-[#f9f7d9]/30 border border-[#f9f7d9] rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2 flex items-center gap-2"><ClipboardList size={14}/> Diagnóstico técnico</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div><span className="text-gray-400">Tipo equipo:</span> <span className="font-medium">{visualizarModal.diagnostico.tipoEquipo?.replace('_',' ')}</span></div>
                    <div><span className="text-gray-400">Marca:</span> <span className="font-medium">{visualizarModal.diagnostico.marca}</span></div>
                    <div><span className="text-gray-400">Modelo:</span> <span className="font-medium">{visualizarModal.diagnostico.modelo}</span></div>
                    <div><span className="text-gray-400">Serial:</span> <span className="font-medium">{visualizarModal.diagnostico.serial}</span></div>
                  </div>
                  <div className="text-xs"><span className="text-gray-400">Observaciones:</span><p className="mt-1 text-gray-700 bg-white/60 rounded p-2">{visualizarModal.diagnostico.observaciones}</p></div>
                  {visualizarModal.diagnostico.fotoEvidencia && (
                    <div className="mt-3">
                      <span className="text-gray-400 text-xs flex items-center gap-1 mb-1"><ImageIcon size={12}/> Evidencia:</span>
                      <img src={fotoURL(visualizarModal.diagnostico.fotoEvidencia)} alt="Evidencia" className="w-full max-h-64 object-cover rounded-lg border border-[#d1ddd6] cursor-pointer"
                        onClick={()=>window.open(fotoURL(visualizarModal.diagnostico.fotoEvidencia),'_blank')}/>
                    </div>
                  )}
                </div>
              )}

              {/* Historial de cambios */}
              {visualizarModal.historialEstados?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2">Historial de cambios</h4>
                  <div className="space-y-2">
                    {visualizarModal.historialEstados.map((h, i) => (
                      <div key={i} className="bg-white border border-[#d1ddd6] rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge[h.estadoNuevo]}`}>{h.estadoNuevo.replace('_',' ')}</span>
                          <span className="text-gray-400">{fmt(h.fecha)}</span>
                        </div>
                        <p className="text-gray-600">{h.usuario?.nombre} - {h.observacion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comentarios */}
              {visualizarModal.comentarios?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2">Comentarios</h4>
                  <div className="space-y-2">
                    {visualizarModal.comentarios.map((c, i) => (
                      <div key={i} className="bg-[#f0f5f2] rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{c.usuario?.nombre}</span>
                          <span className="text-gray-400">{fmt(c.fecha)}</span>
                        </div>
                        <p className="text-gray-600">{c.contenido}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón descargar PDF */}
              <button onClick={() => descargarPDFTicket(visualizarModal)}
                className="w-full py-3 bg-[#0a4a2d] text-white rounded-lg text-sm font-medium hover:bg-[#08ae62] transition-all flex items-center justify-center gap-2">
                <FileText size={18}/> Descargar historial en PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
