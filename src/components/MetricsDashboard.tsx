import { useQuery } from "@tanstack/react-query";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { gs } from "@/lib/cafe";

export function MetricsDashboard() {
  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["pedidos-historico"],
    queryFn: async () => {
      const q = query(collection(db, "pedidos"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    },
  });

  if (isLoading) return <p className="text-center py-10 opacity-50">Cargando métricas...</p>;

  // Process data for charts
  const hoy = new Date().toISOString().split("T")[0];
  const pedidosHoy = pedidos?.filter(p => p.created_at.startsWith(hoy)) || [];
  
  const ventasHoy = pedidosHoy.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalPedidosHoy = pedidosHoy.length;

  // Chart 1: Ventas por hora
  const ventasPorHora: Record<string, number> = {};
  pedidosHoy.forEach(p => {
    const hora = new Date(p.created_at).getHours() + ":00";
    ventasPorHora[hora] = (ventasPorHora[hora] || 0) + 1;
  });
  const dataHoras = Object.entries(ventasPorHora).map(([hora, total]) => ({ hora, pedidos: total })).sort((a, b) => parseInt(a.hora) - parseInt(b.hora));

  // Chart 2: Items más vendidos
  const itemsVendidos: Record<string, number> = {};
  pedidos?.forEach(p => {
    (p.items || []).forEach((it: any) => {
      itemsVendidos[it.nombre] = (itemsVendidos[it.nombre] || 0) + it.cantidad;
    });
  });
  const dataItems = Object.entries(itemsVendidos)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  const COLORS = ['#2DD4BF', '#FBBF24', '#FB7185', '#38BDF8', '#A78BFA'];

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl">Métricas de Hoy</h2>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5">
          <p className="text-ink/60 font-bold text-sm uppercase tracking-wider mb-2">Ventas del día</p>
          <p className="font-display font-bold text-4xl text-brand">{gs(ventasHoy)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5">
          <p className="text-ink/60 font-bold text-sm uppercase tracking-wider mb-2">Pedidos totales</p>
          <p className="font-display font-bold text-4xl text-teal">{totalPedidosHoy}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5">
          <h3 className="font-display font-bold text-xl mb-6">Pedidos por Hora (Hoy)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataHoras}>
                <XAxis dataKey="hora" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="pedidos" fill="var(--color-sun)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5">
          <h3 className="font-display font-bold text-xl mb-6">Top 5 Productos Histórico</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataItems}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {dataItems.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="size-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
