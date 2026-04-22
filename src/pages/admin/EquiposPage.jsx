import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Plus, Loader2, Pencil, Trash2, X, Upload, Download, Search, Filter, Laptop, Monitor, Printer, Phone, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { exportarExcel } from '../../utils/exportar';

const TIPOS_EQUIPO = [
  { value: 'PORTATIL', label: 'Portátil', icon: Laptop },
  { value: 'EQUIPO_MESA', label: 'Equipo de mesa', icon: Monitor },
  { value: 'IMPRESORA', label: 'Impresora', icon: Printer },
  { value: 'IMPRESORA_MULTIFUNCIONAL', label: 'Impresora multifuncional', icon: Printer },
  { value: 'TELEFONO_IP', label: 'Teléfono IP', icon: Phone },
];

const ESTADOS = [
  { value: 'ACTIVO', label: 'Activo', color: 'bg-green-100 text-green-700' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'EN_BODEGA', label: 'En bodega', color: 'bg-blue-100 text-blue-700' },
  { value: 'DADO_DE_BAJA', label: 'Dado de baja', color: 'bg-red-100 text-red-700' },
];

export default function EquiposPage() {
  const [equipos, setEquipos] = useState([]);
  const [oficinas, setOficinas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [resultadoImport, setResultadoImport] = useState(null);
  const fileInputRef = useRef(null);

  const [filtros, setFiltros] = useState({ oficinaId:'', tipoEquipo:'', estado:'', busqueda:'' });
  const [form, setForm] = useState({
    placaInventario:'', tipoEquipo:'', marca:'', modelo:'', serial:'', oficinaId:'',
    estado:'ACTIVO', fechaAdquisicion:'', proveedor:'', observaciones:'',
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k,v]) => { if (v) params[k] = v; });
      const [eq, est] = await Promise.all([
        api.get('/equipos', { params }),
        api.get('/equipos/estadisticas'),
      ]);
      setEquipos(eq.data);
      setEstadisticas(est.data);
    } catch { toast.error('Error cargando equipos'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { api.get('/oficinas').then(r => setOficinas(r.data)).catch(()=>{}); }, []);

  const aplicarFiltros = (e) => { e?.preventDefault(); cargar(); };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ placaInventario:'', tipoEquipo:'', marca:'', modelo:'', serial:'', oficinaId:'',
      estado:'ACTIVO', fechaAdquisicion:'', proveedor:'', observaciones:'' });
    setModal(true);
  };

  const abrirEditar = (eq) => {
    setEditando(eq);
    setForm({
      placaInventario: eq.placaInventario,
      tipoEquipo: eq.tipoEquipo,
      marca: eq.marca,
      modelo: eq.modelo,
      serial: eq.serial,
      oficinaId: eq.oficinaId,
      estado: eq.estado,
      fechaAdquisicion: eq.fechaAdquisicion ? eq.fechaAdquisicion.slice(0,10) : '',
      proveedor: eq.proveedor || '',
      observaciones: eq.observaciones || '',
    });
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true);
    try {
      const data = { ...form };
      if (!data.fechaAdquisicion) delete data.fechaAdquisicion;
      if (!data.proveedor) delete data.proveedor;
      if (!data.observaciones) delete data.observaciones;

      if (editando) {
        await api.put(`/equipos/${editando.id}`, data);
        toast.success('Equipo actualizado');
      } else {
        await api.post('/equipos', data);
        toast.success('Equipo registrado');
      }
      setModal(false);
      cargar();
    } catch (error) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al guardar');
    } finally { setGuardando(false); }
  };

  const eliminar = async (id, placa) => {
    if (!confirm(`¿Eliminar el equipo con placa ${placa}?`)) return;
    try {
      await api.delete(`/equipos/${id}`);
      toast.success('Equipo eliminado');
      cargar();
    } catch (error) { toast.error(error.response?.data?.message || 'Error'); }
  };

  const descargarPlantilla = () => {
    const plantilla = [
      {
        'Placa Inventario': 'PC-0001',
        'Tipo Equipo': 'EQUIPO_MESA',
        'Marca': 'HP',
        'Modelo': 'EliteDesk 800 G5',
        'Serial': 'MXL1234567',
        'Oficina': 'Secretaria General',
        'Estado': 'ACTIVO',
        'Fecha Adquisicion': '2024-03-15',
        'Proveedor': 'Distribuidora XYZ',
        'Observaciones': 'Opcional',
      },
      {
        'Placa Inventario': 'IMP-0001',
        'Tipo Equipo': 'IMPRESORA',
        'Marca': 'Epson',
        'Modelo': 'L3250',
        'Serial': 'X8JY456789',
        'Oficina': 'Oficina de Planeacion',
        'Estado': 'ACTIVO',
        'Fecha Adquisicion': '2024-01-20',
        'Proveedor': '',
        'Observaciones': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(plantilla);
    ws['!cols'] = [
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
      { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 25 }, { wch: 30 },
    ];

    // Agregar hoja con instrucciones
    const instrucciones = [
      { Campo: 'Placa Inventario', Descripcion: 'Obligatorio. Numero unico de inventario institucional (ej: PC-0001)' },
      { Campo: 'Tipo Equipo', Descripcion: 'Obligatorio. Valores: PORTATIL, EQUIPO_MESA, IMPRESORA, IMPRESORA_MULTIFUNCIONAL, TELEFONO_IP' },
      { Campo: 'Marca', Descripcion: 'Obligatorio. Marca del equipo' },
      { Campo: 'Modelo', Descripcion: 'Obligatorio. Modelo del equipo' },
      { Campo: 'Serial', Descripcion: 'Obligatorio. Serial unico del fabricante' },
      { Campo: 'Oficina', Descripcion: 'Obligatorio. Nombre EXACTO de la oficina (debe existir previamente)' },
      { Campo: 'Estado', Descripcion: 'Opcional. Valores: ACTIVO, EN_MANTENIMIENTO, EN_BODEGA, DADO_DE_BAJA. Por defecto ACTIVO' },
      { Campo: 'Fecha Adquisicion', Descripcion: 'Opcional. Formato YYYY-MM-DD (ej: 2024-03-15)' },
      { Campo: 'Proveedor', Descripcion: 'Opcional. Nombre del proveedor' },
      { Campo: 'Observaciones', Descripcion: 'Opcional. Notas adicionales' },
    ];
    const wsInstr = XLSX.utils.json_to_sheet(instrucciones);
    wsInstr['!cols'] = [{ wch: 20 }, { wch: 80 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipos');
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Plantilla_Inventario_SAVIA.xlsx');
    toast.success('Plantilla descargada');
  };

  const handleImportarArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportando(true);
    setResultadoImport(null);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      if (rows.length === 0) {
        toast.error('El archivo está vacío');
        setImportando(false);
        return;
      }

      // Mapear nombres de oficina a IDs
      const oficinasMap = Object.fromEntries(oficinas.map(o => [o.nombre.toLowerCase(), o.id]));

      const equiposAImportar = rows.map(row => {
        const nombreOficina = (row['Oficina'] || '').toLowerCase().trim();
        const oficinaId = oficinasMap[nombreOficina];

        return {
          placaInventario: String(row['Placa Inventario'] || '').trim(),
          tipoEquipo: String(row['Tipo Equipo'] || '').trim().toUpperCase(),
          marca: String(row['Marca'] || '').trim(),
          modelo: String(row['Modelo'] || '').trim(),
          serial: String(row['Serial'] || '').trim(),
          oficinaId: oficinaId || '',
          estado: String(row['Estado'] || 'ACTIVO').trim().toUpperCase(),
          fechaAdquisicion: row['Fecha Adquisicion'] ? new Date(row['Fecha Adquisicion']).toISOString().slice(0,10) : undefined,
          proveedor: row['Proveedor'] ? String(row['Proveedor']).trim() : undefined,
          observaciones: row['Observaciones'] ? String(row['Observaciones']).trim() : undefined,
        };
      });

      const { data: resultado } = await api.post('/equipos/importar', { equipos: equiposAImportar });
      setResultadoImport(resultado);
      toast.success(`${resultado.exitosos} equipos importados de ${resultado.total}`);
      cargar();
    } catch (error) {
      toast.error('Error procesando el archivo: ' + (error.message || ''));
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportarExcelInventario = () => {
    if (equipos.length === 0) { toast.error('No hay equipos para exportar'); return; }
    const datos = equipos.map(e => ({
      'Placa': e.placaInventario,
      'Tipo': e.tipoEquipo?.replace('_',' '),
      'Marca': e.marca,
      'Modelo': e.modelo,
      'Serial': e.serial,
      'Oficina': e.oficina?.nombre,
      'Estado': e.estado?.replace('_',' '),
      'Fecha Adquisicion': e.fechaAdquisicion ? new Date(e.fechaAdquisicion).toLocaleDateString('es-CO') : '',
      'Proveedor': e.proveedor || '',
      'Observaciones': e.observaciones || '',
    }));
    exportarExcel(datos, `Inventario_SAVIA_${new Date().toISOString().slice(0,10)}`, 'Equipos');
    toast.success(`${equipos.length} equipos exportados`);
  };

  const getIcono = (tipo) => {
    const t = TIPOS_EQUIPO.find(t => t.value === tipo);
    return t ? t.icon : Package;
  };

  const getEstadoBadge = (estado) => {
    const e = ESTADOS.find(e => e.value === estado);
    return e?.color || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#0a4a2d]">Inventario de equipos</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={descargarPlantilla} className="px-3 py-2 border border-[#d1ddd6] text-[#0a4a2d] rounded-lg text-sm font-medium hover:bg-[#f0f5f2] flex items-center gap-2">
            <Download size={14}/> Plantilla
          </button>
          <button onClick={()=>setModalImportar(true)} className="px-3 py-2 border border-[#0a4a2d] text-[#0a4a2d] rounded-lg text-sm font-medium hover:bg-[#f0f5f2] flex items-center gap-2">
            <Upload size={14}/> Importar Excel
          </button>
          <button onClick={exportarExcelInventario} className="px-3 py-2 bg-[#0a4a2d] text-white rounded-lg text-sm font-medium hover:bg-[#08ae62] flex items-center gap-2">
            <Download size={14}/> Exportar
          </button>
          <button onClick={abrirCrear} className="px-4 py-2 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] flex items-center gap-2">
            <Plus size={16}/> Nuevo equipo
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
            <p className="text-2xl font-bold text-[#0a4a2d]">{estadisticas.total}</p>
            <p className="text-xs text-gray-500">Total equipos</p>
          </div>
          {estadisticas.porEstado.map(e => (
            <div key={e.estado} className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
              <p className="text-2xl font-bold text-[#0a4a2d]">{e.cantidad}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getEstadoBadge(e.estado)}`}>{e.estado?.replace('_',' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] p-4">
        <form onSubmit={aplicarFiltros} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <input type="text" value={filtros.busqueda} onChange={e=>setFiltros({...filtros,busqueda:e.target.value})}
                placeholder="Placa, serial, marca o modelo..."
                className="w-full pl-9 pr-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Oficina</label>
            <select value={filtros.oficinaId} onChange={e=>setFiltros({...filtros,oficinaId:e.target.value})}
              className="px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todas</option>
              {oficinas.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select value={filtros.tipoEquipo} onChange={e=>setFiltros({...filtros,tipoEquipo:e.target.value})}
              className="px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todos</option>
              {TIPOS_EQUIPO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={filtros.estado} onChange={e=>setFiltros({...filtros,estado:e.target.value})}
              className="px-3 py-2 border border-[#d1ddd6] rounded-lg text-sm outline-none">
              <option value="">Todos</option>
              {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] flex items-center gap-2">
            <Filter size={14}/> Filtrar
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
        {cargando ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#08ae62]" size={28}/></div>
        : equipos.length === 0 ? <div className="text-center py-16 text-gray-400 text-sm">No hay equipos registrados</div>
        : <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#d1ddd6] bg-[#f0f5f2]/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Placa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Marca / Modelo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Serial</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Oficina</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Acciones</th>
            </tr></thead>
            <tbody>
              {equipos.map(eq => {
                const Icono = getIcono(eq.tipoEquipo);
                return (
                  <tr key={eq.id} className="border-b border-gray-50 hover:bg-[#f0f5f2]/30">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#0a4a2d]">{eq.placaInventario}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Icono size={14} className="text-[#08ae62]"/><span className="text-xs">{eq.tipoEquipo?.replace('_',' ')}</span></div></td>
                    <td className="px-4 py-3"><p className="text-xs font-medium text-gray-700">{eq.marca}</p><p className="text-[11px] text-gray-400">{eq.modelo}</p></td>
                    <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell font-mono">{eq.serial}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{eq.oficina?.nombre}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getEstadoBadge(eq.estado)}`}>{eq.estado?.replace('_',' ')}</span></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={()=>abrirEditar(eq)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Editar"><Pencil size={14} className="text-gray-500"/></button>
                        <button onClick={()=>eliminar(eq.id, eq.placaInventario)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={14} className="text-red-500"/></button>
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0a4a2d] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[#f9f7d9] font-bold">{editando ? 'Editar' : 'Nuevo'} equipo</h3>
              <button onClick={()=>setModal(false)}><X size={20} className="text-white/60"/></button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Placa inventario <span className="text-red-500">*</span></label>
                  <input type="text" value={form.placaInventario} onChange={e=>setForm({...form,placaInventario:e.target.value})} required
                    placeholder="Ej: PC-0001" className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de equipo <span className="text-red-500">*</span></label>
                  <select value={form.tipoEquipo} onChange={e=>setForm({...form,tipoEquipo:e.target.value})} required
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]">
                    <option value="">Seleccione...</option>
                    {TIPOS_EQUIPO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Marca <span className="text-red-500">*</span></label>
                  <input type="text" value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})} required
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Modelo <span className="text-red-500">*</span></label>
                  <input type="text" value={form.modelo} onChange={e=>setForm({...form,modelo:e.target.value})} required
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Serial del equipo <span className="text-red-500">*</span></label>
                <input type="text" value={form.serial} onChange={e=>setForm({...form,serial:e.target.value})} required
                  className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Oficina <span className="text-red-500">*</span></label>
                  <select value={form.oficinaId} onChange={e=>setForm({...form,oficinaId:e.target.value})} required
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]">
                    <option value="">Seleccione...</option>
                    {oficinas.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                  <select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]">
                    {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha adquisición</label>
                  <input type="date" value={form.fechaAdquisicion} onChange={e=>setForm({...form,fechaAdquisicion:e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor</label>
                  <input type="text" value={form.proveedor} onChange={e=>setForm({...form,proveedor:e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
                <textarea value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})} rows={2}
                  className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62] resize-none"/>
              </div>
              <button type="submit" disabled={guardando}
                className="w-full py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center justify-center gap-2">
                {guardando && <Loader2 className="animate-spin" size={16}/>} {editando ? 'Actualizar' : 'Registrar'} equipo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAR */}
      {modalImportar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>{setModalImportar(false);setResultadoImport(null);}}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <div className="bg-[#0a4a2d] px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-[#f9f7d9] font-bold flex items-center gap-2"><Upload size={18}/> Importar equipos</h3>
              <button onClick={()=>{setModalImportar(false);setResultadoImport(null);}}><X size={20} className="text-white/60"/></button>
            </div>
            <div className="p-5 space-y-4">
              {!resultadoImport ? (
                <>
                  <div className="bg-[#f9f7d9]/30 border border-[#f9f7d9] rounded-lg p-3 text-xs text-[#0a4a2d]">
                    <p className="font-medium mb-1">Antes de importar:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Descargue la plantilla Excel</li>
                      <li>Las oficinas deben existir previamente</li>
                      <li>Los nombres de oficina deben coincidir EXACTAMENTE</li>
                      <li>Placas y seriales no se pueden duplicar</li>
                    </ol>
                  </div>
                  <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleImportarArchivo} className="hidden"/>
                  <button onClick={()=>fileInputRef.current?.click()} disabled={importando}
                    className="w-full py-6 border-2 border-dashed border-[#d1ddd6] rounded-lg text-center hover:border-[#08ae62] hover:bg-[#f0f5f2] transition-all disabled:opacity-50">
                    {importando ? (
                      <><Loader2 className="mx-auto animate-spin text-[#08ae62] mb-2" size={28}/><p className="text-sm text-gray-500">Procesando archivo...</p></>
                    ) : (
                      <><Upload className="mx-auto text-gray-400 mb-2" size={28}/><p className="text-sm text-gray-700 font-medium">Seleccionar archivo Excel</p><p className="text-xs text-gray-400 mt-1">.xlsx o .xls</p></>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-700">{resultadoImport.total}</p>
                      <p className="text-xs text-blue-600">Total</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-700">{resultadoImport.exitosos}</p>
                      <p className="text-xs text-green-600">Exitosos</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-red-700">{resultadoImport.fallidos}</p>
                      <p className="text-xs text-red-600">Fallidos</p>
                    </div>
                  </div>
                  {resultadoImport.errores.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-[#d1ddd6] rounded-lg">
                      <p className="text-xs font-medium text-gray-700 px-3 py-2 border-b border-[#d1ddd6]">Errores encontrados:</p>
                      <div className="p-2 space-y-1">
                        {resultadoImport.errores.map((err, i) => (
                          <div key={i} className="text-xs p-2 bg-red-50 rounded">
                            <span className="font-medium">Fila {err.fila}</span> ({err.placa}): <span className="text-red-600">{err.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={()=>{setModalImportar(false);setResultadoImport(null);}}
                    className="w-full py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d]">
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
