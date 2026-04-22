import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Plus, Loader2, Pencil, Trash2, X, Search, Filter, PackagePlus, PackageMinus, History, AlertTriangle, Droplets, Download, FileText } from 'lucide-react';
import { exportarExcel } from '../../utils/exportar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORES_TIPO = { TINTA: 'bg-blue-100 text-blue-700', TONER: 'bg-purple-100 text-purple-700' };

export default function InsumosPage() {
  const [insumos, setInsumos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [movimientoModal, setMovimientoModal] = useState(null);
  const [historialModal, setHistorialModal] = useState(null);
  const [movimientos, setMovimientos] = useState([]);

  const [filtros, setFiltros] = useState({ tipoInsumo: '', busqueda: '', soloStockBajo: '' });
  const [form, setForm] = useState({ codigo: '', tipoInsumo: '', marca: '', modelo: '', color: '', compatibleCon: '', stockMinimo: 2, observaciones: '' });
  const [movForm, setMovForm] = useState({ tipo: 'INGRESO', cantidad: 1, observacion: '', proveedor: '', oficina: '' });

  const cargar = async () => {
    setCargando(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const [ins, est] = await Promise.all([
        api.get('/insumos', { params }),
        api.get('/insumos/estadisticas'),
      ]);
      setInsumos(ins.data);
      setEstadisticas(est.data);
    } catch { toast.error('Error cargando insumos'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setEditando(null);
    setForm({ codigo: '', tipoInsumo: '', marca: '', modelo: '', color: '', compatibleCon: '', stockMinimo: 2, observaciones: '' });
    setModal(true);
  };

  const abrirEditar = (ins) => {
    setEditando(ins);
    setForm({
      codigo: ins.codigo, tipoInsumo: ins.tipoInsumo, marca: ins.marca, modelo: ins.modelo,
      color: ins.color, compatibleCon: ins.compatibleCon || '', stockMinimo: ins.stockMinimo, observaciones: ins.observaciones || '',
    });
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true);
    try {
      const data = { ...form };
      if (!data.compatibleCon) delete data.compatibleCon;
      if (!data.observaciones) delete data.observaciones;
      data.stockMinimo = parseInt(data.stockMinimo) || 2;

      if (editando) { await api.put(`/insumos/${editando.id}`, data); toast.success('Insumo actualizado'); }
      else { await api.post('/insumos', data); toast.success('Insumo registrado'); }
      setModal(false); cargar();
    } catch (error) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error');
    } finally { setGuardando(false); }
  };

  const eliminar = async (id, codigo) => {
    if (!confirm(`¿Desactivar el insumo ${codigo}?`)) return;
    try { await api.delete(`/insumos/${id}`); toast.success('Insumo desactivado'); cargar(); }
    catch (error) { toast.error(error.response?.data?.message || 'Error'); }
  };

  const abrirMovimiento = (insumo, tipo) => {
    setMovimientoModal(insumo);
    setMovForm({ tipo, cantidad: 1, observacion: '', proveedor: '', oficina: '' });
  };

  const registrarMovimiento = async (e) => {
    e.preventDefault(); if (!movimientoModal) return;
    setGuardando(true);
    try {
      const data = { ...movForm, cantidad: parseInt(movForm.cantidad) };
      if (!data.observacion) delete data.observacion;
      if (!data.proveedor) delete data.proveedor;
      if (!data.oficina) delete data.oficina;

      const { data: resultado } = await api.post(`/insumos/${movimientoModal.id}/movimiento`, data);
      if (resultado.alertaStockBajo) {
        toast(resultado.mensaje, { icon: '⚠️', duration: 5000 });
      } else {
        toast.success(resultado.mensaje);
      }
      setMovimientoModal(null); cargar();
    } catch (error) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error');
    } finally { setGuardando(false); }
  };

  const verHistorial = async (insumo) => {
    try {
      const { data } = await api.get(`/insumos/${insumo.id}`);
      setHistorialModal(data);
      setMovimientos(data.movimientos || []);
    } catch { toast.error('Error cargando historial'); }
  };

  const exportarInsumos = () => {
    if (insumos.length === 0) return toast.error('No hay insumos');
    const datos = insumos.map(i => ({
      'Codigo': i.codigo, 'Tipo': i.tipoInsumo, 'Marca': i.marca, 'Modelo': i.modelo,
      'Color': i.color, 'Compatible con': i.compatibleCon || '', 'Stock actual': i.stockActual,
      'Stock minimo': i.stockMinimo, 'Estado': i.stockActual <= i.stockMinimo ? 'STOCK BAJO' : 'OK',
    }));
    exportarExcel(datos, `Insumos_SAVIA_${new Date().toISOString().slice(0, 10)}`, 'Insumos');
    toast.success('Exportado');
  };

  const fmt = (f) => f ? new Date(f).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#0a4a2d]">Inventario de insumos</h1>
        <div className="flex gap-2">
          <button onClick={exportarInsumos} className="px-3 py-2 bg-[#0a4a2d] text-white rounded-lg text-sm font-medium hover:bg-[#08ae62] flex items-center gap-2">
            <Download size={14} /> Exportar
          </button>
          <button onClick={abrirCrear} className="px-4 py-2 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] flex items-center gap-2">
            <Plus size={16} /> Nuevo insumo
          </button>
        </div>
      </div>

      {/* Estadísticas y alertas */}
      {estadisticas && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
              <p className="text-2xl font-bold text-[#0a4a2d]">{estadisticas.total}</p>
              <p className="text-xs text-gray-500">Tipos de insumo</p>
            </div>
            <div className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
              <p className="text-2xl font-bold text-[#0a4a2d]">{estadisticas.stockTotal}</p>
              <p className="text-xs text-gray-500">Unidades en stock</p>
            </div>
            {estadisticas.porTipo.map(t => (
              <div key={t.tipo} className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
                <p className="text-2xl font-bold text-[#0a4a2d]">{t.stockTotal}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${COLORES_TIPO[t.tipo]}`}>{t.tipo} ({t.cantidad})</span>
              </div>
            ))}
          </div>

          {estadisticas.alertas > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-red-500" size={18} />
                <p className="text-sm font-semibold text-red-700">Alertas de stock bajo ({estadisticas.alertas})</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {estadisticas.insumosStockBajo.map(i => (
                  <div key={i.id} className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-red-700">{i.codigo}</p>
                      <p className="text-[11px] text-gray-500">{i.marca} {i.modelo} ({i.color})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{i.stockActual}</p>
                      <p className="text-[10px] text-gray-400">min: {i.stockMinimo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] p-4">
        <form onSubmit={(e) => { e.preventDefault(); cargar(); }} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" value={filtros.busqueda} onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })}
                placeholder="Código, marca, modelo o color..." className="w-full pl-9 pr-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select value={filtros.tipoInsumo} onChange={e => setFiltros({ ...filtros, tipoInsumo: e.target.value })} className="px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todos</option><option value="TINTA">Tinta</option><option value="TONER">Tóner</option>
            </select>
          </div>
          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
            <input type="checkbox" checked={filtros.soloStockBajo === 'true'} onChange={e => setFiltros({ ...filtros, soloStockBajo: e.target.checked ? 'true' : '' })}
              className="rounded border-gray-300" />
            <span className="text-xs text-red-600 font-medium">Solo stock bajo</span>
          </label>
          <button type="submit" className="px-4 py-2 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] flex items-center gap-2">
            <Filter size={14} /> Filtrar
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
        {cargando ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#08ae62]" size={28} /></div>
          : insumos.length === 0 ? <div className="text-center py-16 text-gray-400 text-sm">No hay insumos registrados</div>
            : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#d1ddd6] bg-[#f0f5f2]/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Código</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Marca / Modelo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Color</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Mín.</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Acciones</th>
                </tr></thead>
                <tbody>
                  {insumos.map(i => {
                    const stockBajo = i.stockActual <= i.stockMinimo;
                    return (
                      <tr key={i.id} className={`border-b border-gray-50 hover:bg-[#f0f5f2]/30 ${stockBajo ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#0a4a2d]">{i.codigo}</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${COLORES_TIPO[i.tipoInsumo]}`}>{i.tipoInsumo}</span></td>
                        <td className="px-4 py-3"><p className="text-xs font-medium text-gray-700">{i.marca}</p><p className="text-[11px] text-gray-400">{i.modelo}</p></td>
                        <td className="px-4 py-3 text-xs">{i.color}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg font-bold ${stockBajo ? 'text-red-600' : 'text-[#0a4a2d]'}`}>{i.stockActual}</span>
                          {stockBajo && <p className="text-[10px] text-red-500">BAJO</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{i.stockMinimo}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => abrirMovimiento(i, 'INGRESO')} className="p-1.5 hover:bg-green-50 rounded-lg" title="Registrar ingreso">
                              <PackagePlus size={14} className="text-[#08ae62]" />
                            </button>
                            <button onClick={() => abrirMovimiento(i, 'SALIDA')} className="p-1.5 hover:bg-orange-50 rounded-lg" title="Registrar salida">
                              <PackageMinus size={14} className="text-orange-500" />
                            </button>
                            <button onClick={() => verHistorial(i)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Ver historial">
                              <History size={14} className="text-blue-500" />
                            </button>
                            <button onClick={() => abrirEditar(i)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Editar">
                              <Pencil size={14} className="text-gray-500" />
                            </button>
                            <button onClick={() => eliminar(i.id, i.codigo)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Desactivar">
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>}
      </div>

      {/* MODAL CREAR/EDITAR */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0a4a2d] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[#f9f7d9] font-bold">{editando ? 'Editar' : 'Nuevo'} insumo</h3>
              <button onClick={() => setModal(false)}><X size={20} className="text-white/60" /></button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Código <span className="text-red-500">*</span></label>
                  <input type="text" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} required placeholder="Ej: TN-001"
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo <span className="text-red-500">*</span></label>
                  <select value={form.tipoInsumo} onChange={e => setForm({ ...form, tipoInsumo: e.target.value })} required
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]">
                    <option value="">Seleccione...</option><option value="TINTA">Tinta</option><option value="TONER">Tóner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Marca <span className="text-red-500">*</span></label>
                  <input type="text" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} required placeholder="Ej: HP, Epson"
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Modelo/Referencia <span className="text-red-500">*</span></label>
                  <input type="text" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} required placeholder="Ej: 664, CE285A"
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Color <span className="text-red-500">*</span></label>
                  <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} required placeholder="Negro, Cyan, Magenta, Amarillo"
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Stock mínimo</label>
                  <input type="number" value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: e.target.value })} min="0"
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Compatible con (impresoras)</label>
                <input type="text" value={form.compatibleCon} onChange={e => setForm({ ...form, compatibleCon: e.target.value })} placeholder="Ej: HP LaserJet Pro M404, M428"
                  className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] resize-none" />
              </div>
              <button type="submit" disabled={guardando}
                className="w-full py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center justify-center gap-2">
                {guardando && <Loader2 className="animate-spin" size={16} />} {editando ? 'Actualizar' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MOVIMIENTO */}
      {movimientoModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setMovimientoModal(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 rounded-t-xl flex items-center justify-between ${movForm.tipo === 'INGRESO' ? 'bg-[#08ae62]' : 'bg-orange-500'}`}>
              <div>
                <h3 className="text-white font-bold flex items-center gap-2">
                  {movForm.tipo === 'INGRESO' ? <PackagePlus size={18} /> : <PackageMinus size={18} />}
                  {movForm.tipo === 'INGRESO' ? 'Registrar ingreso' : 'Registrar salida'}
                </h3>
                <p className="text-white/80 text-xs mt-1">{movimientoModal.codigo} - {movimientoModal.marca} {movimientoModal.modelo} ({movimientoModal.color})</p>
              </div>
              <button onClick={() => setMovimientoModal(null)}><X size={20} className="text-white/60" /></button>
            </div>
            <div className="p-5">
              <div className="bg-[#f0f5f2] rounded-lg p-3 mb-4 text-center">
                <p className="text-xs text-gray-500">Stock actual</p>
                <p className="text-3xl font-bold text-[#0a4a2d]">{movimientoModal.stockActual}</p>
              </div>
              <form onSubmit={registrarMovimiento} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad <span className="text-red-500">*</span></label>
                  <input type="number" value={movForm.cantidad} onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })} min="1" required
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] text-center text-lg font-bold" />
                </div>
                {movForm.tipo === 'INGRESO' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor</label>
                    <input type="text" value={movForm.proveedor} onChange={e => setMovForm({ ...movForm, proveedor: e.target.value })} placeholder="Nombre del proveedor"
                      className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                  </div>
                )}
                {movForm.tipo === 'SALIDA' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Oficina destino</label>
                    <input type="text" value={movForm.oficina} onChange={e => setMovForm({ ...movForm, oficina: e.target.value })} placeholder="Oficina que recibe el insumo"
                      className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Observación</label>
                  <textarea value={movForm.observacion} onChange={e => setMovForm({ ...movForm, observacion: e.target.value })} rows={2} placeholder="Nota adicional..."
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] resize-none" />
                </div>
                <button type="submit" disabled={guardando}
                  className={`w-full py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${movForm.tipo === 'INGRESO' ? 'bg-[#08ae62] hover:bg-[#0a4a2d]' : 'bg-orange-500 hover:bg-orange-600'}`}>
                  {guardando && <Loader2 className="animate-spin" size={16} />}
                  {movForm.tipo === 'INGRESO' ? 'Registrar ingreso' : 'Registrar salida'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {historialModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setHistorialModal(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0a4a2d] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-[#f9f7d9] font-bold flex items-center gap-2"><History size={18} /> Historial de movimientos</h3>
                <p className="text-[#08ae62] text-xs mt-1">{historialModal.codigo} - {historialModal.marca} {historialModal.modelo} ({historialModal.color})</p>
              </div>
              <button onClick={() => setHistorialModal(null)}><X size={20} className="text-white/60" /></button>
            </div>
            <div className="p-5">
              <div className="bg-[#f0f5f2] rounded-lg p-4 mb-4 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xs text-gray-400">Stock actual</p><p className="text-2xl font-bold text-[#0a4a2d]">{historialModal.stockActual}</p></div>
                <div><p className="text-xs text-gray-400">Stock mínimo</p><p className="text-2xl font-bold text-gray-500">{historialModal.stockMinimo}</p></div>
                <div><p className="text-xs text-gray-400">Movimientos</p><p className="text-2xl font-bold text-gray-500">{movimientos.length}</p></div>
              </div>
              {movimientos.length > 0 ? (
                <div className="space-y-2">
                  {movimientos.map(m => (
                    <div key={m.id} className={`rounded-lg p-3 border ${m.tipo === 'INGRESO' ? 'bg-green-50/50 border-green-200' : 'bg-orange-50/50 border-orange-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {m.tipo === 'INGRESO' ? <PackagePlus size={14} className="text-[#08ae62]" /> : <PackageMinus size={14} className="text-orange-500" />}
                          <span className={`text-xs font-semibold ${m.tipo === 'INGRESO' ? 'text-[#08ae62]' : 'text-orange-600'}`}>
                            {m.tipo === 'INGRESO' ? '+' : '-'}{m.cantidad} unidades
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">{fmt(m.fecha)}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>Registrado por: {m.usuario?.nombre}</p>
                        {m.proveedor && <p>Proveedor: {m.proveedor}</p>}
                        {m.oficina && <p>Oficina: {m.oficina}</p>}
                        {m.observacion && <p>Nota: {m.observacion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-gray-400 text-sm py-8">Sin movimientos registrados</p>}

              {movimientos.length > 0 && (
                <button onClick={() => {
                  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                  const pw = doc.internal.pageSize.getWidth();
                  doc.setFillColor(10,74,45); doc.rect(0,0,pw,28,'F');
                  doc.setTextColor(249,247,217); doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.text('SAVIA',14,13);
                  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(8,174,98); doc.text('Sistema de atencion vital e integral de asistencia',14,19);
                  doc.setTextColor(10,74,45); doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text(`Historial - ${historialModal.codigo}`,14,38);
                  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80);
                  doc.text(`${historialModal.marca} ${historialModal.modelo} (${historialModal.color}) | Stock: ${historialModal.stockActual}`,14,44);
                  autoTable(doc, {
                    startY: 50,
                    head: [['Fecha','Tipo','Cantidad','Responsable','Proveedor/Oficina','Observacion']],
                    body: movimientos.map(m => [
                      fmt(m.fecha), m.tipo, m.tipo==='INGRESO'?`+${m.cantidad}`:`-${m.cantidad}`,
                      m.usuario?.nombre||'', m.proveedor||m.oficina||'', m.observacion||'',
                    ]),
                    theme:'grid', styles:{fontSize:7,cellPadding:2},
                    headStyles:{fillColor:[10,74,45],textColor:[255,255,255]},
                    alternateRowStyles:{fillColor:[240,245,242]},
                  });
                  doc.save(`Historial_${historialModal.codigo}_${new Date().toISOString().slice(0,10)}.pdf`);
                  toast.success('PDF descargado');
                }}
                  className="w-full py-3 bg-[#0a4a2d] text-white rounded-lg text-sm font-medium hover:bg-[#08ae62] flex items-center justify-center gap-2 mt-4">
                  <FileText size={18}/> Descargar historial en PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
