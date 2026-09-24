import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { MenuManagement } from "@/components/MenuManagement";
import { MesaManager } from "@/components/MesaManager";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { gs, estadoLabel, estadoDot, siguienteEstado, accionLabel, type Estado } from "@/lib/cafe";
import { toast } from "sonner";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel Admin — CaféNFC" },
    ],
  }),
  component: Panel,
});

function Panel() {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(
    typeof window !== "undefined" && localStorage.getItem("cafe_admin_pin") === "2403"
  );
  const [tab, setTab] = useState<"pedidos" | "menu" | "mesas" | "metricas">("metricas");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pin === "2403") {
      localStorage.setItem("cafe_admin_pin", "2403");
      setUnlocked(true);
      toast.success("Panel desbloqueado");
    } else {
      toast.error("PIN incorrecto");
      setPin("");
    }
  }

  function handleLogout() {
    localStorage.removeItem("cafe_admin_pin");
    setUnlocked(false);
    setPin("");
  }

  const { data: pedidos } = useQuery({
    queryKey: ["pedidos-panel"],
    refetchInterval: 4000,
    enabled: unlocked && tab === "pedidos",
    queryFn: async () => {
      const q = query(collection(db, "pedidos"), where("estado", "!=", "finalizado"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      return items.sort((a, b) => {
        if (a.estado !== b.estado) return a.estado.localeCompare(b.estado);
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
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
      qc.invalidateQueries({ queryKey: ["pedidos-panel"] });
      toast.success(`Pedido ${estadoLabel[proximo].toLowerCase()}`);
    } catch (error) {
      toast.error("No pudimos actualizar el pedido");
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-[32px] shadow-[8px_8px_0_var(--ink)] border-2 border-ink/5 max-w-sm w-full text-center">
          <span className="text-4xl block mb-4">🔒</span>
          <h1 className="font-display font-bold text-2xl mb-2">Acceso Admin</h1>
          <p className="text-ink/60 text-sm mb-6">Ingresá el PIN de administración.</p>
          <input
            type="password"
            pattern="[0-9]*"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl tracking-[0.5em] font-bold bg-cream rounded-2xl py-4 outline-none focus:ring-4 focus:ring-brand mb-6"
            placeholder="••••"
            autoFocus
          />
          <button type="submit" className="w-full bg-brand text-cream font-bold py-4 rounded-2xl shadow-[4px_4px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none">
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink font-body relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-20 -left-16 size-72 rounded-full bg-sun/40"
        style={{ animation: "floaty 6s ease-in-out infinite" }}
      />
      <div className="max-w-6xl mx-auto px-6 py-8 relative">
        <header className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div className="flex items-center gap-3">
            <span className="size-12 rounded-2xl bg-teal grid place-items-center text-2xl shadow-[4px_4px_0_var(--ink)]">
              📊
            </span>
            <div>
              <h1 className="font-display font-bold text-3xl">Panel de Administración</h1>
              <p className="text-sm text-ink/50">Métricas, menú, mesas y pedidos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleLogout}
              className="rounded-2xl bg-white text-ink border-2 border-ink/10 px-5 py-3 font-display font-semibold hover:bg-ink/5"
            >
              Salir
            </button>
            <Link
              to="/cocina"
              className="rounded-2xl bg-ink text-cream px-5 py-3 font-display font-semibold shadow-[4px_4px_0_var(--brand)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Ver KDS (Cocina)
            </Link>
          </div>
        </header>

        <div className="flex gap-2 mb-8 bg-ink/5 p-1 rounded-2xl w-max overflow-x-auto max-w-full scrollbar-hide">
          <button
            onClick={() => setTab("metricas")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap ${tab === "metricas" ? "bg-white shadow-sm text-ink" : "text-ink/60 hover:text-ink"}`}
          >
            📈 Métricas
          </button>
          <button
            onClick={() => setTab("pedidos")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap ${tab === "pedidos" ? "bg-white shadow-sm text-ink" : "text-ink/60 hover:text-ink"}`}
          >
            📋 Pedidos Activos
          </button>
          <button
            onClick={() => setTab("menu")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap ${tab === "menu" ? "bg-white shadow-sm text-ink" : "text-ink/60 hover:text-ink"}`}
          >
            🍔 Menú
          </button>
          <button
            onClick={() => setTab("mesas")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap ${tab === "mesas" ? "bg-white shadow-sm text-ink" : "text-ink/60 hover:text-ink"}`}
          >
            📡 Mesas & NFC
          </button>
        </div>

        {tab === "metricas" && <MetricsDashboard />}
        {tab === "menu" && <MenuManagement />}
        {tab === "mesas" && <MesaManager />}
        
        {tab === "pedidos" && (
          <section>
            <div className="grid sm:grid-cols-3 gap-4">
              {pedidos?.length === 0 && (
                <p className="text-ink/50 sm:col-span-3 rounded-3xl bg-white p-6 border-2 border-ink/5 shadow-[6px_6px_0_var(--ink)]">
                  No hay pedidos activos ahora mismo.
                </p>
              )}
              {pedidos?.map((p) => {
                const estado = p.estado as Estado;
                return (
                  <div
                    key={p.id}
                    className="rounded-3xl bg-white p-5 shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display font-bold text-xl">Mesa {p.mesa_numero}</p>
                      <span className="bg-sun/40 text-ink text-xs font-bold px-2.5 py-1 rounded-full">
                        {p.nfc_code}
                      </span>
                    </div>
                    <ul className="mt-3 text-sm text-ink/70 space-y-1">
                      {(p.items || []).map((it: any, i: number) => (
                        <li key={i}>
                          {it.cantidad} × {it.nombre}
                          {it.personalizacion && (
                            <span className="text-ink/40"> · {it.personalizacion}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 font-display font-bold text-lg">Total: {gs(p.total)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`size-3 rounded-full ${estadoDot[estado]}`} />
                      <span className="text-xs font-semibold">{estadoLabel[estado]}</span>
                      {p.cuenta_solicitada && (
                        <span className="text-xs font-bold text-brand ml-auto">🧾 Pide la cuenta</span>
                      )}
                    </div>
                    <button
                      onClick={() => avanzar(p.id, estado)}
                      className={`mt-4 w-full rounded-2xl py-2.5 font-bold shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                        estado === "entregado" 
                          ? "bg-ink text-cream" 
                          : estado === "listo" 
                            ? "bg-sage text-ink" 
                            : "bg-teal text-cream"
                      }`}
                    >
                      {accionLabel[estado]}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
