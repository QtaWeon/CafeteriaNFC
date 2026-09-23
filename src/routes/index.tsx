import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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
      const q = query(collection(db, "mesas"), orderBy("numero"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
    },
  });

  return (
    <div className="min-h-screen bg-cream text-ink font-body relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-20 -left-16 size-72 rounded-full bg-sun/40"
        style={{ animation: "floaty 6s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-teal/20"
        style={{ animation: "floaty 8s ease-in-out infinite" }}
      />

      <div className="max-w-6xl mx-auto px-6 py-8 relative">
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
          <Link
            to="/panel"
            className="rounded-2xl bg-ink text-cream px-5 py-3 font-display font-semibold shadow-[4px_4px_0_var(--brand)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Panel de la cafetería
          </Link>
        </header>

        <div className="mt-12 max-w-2xl">
          <h1 className="font-display font-bold text-5xl sm:text-6xl leading-tight">
            Acercá tu celular al <span className="text-brand">sticker de tu mesa</span>
          </h1>
          <p className="mt-4 text-lg text-ink/60">
            Cada mesa tiene su propio código NFC. Al escanearlo se abre el menú digital y la cocina
            ya sabe de qué mesa viene el pedido.
          </p>
        </div>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/40">
            Simular escaneo NFC
          </p>
          <div className="mt-4 grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {mesas?.map((mesa) => (
              <Link
                key={mesa.id}
                to="/mesa/$code"
                params={{ code: mesa.nfc_code }}
                className="rounded-3xl bg-white p-5 text-center shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[3px_3px_0_var(--ink)]"
              >
                <span className="text-3xl">📡</span>
                <p className="mt-2 font-display font-bold text-xl">Mesa {mesa.numero}</p>
                <p className="text-xs font-semibold text-ink/40">{mesa.nfc_code}</p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-sun/25 border-2 border-ink/10 p-5">
          <p className="font-display font-semibold text-lg">
            Un sticker por mesa, un pedido siempre ubicado
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span
              className="size-8 rounded-lg bg-ink text-cream grid place-items-center"
              style={{ animation: "spinny 12s linear infinite" }}
            >
              📡
            </span>
            NFC001 · NFC002 · NFC003 · NFC004
          </div>
        </footer>
      </div>
    </div>
  );
}
