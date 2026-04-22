import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Plus, Loader2, Pencil, Trash2, X } from 'lucide-react';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre:'', correo:'', password:'', rol:'TECNICO' });

  const cargar = async () => { setCargando(true); try { const {data}=await api.get('/usuarios'); setUsuarios(data); } catch{toast.error('Error');} finally{setCargando(false);} };
  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true);
    try {
      if (editando) { const d={...form}; if(!d.password) delete d.password; await api.put(`/usuarios/${editando.id}`,d); toast.success('Actualizado'); }
      else { await api.post('/usuarios',form); toast.success('Creado'); }
      setModal(false); cargar();
    } catch(error){toast.error(error.response?.data?.message||'Error');}finally{setGuardando(false);}
  };

  const rolBadge = {ADMIN:'bg-purple-100 text-purple-700',SUPERVISOR:'bg-blue-100 text-blue-700',TECNICO:'bg-[#08ae62]/10 text-[#0a4a2d]'};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0a4a2d]">Usuarios</h1>
        <button onClick={()=>{setEditando(null);setForm({nombre:'',correo:'',password:'',rol:'TECNICO'});setModal(true);}}
          className="px-4 py-2 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] flex items-center gap-2"><Plus size={16}/> Nuevo usuario</button>
      </div>
      <div className="bg-white rounded-xl border border-[#d1ddd6] overflow-hidden">
        {cargando ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#08ae62]" size={28}/></div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#d1ddd6] bg-[#f0f5f2]/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Correo</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Rol</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Acciones</th>
            </tr></thead>
            <tbody>{usuarios.map(u=>(
              <tr key={u.id} className="border-b border-gray-50 hover:bg-[#f0f5f2]/30">
                <td className="px-4 py-3 font-medium text-gray-700">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{u.correo}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${rolBadge[u.rol]}`}>{u.rol}</span></td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${u.activo?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{u.activo?'Activo':'Inactivo'}</span></td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button onClick={()=>{setEditando(u);setForm({nombre:u.nombre,correo:u.correo,password:'',rol:u.rol});setModal(true);}} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil size={14} className="text-gray-500"/></button>
                  {u.activo && <button onClick={async()=>{if(!confirm('¿Desactivar?'))return;await api.delete(`/usuarios/${u.id}`);toast.success('Desactivado');cargar();}} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-500"/></button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setModal(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-[#0a4a2d]">{editando?'Editar':'Nuevo'} usuario</h3><button onClick={()=>setModal(false)}><X size={20} className="text-gray-400"/></button></div>
            <form onSubmit={guardar} className="space-y-3">
              <input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} required placeholder="Nombre completo" className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
              <input type="email" value={form.correo} onChange={e=>setForm({...form,correo:e.target.value})} required placeholder="Correo" className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder={editando?'Nueva contraseña (vacío = no cambiar)':'Contraseña'} required={!editando} className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]"/>
              <select value={form.rol} onChange={e=>setForm({...form,rol:e.target.value})} className="w-full px-3 py-2.5 border border-[#d1ddd6] rounded-lg text-sm outline-none focus:border-[#08ae62]">
                <option value="TECNICO">Técnico</option><option value="SUPERVISOR">Supervisor</option><option value="ADMIN">Admin</option>
              </select>
              <button type="submit" disabled={guardando} className="w-full py-2.5 bg-[#08ae62] text-white rounded-lg text-sm font-medium hover:bg-[#0a4a2d] disabled:opacity-50 flex items-center justify-center gap-2">
                {guardando && <Loader2 className="animate-spin" size={16}/>} {editando?'Actualizar':'Crear'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
