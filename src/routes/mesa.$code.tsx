import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { collection, query, where, getDocs, limit, orderBy, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { gs, imagenDe, estadoLabel, type Estado } from "@/lib/cafe";
import { toast } from "sonner";

export const Route = createFileRoute("/mesa/$code")({
  head: () => ({
    meta: [
      { title: "Tu mesa — CaféNFC" },
      {
        name: "description",
        content: "Menú digital de la mesa: elegí productos, personalizá y seguí el estado del pedido.",
      },
      { property: "og:title", content: "Tu mesa — CaféNFC" },
      {
        property: "og:description",
        content: "Elegí productos, personalizá y seguí el estado de tu pedido en vivo.",
      },
    ],
  }),
  component: MesaPage,
});

type LineaCarrito = {
  menu_item_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  personalizacion: string;
};

function MesaPage() {
  const { code } = Route.useParams();
  const qc = useQueryClient();
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [opciones, setOpciones] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const { data: mesa } = useQuery({
    queryKey: ["mesa", code],
    queryFn: async () => {
      const q = query(collection(db, "mesas"), where("nfc_code", "==", code), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error("Mesa no encontrada");
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as any;
    },
  });

  const { data: menu } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const q = query(collection(db, "menu_items"), where("disponible", "==", true));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      return items.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    },
  });

  const { data: pedido } = useQuery({
    queryKey: ["pedido-mesa", mesa?.id],
    enabled: !!mesa?.id,
    refetchInterval: 4000,
    queryFn: async () => {
      const q = query(
        collection(db, "pedidos"),
        where("mesa_id", "==", mesa!.id),
        orderBy("created_at", "desc"),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      const activo = docs.find((d) => d.estado !== "entregado");
      return activo || null;
    },
  });

  const total = carrito.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const cantidad = carrito.reduce((s, l) => s + l.cantidad, 0);

  function agregar(item: NonNullable<typeof menu>[number]) {
    const personalizacion = opciones[item.id] ?? "";
    setCarrito((prev) => {
      const i = prev.findIndex(
        (l) => l.menu_item_id === item.id && l.personalizacion === personalizacion,
      );
      const existente = i >= 0 ? prev[i] : undefined;
      if (existente) {
        const copia = [...prev];
        copia[i] = { ...existente, cantidad: existente.cantidad + 1 };
        return copia;
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: 1,
          personalizacion,
        },
      ];
    });
    toast.success(`${item.nombre} agregado`);
  }

  function quitar(index: number) {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  }

  async function enviarPedido() {
    if (!mesa || carrito.length === 0) return;
    setEnviando(true);
    try {
      const items = carrito.map((l) => ({
        menu_item_id: l.menu_item_id,
        nombre: l.nombre,
        cantidad: l.cantidad,
        precio_unitario: l.precio,
        personalizacion: l.personalizacion,
      }));
      await addDoc(collection(db, "pedidos"), {
        mesa_id: mesa.id,
        mesa_numero: mesa.numero,
        nfc_code: mesa.nfc_code,
        total,
        estado: "pendiente",
        items,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setCarrito([]);
      toast.success("Pedido enviado a la cocina");
      qc.invalidateQueries({ queryKey: ["pedido-mesa", mesa.id] });
    } catch (e) {
      toast.error("No pudimos enviar el pedido");
    } finally {
      setEnviando(false);
    }
  }

  async function pedirCuenta() {
    if (!pedido) {
      toast.error("Todavía no tenés un pedido activo");
      return;
    }
    await updateDoc(doc(db, "pedidos", pedido.id), { cuenta_solicitada: true });
    qc.invalidateQueries({ queryKey: ["pedido-mesa", mesa?.id] });
    toast.success("Avisamos al mozo");
  }

  const estado = (pedido?.estado ?? "pendiente") as Estado;

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
          <Link to="/" className="flex items-center gap-3">
            <span className="size-14 rounded-2xl bg-brand grid place-items-center text-2xl shadow-[5px_5px_0_var(--ink)]">
              ☕
            </span>
            <div>
              <p className="font-display font-bold text-3xl leading-none">CaféNFC</p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink/50">
                Menú y pedidos inteligentes
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-ink text-cream px-4 py-2 flex items-center gap-2 shadow-[4px_4px_0_var(--brand)]">
              <span className="size-6 rounded-full bg-sun grid place-items-center text-ink text-sm">
                📍
              </span>
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-wider text-cream/60">Tu mesa</p>
                <p className="font-display font-semibold">
                  {mesa ? `Mesa ${mesa.numero} · ${mesa.nfc_code}` : "Buscando…"}
                </p>
              </div>
            </div>
            <button
              onClick={pedirCuenta}
              className="rounded-2xl bg-sun px-5 py-3 font-display font-semibold shadow-[4px_4px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Solicitar cuenta
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8 mt-10">
          <section className="lg:col-span-7">
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-display font-bold text-5xl">
                Elegí tu <span className="text-brand">pedido</span>
              </h2>
              <span className="rounded-full bg-teal text-cream text-xs font-bold px-3 py-1">
                Menú digital
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {menu?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-white p-4 shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5"
                >
                  <img
                    src={imagenDe(item.imagen)}
                    alt={item.nombre}
                    loading="lazy"
                    width={816}
                    height={816}
                    className="w-full aspect-square rounded-2xl object-cover"
                  />
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-semibold text-lg">{item.nombre}</p>
                      <p className="text-sm text-ink/50">{item.descripcion}</p>
                    </div>
                    <p className="font-display font-bold text-brand whitespace-nowrap">
                      {gs(item.precio)}
                    </p>
                  </div>
                  {item.opciones.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.opciones.map((op) => {
                        const activa = opciones[item.id] === op;
                        return (
                          <button
                            key={op}
                            onClick={() =>
                              setOpciones((prev) => ({ ...prev, [item.id]: activa ? "" : op }))
                            }
                            className={`text-xs rounded-full px-2.5 py-1 ${
                              activa ? "bg-brand text-cream font-semibold" : "bg-cream"
                            }`}
                          >
                            {op}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <button
                    onClick={() => agregar(item)}
                    className="mt-4 w-full rounded-2xl bg-sun py-3 font-display font-semibold shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    Agregar +
                  </button>
                </div>
              ))}
            </div>
          </section>

          <aside className="lg:col-span-5">
            <div className="rounded-[28px] bg-ink text-cream p-6 shadow-[8px_8px_0_var(--brand)]">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-2xl">Tu pedido</h3>
                <span className="bg-brand rounded-full size-8 grid place-items-center font-bold">
                  {cantidad}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {carrito.length === 0 && (
                  <li className="text-sm text-cream/50 bg-white/5 rounded-2xl px-4 py-3">
                    Todavía no agregaste nada.
                  </li>
                )}
                {carrito.map((l, i) => (
                  <li
                    key={`${l.menu_item_id}-${l.personalizacion}`}
                    className="flex justify-between items-center bg-white/5 rounded-2xl px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {l.cantidad} × {l.nombre}
                      </p>
                      {l.personalizacion && (
                        <p className="text-xs text-cream/50">{l.personalizacion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-display font-semibold">{gs(l.precio * l.cantidad)}</p>
                      <button
                        onClick={() => quitar(i)}
                        aria-label="Quitar"
                        className="text-cream/40 hover:text-brand"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between items-end border-t border-white/15 pt-4">
                <p className="text-cream/60 text-sm">Total</p>
                <p className="font-display font-bold text-4xl text-sun">{gs(total)}</p>
              </div>
              <button
                onClick={enviarPedido}
                disabled={carrito.length === 0 || enviando}
                className="mt-5 w-full rounded-2xl bg-brand py-4 font-display font-bold text-xl shadow-[4px_4px_0_var(--sun)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40"
              >
                Enviar pedido →
              </button>
              <div className="mt-4 flex items-center gap-2 text-sm text-cream/70">
                <span className="size-3 rounded-full bg-sun" />
                {pedido
                  ? `Pedido ${estadoLabel[estado].toLowerCase()} · Mesa ${mesa?.numero}`
                  : "Sin pedidos activos"}
              </div>
            </div>

            <div className="mt-6 rounded-[28px] bg-white p-5 shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40">
                Estado en vivo
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["pendiente", "preparando", "listo"] as const).map((e, i) => {
                  const activo = pedido && estado === e;
                  return (
                    <div
                      key={e}
                      className={`rounded-2xl p-3 text-center ${
                        activo ? "bg-sun/30 ring-2 ring-brand" : "bg-cream"
                      }`}
                    >
                      <span className="text-2xl">{["🟡", "🔵", "🟢"][i]}</span>
                      <p
                        className={`text-xs font-bold mt-1 ${activo ? "text-brand" : ""}`}
                      >
                        {estadoLabel[e]}
                      </p>
                    </div>
                  );
                })}
              </div>
              {pedido?.cuenta_solicitada && (
                <p className="mt-3 text-sm font-semibold text-brand">
                  🧾 Cuenta solicitada · el mozo ya fue avisado
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
