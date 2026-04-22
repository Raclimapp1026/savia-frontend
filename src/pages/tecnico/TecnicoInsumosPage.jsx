import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, PackageMinus, Search, X, FileText, Droplets } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TecnicoInsumosPage() {
  const { usuario } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [salidaModal, setSalidaModal] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [form, setForm] = useState({ cantidad: 1, oficina: '', observacion: '', nombreRecibe: '', cargoRecibe: '' });
  const firmaTecnicoRef = useRef(null);
  const firmaRecibeRef = useRef(null);
  const [firmaTecnicoData, setFirmaTecnicoData] = useState(null);
  const [firmaRecibeData, setFirmaRecibeData] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const params = {};
      if (busqueda) params.busqueda = busqueda;
      const { data } = await api.get('/insumos', { params });
      setInsumos(data);
    } catch { toast.error('Error cargando insumos'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  // ===== FIRMA CANVAS =====
  const setupCanvas = (canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0a4a2d';

    let drawing = false;
    let lastX = 0, lastY = 0;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const start = (e) => { e.preventDefault(); drawing = true; const p = getPos(e); lastX = p.x; lastY = p.y; };
    const move = (e) => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); lastX = p.x; lastY = p.y; };
    const end = () => { drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('mouseleave', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
    };
  };

  useEffect(() => {
    if (salidaModal) {
      setTimeout(() => {
        if (firmaTecnicoRef.current) setupCanvas(firmaTecnicoRef);
        if (firmaRecibeRef.current) setupCanvas(firmaRecibeRef);
      }, 100);
    }
  }, [salidaModal]);

  const limpiarFirma = (canvasRef, setData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setData(null);
  };

  const capturarFirma = (canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  };

  const abrirSalida = (insumo) => {
    setSalidaModal(insumo);
    setForm({ cantidad: 1, oficina: '', observacion: '', nombreRecibe: '', cargoRecibe: '' });
    setFirmaTecnicoData(null);
    setFirmaRecibeData(null);
  };

  const registrarSalida = async (e) => {
    e.preventDefault();
    if (!salidaModal) return;

    const ft = capturarFirma(firmaTecnicoRef);
    const fr = capturarFirma(firmaRecibeRef);

    if (!form.nombreRecibe.trim()) { toast.error('El nombre de quien recibe es obligatorio'); return; }
    if (!form.oficina.trim()) { toast.error('La oficina destino es obligatoria'); return; }

    setGuardando(true);
    try {
      const payload = {
        tipo: 'SALIDA',
        cantidad: parseInt(form.cantidad),
        oficina: form.oficina,
        observacion: form.observacion || undefined,
        nombreRecibe: form.nombreRecibe,
        cargoRecibe: form.cargoRecibe || undefined,
        firmaTecnico: ft || undefined,
        firmaRecibe: fr || undefined,
      };

      const { data: resultado } = await api.post(`/insumos/${salidaModal.id}/movimiento`, payload);

      if (resultado.alertaStockBajo) {
        toast(resultado.mensaje, { icon: '⚠️', duration: 5000 });
      } else {
        toast.success('Salida registrada');
      }

      // Guardar datos antes de cerrar modal
      const insumoData = { ...salidaModal };
      const formData = { ...form };

      // Generar PDF de evidencia ANTES de cerrar el modal
      generarPDFSalida(insumoData, resultado.movimiento, ft, fr, formData);

      setSalidaModal(null);
      cargar();
    } catch (error) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error');
    } finally { setGuardando(false); }
  };

  const generarPDFSalida = (insumo, movimiento, firmaTec, firmaRec, formData) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();

    // Header SAVIA
    doc.setFillColor(10, 74, 45);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(249, 247, 217);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SAVIA', 14, 13);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(8, 174, 98);
    doc.text('Sistema de atencion vital e integral de asistencia', 14, 19);
    doc.setTextColor(255, 255, 255);
    doc.text('Alcaldia de Puerto Colombia - Oficina TIC', pw - 14, 13, { align: 'right' });

    // Titulo
    doc.setTextColor(10, 74, 45);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprobante de entrega de insumo', 14, 38);

    doc.setDrawColor(8, 174, 98);
    doc.setLineWidth(0.5);
    doc.line(14, 41, pw - 14, 41);

    // Fecha y hora
    const fechaHora = new Date(movimiento.fecha).toLocaleString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Fecha y hora: ${fechaHora}`, 14, 48);

    // Info del insumo
    autoTable(doc, {
      startY: 54,
      body: [
        ['Codigo insumo', insumo.codigo, 'Tipo', insumo.tipoInsumo],
        ['Marca', insumo.marca, 'Modelo/Ref', insumo.modelo],
        ['Color', insumo.color, 'Cantidad entregada', String(movimiento.cantidad)],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 245, 242], cellWidth: 35 },
        2: { fontStyle: 'bold', fillColor: [240, 245, 242], cellWidth: 35 },
      },
    });

    let y = doc.lastAutoTable.finalY + 8;

    // Info entrega
    autoTable(doc, {
      startY: y,
      body: [
        ['Tecnico que entrega', usuario?.nombre || movimiento.usuario?.nombre || ''],
        ['Oficina destino', movimiento.oficina || ''],
        ['Nombre de quien recibe', movimiento.nombreRecibe || formData.nombreRecibe],
        ['Cargo', movimiento.cargoRecibe || formData.cargoRecibe || ''],
        ['Observacion', movimiento.observacion || 'N/A'],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [249, 247, 217], cellWidth: 45 },
      },
    });

    y = doc.lastAutoTable.finalY + 15;

    // Firmas
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 74, 45);
    doc.text('Firmas', 14, y);
    y += 8;

    const firmaWidth = 70;
    const firmaHeight = 35;
    const leftX = 30;
    const rightX = pw - 30 - firmaWidth;

    // Firma técnico
    doc.setDrawColor(200, 200, 200);
    doc.rect(leftX, y, firmaWidth, firmaHeight);
    if (firmaTec) {
      try { doc.addImage(firmaTec, 'PNG', leftX + 2, y + 2, firmaWidth - 4, firmaHeight - 4); } catch {}
    }
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.line(leftX, y + firmaHeight + 3, leftX + firmaWidth, y + firmaHeight + 3);
    doc.text('Firma del tecnico', leftX + firmaWidth / 2, y + firmaHeight + 8, { align: 'center' });
    doc.text(usuario?.nombre || '', leftX + firmaWidth / 2, y + firmaHeight + 13, { align: 'center' });

    // Firma quien recibe
    doc.rect(rightX, y, firmaWidth, firmaHeight);
    if (firmaRec) {
      try { doc.addImage(firmaRec, 'PNG', rightX + 2, y + 2, firmaWidth - 4, firmaHeight - 4); } catch {}
    }
    doc.line(rightX, y + firmaHeight + 3, rightX + firmaWidth, y + firmaHeight + 3);
    doc.text('Firma de quien recibe', rightX + firmaWidth / 2, y + firmaHeight + 8, { align: 'center' });
    doc.text(formData.nombreRecibe || movimiento.nombreRecibe || '', rightX + firmaWidth / 2, y + firmaHeight + 13, { align: 'center' });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('SAVIA - Alcaldia de Puerto Colombia - Oficina TIC', 14, doc.internal.pageSize.getHeight() - 8);
    doc.text('Documento generado automaticamente', pw - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });

    doc.save(`Entrega_${insumo.codigo}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF de evidencia descargado');
  };

  const COLORES_TIPO = { TINTA: 'bg-blue-100 text-blue-700', TONER: 'bg-purple-100 text-purple-700' };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#0a4a2d]">Insumos disponibles</h1>

      {/* Busqueda */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] p-4">
        <form onSubmit={(e) => { e.preventDefault(); cargar(); }} className="flex gap-3 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por código, marca, modelo..."
                className="w-full pl-9 pr-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d]">Buscar</button>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
        {cargando ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#08ae62]" size={28} /></div>
          : insumos.length === 0 ? <div className="text-center py-16 text-gray-400 text-sm">No hay insumos disponibles</div>
          : <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#d1ddd6] bg-[#f0f5f2]/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Código</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Marca / Modelo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Color</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Acción</th>
              </tr></thead>
              <tbody>
                {insumos.map(i => (
                  <tr key={i.id} className={`border-b border-gray-50 hover:bg-[#f0f5f2]/30 ${i.stockActual <= i.stockMinimo ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#0a4a2d]">{i.codigo}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${COLORES_TIPO[i.tipoInsumo]}`}>{i.tipoInsumo}</span></td>
                    <td className="px-4 py-3"><p className="text-xs font-medium text-gray-700">{i.marca}</p><p className="text-[11px] text-gray-400">{i.modelo}</p></td>
                    <td className="px-4 py-3 text-xs">{i.color}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-lg font-bold ${i.stockActual <= i.stockMinimo ? 'text-red-600' : 'text-[#0a4a2d]'}`}>{i.stockActual}</span>
                      {i.stockActual <= i.stockMinimo && <p className="text-[10px] text-red-500">BAJO</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {i.stockActual > 0 ? (
                        <button onClick={() => abrirSalida(i)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 flex items-center gap-1 mx-auto">
                          <PackageMinus size={12} /> Registrar salida
                        </button>
                      ) : (
                        <span className="text-xs text-red-500">Sin stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>

      {/* MODAL SALIDA CON FIRMAS */}
      {salidaModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSalidaModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-orange-500 px-6 py-4 rounded-t-xl flex items-center justify-between z-10">
              <div>
                <h3 className="text-white font-bold flex items-center gap-2"><PackageMinus size={18} /> Registrar salida</h3>
                <p className="text-orange-100 text-xs mt-1">{salidaModal.codigo} - {salidaModal.marca} {salidaModal.modelo} ({salidaModal.color})</p>
              </div>
              <button onClick={() => setSalidaModal(null)}><X size={20} className="text-white/60" /></button>
            </div>

            <div className="p-5">
              <div className="bg-[#f0f5f2] rounded-lg p-3 mb-4 text-center">
                <p className="text-xs text-gray-500">Stock disponible</p>
                <p className="text-3xl font-bold text-[#0a4a2d]">{salidaModal.stockActual}</p>
              </div>

              <form onSubmit={registrarSalida} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad <span className="text-red-500">*</span></label>
                    <input type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} min="1" max={salidaModal.stockActual} required
                      className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Oficina destino <span className="text-red-500">*</span></label>
                    <input type="text" value={form.oficina} onChange={e => setForm({ ...form, oficina: e.target.value })} required placeholder="Ej: Secretaría General"
                      className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de quien recibe <span className="text-red-500">*</span></label>
                    <input type="text" value={form.nombreRecibe} onChange={e => setForm({ ...form, nombreRecibe: e.target.value })} required
                      className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cargo</label>
                    <input type="text" value={form.cargoRecibe} onChange={e => setForm({ ...form, cargoRecibe: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Observación</label>
                  <textarea value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} rows={2}
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] resize-none" />
                </div>

                {/* FIRMA TÉCNICO */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Firma del técnico</label>
                    <button type="button" onClick={() => limpiarFirma(firmaTecnicoRef, setFirmaTecnicoData)} className="text-[10px] text-red-500 hover:underline">Limpiar</button>
                  </div>
                  <canvas ref={firmaTecnicoRef} width={340} height={100}
                    className="w-full border border-[#d1ddd6] rounded-lg bg-white cursor-crosshair touch-none"
                    style={{ height: '100px' }} />
                </div>

                {/* FIRMA QUIEN RECIBE */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Firma de quien recibe</label>
                    <button type="button" onClick={() => limpiarFirma(firmaRecibeRef, setFirmaRecibeData)} className="text-[10px] text-red-500 hover:underline">Limpiar</button>
                  </div>
                  <canvas ref={firmaRecibeRef} width={340} height={100}
                    className="w-full border border-[#d1ddd6] rounded-lg bg-white cursor-crosshair touch-none"
                    style={{ height: '100px' }} />
                </div>

                <button type="submit" disabled={guardando}
                  className="w-full py-3 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {guardando ? <Loader2 className="animate-spin" size={16} /> : <><PackageMinus size={16} /> Registrar salida y descargar PDF</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
