import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, MessageSquare, Play, CheckCircle, X, Send, Clock, Building2, ClipboardList, Camera, Image as ImageIcon, Eye, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const estadoBadge = { ASIGNADO:'bg-yellow-100 text-yellow-700', EN_PROCESO:'bg-orange-100 text-orange-700', RESUELTO:'bg-green-100 text-green-700', CERRADO:'bg-gray-100 text-gray-600' };
const prioridadBadge = { BAJA:'bg-green-100 text-green-700', MEDIA:'bg-yellow-100 text-yellow-700', ALTA:'bg-orange-100 text-orange-700', CRITICA:'bg-red-100 text-red-700' };

const TIPOS_EQUIPO = [
  { value: 'PORTATIL', label: 'Portátil' },
  { value: 'EQUIPO_MESA', label: 'Equipo de mesa' },
  { value: 'IMPRESORA', label: 'Impresora' },
  { value: 'IMPRESORA_MULTIFUNCIONAL', label: 'Impresora multifuncional' },
  { value: 'TELEFONO_IP', label: 'Teléfono IP' },
  { value: 'NO_APLICA', label: 'No aplica' },
];

export default function MisTicketsPage() {
  const { usuario } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ticketDetalle, setTicketDetalle] = useState(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resolviendo, setResolviendo] = useState(null);
  const [diagnostico, setDiagnostico] = useState({ tipoEquipo:'', marca:'', modelo:'', serial:'', observaciones:'' });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [enviandoDiagnostico, setEnviandoDiagnostico] = useState(false);
  const [visualizarModal, setVisualizarModal] = useState(null);
  const fileInputRef = useRef(null);

  const cargar = async () => { setCargando(true); try { const {data}=await api.get('/tickets/mis-tickets'); setTickets(data.data); } catch{toast.error('Error');} finally{setCargando(false);} };
  useEffect(() => { cargar(); }, []);

  const verDetalle = async (id) => { try { const {data}=await api.get(`/tickets/${id}`); setTicketDetalle(data); } catch{toast.error('Error');} };

  const abrirVisualizar = async (ticket) => {
    try { const {data}=await api.get(`/tickets/${ticket.id}`); setVisualizarModal(data); } catch{toast.error('Error cargando historial');}
  };

  const descargarPDFTicket = (ticket) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    let y = 0;
    doc.setFillColor(10,74,45); doc.rect(0,0,pw,28,'F');
    doc.setTextColor(249,247,217); doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.text('SAVIA',14,13);
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(8,174,98); doc.text('Sistema de atencion vital e integral de asistencia',14,19);
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.text('Alcaldia de Puerto Colombia - Oficina TIC', pw-14, 13, {align:'right'});
    y=38; doc.setTextColor(10,74,45); doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text(`Historial del Ticket ${ticket.codigoTicket}`,14,y); y+=4;
    doc.setDrawColor(8,174,98); doc.setLineWidth(0.5); doc.line(14,y,pw-14,y); y+=8;
    doc.setFontSize(11); doc.setTextColor(10,74,45); doc.setFont('helvetica','bold'); doc.text('Informacion general',14,y); y+=5;
    autoTable(doc, { startY:y, body:[
      ['Solicitante',ticket.nombreSolicitante,'Correo',ticket.correoSolicitante],
      ['Celular',ticket.celularSolicitante,'Oficina',ticket.oficina?.nombre||''],
      ['Tipo de falla',ticket.tipoFalla?.nombre||'','Prioridad',ticket.prioridad],
      ['Tecnico',ticket.tecnico?.nombre||'N/A','Estado',ticket.estado?.replace('_',' ')],
    ], theme:'grid', styles:{fontSize:8,cellPadding:3}, columnStyles:{0:{fontStyle:'bold',fillColor:[240,245,242],cellWidth:30},2:{fontStyle:'bold',fillColor:[240,245,242],cellWidth:30}} });
    y=doc.lastAutoTable.finalY+6;
    doc.setFontSize(11); doc.setTextColor(10,74,45); doc.setFont('helvetica','bold'); doc.text('Cronologia',14,y); y+=5;
    autoTable(doc, { startY:y, body:[
      ['Creacion',fmt(ticket.fechaCreacion),'Asignacion',fmt(ticket.fechaAsignacion)],
      ['Resolucion',fmt(ticket.fechaResolucion),'Cierre',fmt(ticket.fechaCierre)],
    ], theme:'grid', styles:{fontSize:8,cellPadding:3}, columnStyles:{0:{fontStyle:'bold',fillColor:[240,245,242],cellWidth:30},2:{fontStyle:'bold',fillColor:[240,245,242],cellWidth:30}} });
    y=doc.lastAutoTable.finalY+6;
    if(ticket.descripcion){ doc.setFontSize(11); doc.setTextColor(10,74,45); doc.setFont('helvetica','bold'); doc.text('Descripcion',14,y); y+=5; doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60); const lines=doc.splitTextToSize(ticket.descripcion,pw-28); doc.text(lines,14,y); y+=lines.length*4.5+6; }
    if(ticket.diagnostico){ doc.setFontSize(11); doc.setTextColor(10,74,45); doc.setFont('helvetica','bold'); doc.text('Diagnostico tecnico',14,y); y+=5;
      autoTable(doc, { startY:y, body:[['Tipo equipo',ticket.diagnostico.tipoEquipo?.replace('_',' '),'Marca',ticket.diagnostico.marca],['Modelo',ticket.diagnostico.modelo,'Serial',ticket.diagnostico.serial]], theme:'grid', styles:{fontSize:8,cellPadding:3}, columnStyles:{0:{fontStyle:'bold',fillColor:[249,247,217],cellWidth:30},2:{fontStyle:'bold',fillColor:[249,247,217],cellWidth:30}} });
      y=doc.lastAutoTable.finalY+4; doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(80,80,80); doc.text('Observaciones:',14,y); y+=4; doc.setFont('helvetica','normal'); const ol=doc.splitTextToSize(ticket.diagnostico.observaciones||'',pw-28); doc.text(ol,14,y); y+=ol.length*4+6;
    }
    if(ticket.historialEstados?.length>0){ if(y>240){doc.addPage();y=20;} doc.setFontSize(11); doc.setTextColor(10,74,45); doc.setFont('helvetica','bold'); doc.text('Historial de cambios',14,y); y+=5;
      autoTable(doc, { startY:y, head:[['Fecha','Estado','Usuario','Observacion']], body:ticket.historialEstados.map(h=>[fmt(h.fecha),h.estadoNuevo?.replace('_',' '),h.usuario?.nombre||'',h.observacion||'']), theme:'grid', styles:{fontSize:7,cellPadding:2}, headStyles:{fillColor:[10,74,45],textColor:[255,255,255]}, alternateRowStyles:{fillColor:[240,245,242]} });
      y=doc.lastAutoTable.finalY+6;
    }
    if(ticket.comentarios?.length>0){ if(y>240){doc.addPage();y=20;} doc.setFontSize(11); doc.setTextColor(10,74,45); doc.setFont('helvetica','bold'); doc.text('Comentarios',14,y); y+=5;
      autoTable(doc, { startY:y, head:[['Fecha','Usuario','Comentario']], body:ticket.comentarios.map(c=>[fmt(c.fecha),c.usuario?.nombre||'',c.contenido||'']), theme:'grid', styles:{fontSize:7,cellPadding:2}, headStyles:{fillColor:[10,74,45],textColor:[255,255,255]}, alternateRowStyles:{fillColor:[240,245,242]} });
    }
    const pc=doc.internal.getNumberOfPages(); for(let i=1;i<=pc;i++){doc.setPage(i);doc.setFontSize(7);doc.setTextColor(150,150,150);doc.text('SAVIA - Alcaldia de Puerto Colombia - Oficina TIC',14,doc.internal.pageSize.getHeight()-8);doc.text(`Pagina ${i} de ${pc}`,pw-14,doc.internal.pageSize.getHeight()-8,{align:'right'});}
    doc.save(`Ticket_${ticket.codigoTicket}.pdf`); toast.success('PDF descargado');
  };

  const cambiarEstado = async (ticketId, nuevoEstado, obs='') => {
    try { await api.put(`/tickets/${ticketId}/estado`,{estado:nuevoEstado,observacion:obs}); toast.success(`Cambiado a ${nuevoEstado.replace('_',' ')}`); cargar(); if(ticketDetalle)verDetalle(ticketId); }
    catch(error){toast.error(error.response?.data?.message||'Error');}
  };

  const abrirFormularioResolver = (ticket) => {
    setResolviendo(ticket);
    setDiagnostico({ tipoEquipo:'', marca:'', modelo:'', serial:'', observaciones:'' });
    setFoto(null); setFotoPreview(null);
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no debe superar 5MB'); return; }
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) { toast.error('Solo JPG, PNG o WebP'); return; }
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const enviarDiagnostico = async (e) => {
    e.preventDefault(); if (!resolviendo) return;
    setEnviandoDiagnostico(true);
    try {
      const formData = new FormData();
      formData.append('tipoEquipo', diagnostico.tipoEquipo);
      formData.append('marca', diagnostico.marca);
      formData.append('modelo', diagnostico.modelo);
      formData.append('serial', diagnostico.serial);
      formData.append('observaciones', diagnostico.observaciones);
      if (foto) formData.append('foto', foto);

      await api.put(`/tickets/${resolviendo.id}/resolver`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Ticket resuelto con diagnóstico registrado');
      setResolviendo(null); setFoto(null); setFotoPreview(null);
      cargar(); if (ticketDetalle) verDetalle(resolviendo.id);
    } catch (error) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al resolver');
    } finally { setEnviandoDiagnostico(false); }
  };

  const enviarComentario = async () => {
    if(!comentario.trim()||!ticketDetalle)return; setEnviando(true);
    try { await api.post('/comentarios',{ticketId:ticketDetalle.id,contenido:comentario}); toast.success('Comentario agregado'); setComentario(''); verDetalle(ticketDetalle.id); }
    catch{toast.error('Error');} finally{setEnviando(false);}
  };

  const fmt = (f) => f ? new Date(f).toLocaleString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
  const fotoURL = (path) => {
    if (!path) return null;
    const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    return `${base}${path}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#0a4a2d]">Mis tickets asignados</h1>

      {cargando ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#08ae62]" size={28}/></div>
      : tickets.length===0 ? <div className="bg-white rounded-xl border border-[#d1ddd6] p-16 text-center text-gray-400">No tienes tickets asignados.</div>
      : <div className="grid gap-3">
        {tickets.map(t=>(
          <div key={t.id} className="bg-white rounded-xl border border-[#d1ddd6] p-4 hover:border-[#08ae62]/50 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-sm font-bold text-[#0a4a2d]">{t.codigoTicket}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${estadoBadge[t.estado]}`}>{t.estado.replace('_',' ')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${prioridadBadge[t.prioridad]}`}>{t.prioridad}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">{t.nombreSolicitante}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Building2 size={12}/>{t.oficina?.nombre}</span>
                  <span className="flex items-center gap-1"><Clock size={12}/>{fmt(t.fechaCreacion)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.tipoFalla?.nombre}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {t.estado==='ASIGNADO' && <button onClick={()=>cambiarEstado(t.id,'EN_PROCESO','Ticket tomado')} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 flex items-center gap-1"><Play size={12}/> Iniciar</button>}
                {t.estado==='EN_PROCESO' && <button onClick={()=>abrirFormularioResolver(t)} className="px-3 py-1.5 bg-[#08ae62] text-white rounded-lg text-xs font-medium hover:bg-[#0a4a2d] flex items-center gap-1"><CheckCircle size={12}/> Resolver</button>}
                {(t.estado==='RESUELTO' || t.estado==='CERRADO') && <button onClick={()=>abrirVisualizar(t)} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 flex items-center gap-1"><Eye size={12}/> Visualizar</button>}
                <button onClick={()=>verDetalle(t.id)} className="px-3 py-1.5 border border-[#d1ddd6] rounded-lg text-xs font-medium text-gray-600 hover:bg-[#f0f5f2] flex items-center gap-1"><MessageSquare size={12}/> Detalle</button>
              </div>
            </div>
          </div>
        ))}
      </div>}

      {/* MODAL DIAGNÓSTICO CON FOTO */}
      {resolviendo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setResolviendo(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0a4a2d] px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[#f9f7d9] font-bold flex items-center gap-2"><ClipboardList size={18}/> Diagnóstico técnico</h3>
                  <p className="text-[#08ae62] text-xs mt-1">Ticket {resolviendo.codigoTicket}</p>
                </div>
                <button onClick={()=>setResolviendo(null)}><X size={20} className="text-white/60"/></button>
              </div>
            </div>
            <div className="p-5 bg-[#f0f5f2] border-b border-[#d1ddd6]">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Solicitante:</span> <span className="font-medium">{resolviendo.nombreSolicitante}</span></div>
                <div><span className="text-gray-400">Oficina:</span> <span className="font-medium">{resolviendo.oficina?.nombre}</span></div>
                <div><span className="text-gray-400">Tipo falla:</span> <span className="font-medium">{resolviendo.tipoFalla?.nombre}</span></div>
                <div><span className="text-gray-400">Prioridad:</span> <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${prioridadBadge[resolviendo.prioridad]}`}>{resolviendo.prioridad}</span></div>
              </div>
            </div>
            <form onSubmit={enviarDiagnostico} className="p-5 space-y-4">
              <p className="text-sm font-semibold text-[#0a4a2d]">Complete para resolver el ticket</p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de equipo <span className="text-red-500">*</span></label>
                <select value={diagnostico.tipoEquipo} onChange={e=>setDiagnostico({...diagnostico,tipoEquipo:e.target.value})} required className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]">
                  <option value="">Seleccione...</option>
                  {TIPOS_EQUIPO.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Marca <span className="text-red-500">*</span></label>
                  <input type="text" value={diagnostico.marca} onChange={e=>setDiagnostico({...diagnostico,marca:e.target.value})} required placeholder="Ej: HP, Lenovo" className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Modelo <span className="text-red-500">*</span></label>
                  <input type="text" value={diagnostico.modelo} onChange={e=>setDiagnostico({...diagnostico,modelo:e.target.value})} required placeholder="Ej: LaserJet Pro" className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Serial del equipo <span className="text-red-500">*</span></label>
                <input type="text" value={diagnostico.serial} onChange={e=>setDiagnostico({...diagnostico,serial:e.target.value})} required placeholder="Placa o serial" className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Observaciones <span className="text-red-500">*</span></label>
                <textarea value={diagnostico.observaciones} onChange={e=>setDiagnostico({...diagnostico,observaciones:e.target.value})} required rows={3} placeholder="Soporte realizado y solución aplicada..." className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] resize-none"/></div>

              {/* FOTO DE EVIDENCIA */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Foto de evidencia <span className="text-gray-400">(opcional, máx 5MB)</span></label>
                <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" onChange={handleFoto} className="hidden" />
                {fotoPreview ? (
                  <div className="relative">
                    <img src={fotoPreview} alt="Evidencia" className="w-full h-40 object-cover rounded-lg border border-[#d1ddd6]" />
                    <button type="button" onClick={()=>{setFoto(null);setFotoPreview(null);if(fileInputRef.current)fileInputRef.current.value='';}}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X size={14}/></button>
                  </div>
                ) : (
                  <button type="button" onClick={()=>fileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-[#d1ddd6] rounded-lg text-center hover:border-[#08ae62] hover:bg-[#f0f5f2] transition-all">
                    <Camera className="mx-auto text-gray-400 mb-2" size={24}/>
                    <p className="text-xs text-gray-500">Toca para tomar o seleccionar foto</p>
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setResolviendo(null)} className="flex-1 py-2.5 border border-[#d1ddd6] rounded-lg text-sm font-medium text-gray-600 hover:bg-[#f0f5f2]">Cancelar</button>
                <button type="submit" disabled={enviandoDiagnostico} className="flex-1 py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center justify-center gap-2">
                  {enviandoDiagnostico ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Resolver ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {ticketDetalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setTicketDetalle(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#d1ddd6] px-6 py-4 flex items-center justify-between">
              <div><span className="font-mono font-bold text-[#0a4a2d]">{ticketDetalle.codigoTicket}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${estadoBadge[ticketDetalle.estado]}`}>{ticketDetalle.estado.replace('_',' ')}</span></div>
              <button onClick={()=>setTicketDetalle(null)}><X size={20} className="text-gray-400"/></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400 text-xs">Solicitante</span><p className="font-medium">{ticketDetalle.nombreSolicitante}</p></div>
                <div><span className="text-gray-400 text-xs">Oficina</span><p>{ticketDetalle.oficina?.nombre}</p></div>
                <div><span className="text-gray-400 text-xs">Tipo de falla</span><p>{ticketDetalle.tipoFalla?.nombre}</p></div>
                <div><span className="text-gray-400 text-xs">Prioridad</span><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${prioridadBadge[ticketDetalle.prioridad]}`}>{ticketDetalle.prioridad}</span></div>
              </div>
              {ticketDetalle.descripcion && <div className="bg-[#f0f5f2] rounded-lg p-3"><span className="text-gray-400 text-xs">Descripción</span><p className="text-sm mt-1">{ticketDetalle.descripcion}</p></div>}

              {ticketDetalle.diagnostico && (
                <div className="bg-[#f9f7d9]/30 border border-[#f9f7d9] rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2 flex items-center gap-2"><ClipboardList size={14}/> Diagnóstico técnico</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400">Tipo equipo:</span> <span className="font-medium">{ticketDetalle.diagnostico.tipoEquipo?.replace('_',' ')}</span></div>
                    <div><span className="text-gray-400">Marca:</span> <span className="font-medium">{ticketDetalle.diagnostico.marca}</span></div>
                    <div><span className="text-gray-400">Modelo:</span> <span className="font-medium">{ticketDetalle.diagnostico.modelo}</span></div>
                    <div><span className="text-gray-400">Serial:</span> <span className="font-medium">{ticketDetalle.diagnostico.serial}</span></div>
                  </div>
                  <div className="mt-2 text-xs"><span className="text-gray-400">Observaciones:</span><p className="mt-1 text-gray-700">{ticketDetalle.diagnostico.observaciones}</p></div>
                  {ticketDetalle.diagnostico.fotoEvidencia && (
                    <div className="mt-3">
                      <span className="text-gray-400 text-xs flex items-center gap-1 mb-1"><ImageIcon size={12}/> Evidencia fotográfica:</span>
                      <img src={fotoURL(ticketDetalle.diagnostico.fotoEvidencia)} alt="Evidencia" className="w-full max-h-48 object-cover rounded-lg border border-[#d1ddd6] cursor-pointer"
                        onClick={()=>window.open(fotoURL(ticketDetalle.diagnostico.fotoEvidencia),'_blank')} />
                    </div>
                  )}
                </div>
              )}

              {ticketDetalle.historialEstados?.length>0 && <div><h4 className="text-sm font-medium text-gray-700 mb-2">Historial</h4>
                <div className="space-y-2">{ticketDetalle.historialEstados.map((h,i)=><div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400 w-28 flex-shrink-0">{fmt(h.fecha)}</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${estadoBadge[h.estadoNuevo]}`}>{h.estadoNuevo.replace('_',' ')}</span>
                  <span className="text-gray-400">{h.usuario?.nombre}</span>
                </div>)}</div></div>}

              <div><h4 className="text-sm font-medium text-gray-700 mb-2">Comentarios</h4>
                {ticketDetalle.comentarios?.length>0 ? <div className="space-y-2 max-h-48 overflow-y-auto">{ticketDetalle.comentarios.map((c,i)=>
                  <div key={i} className="bg-[#f0f5f2] rounded-lg p-3"><div className="flex justify-between mb-1"><span className="text-xs font-medium">{c.usuario?.nombre}</span><span className="text-xs text-gray-400">{fmt(c.fecha)}</span></div><p className="text-xs text-gray-600">{c.contenido}</p></div>
                )}</div> : <p className="text-xs text-gray-400">Sin comentarios.</p>}
                {ticketDetalle.estado!=='CERRADO' && <div className="flex gap-2 mt-3">
                  <input value={comentario} onChange={e=>setComentario(e.target.value)} placeholder="Escribir comentario..." onKeyDown={e=>e.key==='Enter'&&enviarComentario()}
                    className="flex-1 px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
                  <button onClick={enviarComentario} disabled={!comentario.trim()||enviando} className="px-3 py-2 bg-[#08ae62] text-white rounded-lg hover:bg-[#0a4a2d] disabled:opacity-50">
                    {enviando ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                  </button>
                </div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR HISTORIAL */}
      {visualizarModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setVisualizarModal(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-white font-bold flex items-center gap-2"><Eye size={18}/> Historial del ticket</h3>
                <p className="text-gray-200 text-xs mt-1 font-mono">{visualizarModal.codigoTicket}</p>
              </div>
              <button onClick={()=>setVisualizarModal(null)}><X size={20} className="text-white/60"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#f0f5f2] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2">Información general</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Solicitante:</span> <span className="font-medium">{visualizarModal.nombreSolicitante}</span></div>
                  <div><span className="text-gray-400">Correo:</span> <span className="font-medium">{visualizarModal.correoSolicitante}</span></div>
                  <div><span className="text-gray-400">Oficina:</span> <span className="font-medium">{visualizarModal.oficina?.nombre}</span></div>
                  <div><span className="text-gray-400">Tipo falla:</span> <span className="font-medium">{visualizarModal.tipoFalla?.nombre}</span></div>
                  <div><span className="text-gray-400">Prioridad:</span> <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${prioridadBadge[visualizarModal.prioridad]}`}>{visualizarModal.prioridad}</span></div>
                  <div><span className="text-gray-400">Estado:</span> <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge[visualizarModal.estado]}`}>{visualizarModal.estado?.replace('_',' ')}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white border border-[#d1ddd6] rounded-lg p-3"><p className="text-gray-400">Creación</p><p className="font-medium text-[#0a4a2d]">{fmt(visualizarModal.fechaCreacion)}</p></div>
                <div className="bg-white border border-[#d1ddd6] rounded-lg p-3"><p className="text-gray-400">Asignación</p><p className="font-medium text-[#0a4a2d]">{fmt(visualizarModal.fechaAsignacion)}</p></div>
                <div className="bg-white border border-[#d1ddd6] rounded-lg p-3"><p className="text-gray-400">Resolución</p><p className="font-medium text-[#0a4a2d]">{fmt(visualizarModal.fechaResolucion)}</p></div>
                <div className="bg-white border border-[#d1ddd6] rounded-lg p-3"><p className="text-gray-400">Cierre</p><p className="font-medium text-[#0a4a2d]">{fmt(visualizarModal.fechaCierre)}</p></div>
              </div>

              {visualizarModal.descripcion && (
                <div className="bg-[#f0f5f2] rounded-lg p-3">
                  <span className="text-gray-400 text-xs">Descripción del problema</span>
                  <p className="text-sm mt-1">{visualizarModal.descripcion}</p>
                </div>
              )}

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
                      <img src={fotoURL(visualizarModal.diagnostico.fotoEvidencia)} alt="Evidencia" className="w-full max-h-48 object-cover rounded-lg border border-[#d1ddd6] cursor-pointer"
                        onClick={()=>window.open(fotoURL(visualizarModal.diagnostico.fotoEvidencia),'_blank')}/>
                    </div>
                  )}
                </div>
              )}

              {visualizarModal.historialEstados?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2">Historial de cambios</h4>
                  <div className="space-y-2">{visualizarModal.historialEstados.map((h,i)=>(
                    <div key={i} className="bg-white border border-[#d1ddd6] rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge[h.estadoNuevo]}`}>{h.estadoNuevo?.replace('_',' ')}</span>
                        <span className="text-gray-400">{fmt(h.fecha)}</span>
                      </div>
                      <p className="text-gray-600">{h.usuario?.nombre} - {h.observacion}</p>
                    </div>
                  ))}</div>
                </div>
              )}

              {visualizarModal.comentarios?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#0a4a2d] mb-2">Comentarios</h4>
                  <div className="space-y-2">{visualizarModal.comentarios.map((c,i)=>(
                    <div key={i} className="bg-[#f0f5f2] rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between mb-1"><span className="font-medium">{c.usuario?.nombre}</span><span className="text-gray-400">{fmt(c.fecha)}</span></div>
                      <p className="text-gray-600">{c.contenido}</p>
                    </div>
                  ))}</div>
                </div>
              )}

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
