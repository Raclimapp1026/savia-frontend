import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Plus, Loader2, Pencil, QrCode, X, Download } from 'lucide-react';
import { descargarQR, generarQRDataURL } from '../../utils/qr';

export default function OficinasPage() {
  const [oficinas, setOficinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre: '', ubicacion: '' });
  const [qrPreview, setQrPreview] = useState(null);
  const [qrData, setQrData] = useState('');

  const cargar = async () => {
    setCargando(true);
    try { const { data } = await api.get('/oficinas'); setOficinas(data); }
    catch { toast.error('Error cargando oficinas'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true);
    try {
      if (editando) { await api.put(`/oficinas/${editando.id}`, form); toast.success('Actualizada'); }
      else { await api.post('/oficinas', form); toast.success('Creada'); }
      setModal(false); cargar();
    } catch (error) { toast.error(error.response?.data?.message || 'Error'); }
    finally { setGuardando(false); }
  };

  const verQR = async (oficina) => {
    if (!oficina.codigoQr) { toast.error('Esta oficina no tiene URL de QR'); return; }
    try {
      const dataURL = await generarQRDataURL(oficina.codigoQr, { width: 300 });
      setQrData(oficina.codigoQr);
      setQrPreview({ nombre: oficina.nombre, imagen: dataURL, url: oficina.codigoQr });
    } catch { toast.error('Error generando QR'); }
  };

  const handleDescargarQR = async (oficina) => {
    if (!oficina.codigoQr) { toast.error('Sin URL de QR'); return; }
    try {
      await descargarQR(oficina.codigoQr, oficina.nombre);
      toast.success(`QR de "${oficina.nombre}" descargado`);
    } catch { toast.error('Error descargando QR'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0a4a2d]">Oficinas</h1>
        <button onClick={() => { setEditando(null); setForm({ nombre: '', ubicacion: '' }); setModal(true); }}
          className="px-4 py-2 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] flex items-center gap-2">
          <Plus size={16} /> Nueva oficina
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
        {cargando ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#08ae62]" size={28} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#d1ddd6] bg-[#f0f5f2]/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Ubicación</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Tickets</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Código QR</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Acciones</th>
            </tr></thead>
            <tbody>
              {oficinas.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-[#f0f5f2]/30">
                  <td className="px-4 py-3 font-medium text-gray-700">{o.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{o.ubicacion || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{o._count?.tickets || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${o.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {o.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => verQR(o)} className="p-1.5 hover:bg-[#f0f5f2] rounded-lg" title="Ver QR">
                        <QrCode size={16} className="text-[#08ae62]" />
                      </button>
                      <button onClick={() => handleDescargarQR(o)} className="p-1.5 hover:bg-[#f0f5f2] rounded-lg" title="Descargar QR">
                        <Download size={16} className="text-[#0a4a2d]" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { setEditando(o); setForm({ nombre: o.nombre, ubicacion: o.ubicacion || '' }); setModal(true); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Pencil size={14} className="text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0a4a2d]">{editando ? 'Editar' : 'Nueva'} oficina</h3>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required
                placeholder="Nombre de la oficina"
                className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
              <input value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })}
                placeholder="Ubicación (piso, edificio...)"
                className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
              <button type="submit" disabled={guardando}
                className="w-full py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center justify-center gap-2">
                {guardando && <Loader2 className="animate-spin" size={16} />} {editando ? 'Actualizar' : 'Crear'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Preview */}
      {qrPreview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setQrPreview(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0a4a2d]">Código QR</h3>
              <button onClick={() => setQrPreview(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="bg-[#f0f5f2] rounded-xl p-6 mb-4">
              <img src={qrPreview.imagen} alt="QR Code" className="mx-auto w-48 h-48" />
            </div>

            <p className="text-sm font-semibold text-[#0a4a2d] mb-1">{qrPreview.nombre}</p>
            <p className="text-xs text-gray-400 mb-4 break-all">{qrPreview.url}</p>

            <div className="flex gap-3">
              <button onClick={() => { navigator.clipboard.writeText(qrPreview.url); toast.success('URL copiada'); }}
                className="flex-1 py-2.5 border border-[#d1ddd6] rounded-lg text-sm font-medium text-gray-600 hover:bg-[#f0f5f2]">
                Copiar URL
              </button>
              <button onClick={() => { descargarQR(qrPreview.url, qrPreview.nombre); toast.success('Descargando...'); }}
                className="flex-1 py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] flex items-center justify-center gap-2">
                <Download size={16} /> Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
