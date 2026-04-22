import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Ticket, Clock, CheckCircle, AlertTriangle, Loader2, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORES_ESTADO = { ABIERTO:'#3182ce', ASIGNADO:'#d69e2e', EN_PROCESO:'#dd6b20', RESUELTO:'#08ae62', CERRADO:'#0a4a2d' };
const COLORES_BAR = ['#08ae62', '#0a4a2d', '#f59e0b', '#f97316', '#3182ce', '#8b5cf6', '#ec4899', '#14b8a6'];
const PRES_CONFIG = {
  DISPONIBLE: { color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Disponible' },
  AUSENTE: { color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Ausente' },
  EN_DESCANSO: { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'En descanso' },
  NO_DISPONIBLE: { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'No disponible' },
};

export default function DashboardPage() {
  const [metricas, setMetricas] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tickets/metricas'),
      api.get('/usuarios/tecnicos'),
    ])
      .then(([m, t]) => { setMetricas(m.data); setTecnicos(t.data); })
      .catch(() => toast.error('Error cargando datos'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#08ae62]" size={32}/></div>;
  if (!metricas) return null;

  const abiertos = metricas.porEstado.find(e=>e.estado==='ABIERTO')?.cantidad||0;
  const enProceso = metricas.porEstado.find(e=>e.estado==='EN_PROCESO')?.cantidad||0;
  const cerrados = metricas.porEstado.find(e=>e.estado==='CERRADO')?.cantidad||0;

  // Preparar datos para graficos por dia de la semana
  // Necesito transformar { dia, oficinas: {nom: cant}, ... } a [{dia, Oficina1: 2, Oficina2: 3}]
  const prepararDatosBar = (campo) => {
    if (!metricas.porDiaSemana) return { data: [], keys: [] };

    const keysSet = new Set();
    metricas.porDiaSemana.forEach(d => {
      Object.keys(d[campo] || {}).forEach(k => keysSet.add(k));
    });

    const keys = Array.from(keysSet);
    const data = metricas.porDiaSemana.map(d => {
      const row = { dia: d.dia, fecha: d.fecha };
      keys.forEach(k => { row[k] = d[campo]?.[k] || 0; });
      return row;
    });

    return { data, keys };
  };

  const oficinasChart = prepararDatosBar('oficinas');
  const tiposFallaChart = prepararDatosBar('tiposFalla');
  const tecnicosChart = prepararDatosBar('tecnicos');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0a4a2d]">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Tickets hoy', value:metricas.resumen.ticketsHoy, icon:Ticket, border:'border-l-[#08ae62]' },
          { label:'Abiertos', value:abiertos, icon:AlertTriangle, border:'border-l-[#f59e0b]' },
          { label:'En proceso', value:enProceso, icon:Clock, border:'border-l-[#f97316]' },
          { label:'Cerrados', value:cerrados, icon:CheckCircle, border:'border-l-[#0a4a2d]' },
        ].map(k => (
          <div key={k.label} className={`bg-white rounded-r-xl border-l-[3px] ${k.border} p-4`}>
            <p className="text-2xl font-bold text-[#0a4a2d]">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
          <p className="text-2xl font-bold text-[#0a4a2d]">{metricas.resumen.ticketsSemana}</p><p className="text-xs text-gray-500">Esta semana</p>
        </div>
        <div className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
          <p className="text-2xl font-bold text-[#0a4a2d]">{metricas.resumen.ticketsMes}</p><p className="text-xs text-gray-500">Este mes</p>
        </div>
        <div className="bg-white rounded-xl border border-[#d1ddd6] p-4 text-center">
          <p className="text-2xl font-bold text-[#0a4a2d]">{metricas.resumen.tiempoPromedioResolucionHoras}h</p><p className="text-xs text-gray-500">Tiempo prom. resolución</p>
        </div>
      </div>

      {/* Panel de presencia de técnicos */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
        <h3 className="text-sm font-semibold text-[#0a4a2d] mb-3 flex items-center gap-2"><Users size={16}/> Estado de técnicos</h3>
        {tecnicos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tecnicos.map(t => {
              const pres = PRES_CONFIG[t.estadoPresencia] || PRES_CONFIG.NO_DISPONIBLE;
              return (
                <div key={t.id} className={`${pres.bg} rounded-lg p-3 flex items-center gap-3`}>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0a4a2d] text-sm font-bold">{t.nombre?.charAt(0)?.toUpperCase()}</div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${pres.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{t.nombre}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-medium ${pres.text}`}>{pres.label}</span>
                      <span className="text-[10px] text-gray-400">• {t._count?.ticketsAsignados || 0} tickets</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-4">No hay técnicos registrados</p>}
      </div>

      <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
        <h3 className="text-sm font-semibold text-[#0a4a2d] mb-4">Tickets por estado</h3>
        {metricas.porEstado.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={metricas.porEstado} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" outerRadius={80} label={({estado,cantidad})=>`${estado}: ${cantidad}`}>
              {metricas.porEstado.map(e => <Cell key={e.estado} fill={COLORES_ESTADO[e.estado]||'#718096'}/>)}
            </Pie><Tooltip/></PieChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>}
      </div>

      {/* Graficos por dia de la semana */}
      <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
        <h3 className="text-sm font-semibold text-[#0a4a2d] mb-1">Tickets por oficina (últimos 7 días)</h3>
        <p className="text-xs text-gray-400 mb-4">Distribución diaria por oficina</p>
        {oficinasChart.data.length > 0 && oficinasChart.keys.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={oficinasChart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
              <XAxis dataKey="dia" tick={{fontSize:11}}/>
              <YAxis allowDecimals={false} tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontSize:'12px'}}/>
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              {oficinasChart.keys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORES_BAR[i % COLORES_BAR.length]} radius={[4,4,0,0]}/>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-10">Sin datos en los últimos 7 días</p>}
      </div>

      <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
        <h3 className="text-sm font-semibold text-[#0a4a2d] mb-1">Tickets por tipo de falla (últimos 7 días)</h3>
        <p className="text-xs text-gray-400 mb-4">Distribución diaria por tipo de falla</p>
        {tiposFallaChart.data.length > 0 && tiposFallaChart.keys.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tiposFallaChart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
              <XAxis dataKey="dia" tick={{fontSize:11}}/>
              <YAxis allowDecimals={false} tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontSize:'12px'}}/>
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              {tiposFallaChart.keys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORES_BAR[i % COLORES_BAR.length]} radius={[4,4,0,0]}/>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-10">Sin datos en los últimos 7 días</p>}
      </div>

      <div className="bg-white rounded-xl border border-[#d1ddd6] p-5">
        <h3 className="text-sm font-semibold text-[#0a4a2d] mb-1">Tickets por técnico (últimos 7 días)</h3>
        <p className="text-xs text-gray-400 mb-4">Distribución diaria por técnico</p>
        {tecnicosChart.data.length > 0 && tecnicosChart.keys.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tecnicosChart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
              <XAxis dataKey="dia" tick={{fontSize:11}}/>
              <YAxis allowDecimals={false} tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontSize:'12px'}}/>
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              {tecnicosChart.keys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORES_BAR[i % COLORES_BAR.length]} radius={[4,4,0,0]}/>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-10">Sin datos en los últimos 7 días</p>}
      </div>
    </div>
  );
}
