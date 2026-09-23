import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CaféNFC — Acercá tu celular a la mesa" },
      {
        name: "description",
        content:
          "Simulá el sticker NFC de cada mesa, abrí el menú digital y hacé el pedido desde tu celular.",
      },
      { property: "og:title", content: "CaféNFC — Acercá tu celular a la mesa" },
      {
        property: "og:description",
        content: "Menú digital, pedidos por mesa y panel de cocina en tiempo real.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: mesas } = useQuery({
    queryKey: ["mesas"],
    queryFn: async () => {
      const q = query(collection(db, "mesas"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
      return items.sort((a, b) => a.numero - b.numero);
    },
  });

  return (
    <div className="min-h-screen bg-cream text-ink font-body relative overflow-hidden">
      {/* Blobs decorativos */}
      <div
        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-sun/30"
        style={{ animation: "floaty 6s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 -right-32 size-[28rem] rounded-full bg-teal/15"
        style={{ animation: "floaty 8s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 size-64 rounded-full bg-brand/10"
        style={{ animation: "floaty 10s ease-in-out infinite" }}
      />

      <div className="max-w-5xl mx-auto px-6 py-8 relative">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="size-14 rounded-2xl bg-brand grid place-items-center text-2xl shadow-[5px_5px_0_var(--ink)]">
              ☕
            </span>
            <div>
              <p className="font-display font-bold text-3xl leading-none">CaféNFC</p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink/50">
                Menú y pedidos inteligentes
              </p>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="mt-16 mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-ink/10 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="size-2 rounded-full bg-brand animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-ink/60">Sistema en vivo</p>
          </div>
          <h1 className="font-display font-bold text-5xl sm:text-7xl leading-[1.05]">
            Acercá tu celular al{" "}
            <span
              className="text-brand relative inline-block"
              style={{ textShadow: "3px 3px 0 var(--sun)" }}
            >
              sticker de tu mesa
            </span>
          </h1>
          <p className="mt-6 text-xl text-ink/60 max-w-xl mx-auto leading-relaxed">
            Cada mesa tiene su propio código NFC. Al escanearlo se abre el menú digital y la cocina
            ya sabe de qué mesa viene el pedido.
          </p>
        </div>

        {/* Mesas */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-ink/40 text-center mb-6">
            — Tocá una mesa para simular el escaneo NFC —
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {mesas?.map((mesa, idx) => (
              <Link
                key={mesa.id}
                to="/mesa/$code"
                params={{ code: mesa.nfc_code }}
                className="group rounded-3xl bg-white p-6 text-center shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 transition-all duration-150 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--ink)] active:translate-y-0.5 active:shadow-[3px_3px_0_var(--ink)]"
              >
                <span
                  className="text-4xl block"
                  style={{ animation: `floaty ${6 + idx * 0.8}s ease-in-out infinite` }}
                >
                  📡
                </span>
                <p className="mt-3 font-display font-bold text-2xl">Mesa {mesa.numero}</p>
                <p className="mt-1 text-xs font-bold tracking-widest text-ink/40">{mesa.nfc_code}</p>
                <div className="mt-4 bg-sun/20 group-hover:bg-sun/40 transition-colors rounded-xl py-2 text-xs font-bold text-ink/70">
                  Escanear ↗
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer banner */}
        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink text-cream p-6 shadow-[6px_6px_0_var(--brand)]">
          <div>
            <p className="font-display font-bold text-xl">Un sticker por mesa, un pedido siempre ubicado</p>
            <p className="text-cream/60 text-sm mt-1">Sistema de pedidos sin contacto · 100% digital</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 rounded-2xl px-4 py-2">
            <span
              className="size-8 rounded-lg bg-brand grid place-items-center"
              style={{ animation: "spinny 12s linear infinite" }}
            >
              📡
            </span>
            <span className="text-cream/80">
              {mesas?.map(m => m.nfc_code).join(" · ") || "NFC001 · NFC002 · NFC003 · NFC004"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
