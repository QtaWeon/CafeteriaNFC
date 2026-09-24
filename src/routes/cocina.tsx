import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { KanbanCard } from "@/components/KanbanCard";
import { siguienteEstado, type Estado } from "@/lib/cafe";
import { toast } from "sonner";

export const Route = createFileRoute("/cocina")({
  head: () => ({
    meta: [{ title: "Cocina (KDS) — CaféNFC" }],
  }),
  component: Cocina,
});

function Cocina() {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(
    typeof window !== "undefined" && localStorage.getItem("cafe_cocina_pin") === "5678"
  );

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pin === "5678") {
      localStorage.setItem("cafe_cocina_pin", "5678");
      setUnlocked(true);
      toast.success("Cocina desbloqueada");
    } else {
      toast.error("PIN incorrecto (usa 5678)");
      setPin("");
    }
  }

  const { data: pedidos } = useQuery({
    queryKey: ["pedidos-cocina"],
    refetchInterval: 3000,
    enabled: unlocked,
    queryFn: async () => {
      const q = query(collection(db, "pedidos"), where("estado", "in", ["pendiente", "preparando", "listo"]));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
  });

  async function avanzar(id: string, estado: Estado) {
    const proximo = siguienteEstado[estado];
    if (!proximo) return;
    try {
      await updateDoc(doc(db, "pedidos", id), {
        estado: proximo,
        updated_at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["pedidos-cocina"] });
    } catch (error) {
      toast.error("No pudimos actualizar el pedido");
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6 text-cream">
        <form onSubmit={handleLogin} className="bg-white/10 p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center border-2 border-white/5 text-white">
          <span className="text-4xl block mb-4">👨‍🍳</span>
          <h1 className="font-display font-bold text-2xl mb-2 text-cream">Acceso KDS</h1>
          <p className="text-cream/60 text-sm mb-6">Ingresá el PIN de cocina (5678)</p>
          <input
            type="password"
            pattern="[0-9]*"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl tracking-[0.5em] font-bold bg-ink rounded-2xl py-4 outline-none focus:ring-4 focus:ring-teal mb-6 text-cream placeholder-cream/20"
            placeholder="••••"
            autoFocus
          />
          <button type="submit" className="w-full bg-teal text-ink font-bold py-4 rounded-2xl active:scale-95 transition-transform">
            Entrar a la Cocina
          </button>
        </form>
      </div>
    );
  }

  const pendientes = pedidos?.filter(p => p.estado === "pendiente") || [];
  const preparando = pedidos?.filter(p => p.estado === "preparando") || [];
  const listos = pedidos?.filter(p => p.estado === "listo") || [];

  return (
    <div className="min-h-screen bg-ink text-cream font-body flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between p-4 bg-white/5 border-b-2 border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍳</span>
          <div>
            <h1 className="font-display font-bold text-2xl text-cream">KDS en vivo</h1>
            <p className="text-xs text-cream/50">Kitchen Display System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-cream/60 hover:text-cream text-sm font-bold">Volver al inicio</Link>
          <div className="bg-brand text-ink text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="size-2 rounded-full bg-ink animate-pulse" />
            Conectado
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Columna Pendientes */}
        <section className="bg-white/5 rounded-[28px] flex flex-col overflow-hidden border-2 border-white/5">
          <div className="bg-sun text-ink font-bold px-4 py-3 sticky top-0 flex justify-between items-center z-10">
            <h3>Nuevos</h3>
            <span className="bg-ink/10 px-2 rounded-lg">{pendientes.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {pendientes.map(p => <KanbanCard key={p.id} pedido={p} onAvanzar={avanzar} />)}
            {pendientes.length === 0 && <p className="text-center text-cream/30 mt-10">No hay pedidos nuevos</p>}
          </div>
        </section>

        {/* Columna Preparando */}
        <section className="bg-white/5 rounded-[28px] flex flex-col overflow-hidden border-2 border-white/5">
          <div className="bg-teal text-ink font-bold px-4 py-3 sticky top-0 flex justify-between items-center z-10">
            <h3>En Preparación</h3>
            <span className="bg-ink/10 px-2 rounded-lg">{preparando.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {preparando.map(p => <KanbanCard key={p.id} pedido={p} onAvanzar={avanzar} />)}
            {preparando.length === 0 && <p className="text-center text-cream/30 mt-10">Vacío</p>}
          </div>
        </section>

        {/* Columna Listos */}
        <section className="bg-white/5 rounded-[28px] flex flex-col overflow-hidden border-2 border-white/5">
          <div className="bg-sage text-ink font-bold px-4 py-3 sticky top-0 flex justify-between items-center z-10">
            <h3>Listos para Servir</h3>
            <span className="bg-ink/10 px-2 rounded-lg">{listos.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {listos.map(p => <KanbanCard key={p.id} pedido={p} onAvanzar={avanzar} />)}
            {listos.length === 0 && <p className="text-center text-cream/30 mt-10">Vacío</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
