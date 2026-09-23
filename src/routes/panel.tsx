import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { seedDatabase } from "@/lib/seed";
import {
  gs,
  estadoLabel,
  estadoDot,
  siguienteEstado,
  accionLabel,
  type Estado,
} from "@/lib/cafe";
import { toast } from "sonner";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel de la cafetería — CaféNFC" },
      {
        name: "description",
        content: "Cocina y mozos: pedidos por mesa, totales y cambio de estado en un toque.",
      },
      { property: "og:title", content: "Panel de la cafetería — CaféNFC" },
      {
        property: "og:description",
        content: "Pedidos por mesa, totales y estados: aceptar, preparar, listo y entregado.",
      },
    ],
  }),
  component: Panel,
});

function Panel() {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    if (!confirm("¿Poblar la base de datos con las mesas y el menú de ejemplo? Esto sobreescribirá los datos existentes.")) return;
    setSeeding(true);
    try {
      await seedDatabase();
      toast.success("✅ Base de datos poblada correctamente");
      qc.invalidateQueries();
    } catch (e) {
      toast.error("❌ Error al poblar la base de datos");
    } finally {
      setSeeding(false);
    }
  }

  const { data: pedidos } = useQuery({
    queryKey: ["pedidos-panel"],
    refetchInterval: 4000,
    queryFn: async () => {
      const q = query(
        collection(db, "pedidos"),
        where("estado", "!=", "entregado"),
        orderBy("estado"),
        orderBy("created_at")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
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
    } catch (error) {
      toast.error("No pudimos actualizar el pedido");
      return;
    }
    qc.invalidateQueries({ queryKey: ["pedidos-panel"] });
    toast.success(`Pedido ${estadoLabel[proximo].toLowerCase()}`);
  }

  return (
    <div className="min-h-screen bg-cream text-ink font-body relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-20 -left-16 size-72 rounded-full bg-sun/40"
        style={{ animation: "floaty 6s ease-in-out infinite" }}
      />
      <div className="max-w-6xl mx-auto px-6 py-8 relative">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="size-12 rounded-2xl bg-teal grid place-items-center text-2xl shadow-[4px_4px_0_var(--ink)]">
              👨‍🍳
            </span>
            <div>
              <h1 className="font-display font-bold text-3xl">Panel de la cafetería</h1>
              <p className="text-sm text-ink/50">Administrador · cocina y mozos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="rounded-2xl bg-sun text-ink px-5 py-3 font-display font-semibold shadow-[4px_4px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seeding ? "Cargando..." : "🌱 Poblar BD"}
            </button>
            <Link
              to="/"
              className="rounded-2xl bg-ink text-cream px-5 py-3 font-display font-semibold shadow-[4px_4px_0_var(--brand)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Ver mesas
            </Link>
          </div>
        </header>

        <section className="mt-8">
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
                      estado === "listo" ? "bg-sage text-ink" : "bg-teal text-cream"
                    }`}
                  >
                    {accionLabel[estado]}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
