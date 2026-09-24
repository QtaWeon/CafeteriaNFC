import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { collection, query, where, getDocs, limit, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { gs, imagenDe, estadoLabel, type Estado, type Categoria } from "@/lib/cafe";
import { toast } from "sonner";
import { CategoryTabs } from "@/components/CategoryTabs";
import { PaymentPanel } from "@/components/PaymentPanel";

export const Route = createFileRoute("/mesa/$code")({
  head: () => ({
    meta: [
      { title: "Tu mesa — CaféNFC" },
      {
        name: "description",
        content: "Menú digital de la mesa: elegí productos, personalizá y seguí el estado del pedido.",
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
  
  const [categoria, setCategoria] = useState<Categoria | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [pagando, setPagando] = useState(false);

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
        where("estado", "!=", "finalizado")
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      
      const activosMesa = docs
        .filter((d) => d.mesa_id === mesa!.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
      return activosMesa.length > 0 ? activosMesa[0] : null;
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

  async function handlePaymentSuccess() {
    if (pedido) {
      await updateDoc(doc(db, "pedidos", pedido.id), {
        estado: "finalizado",
        pagado_nfc: true,
        updated_at: new Date().toISOString()
      });
      qc.invalidateQueries({ queryKey: ["pedido-mesa", mesa?.id] });
      toast.success("¡Pago exitoso! Gracias por venir.");
    }
    setPagando(false);
  }

  const estado = (pedido?.estado ?? "pendiente") as Estado;

  const menuFiltrado = menu?.filter(item => {
    const matchCat = categoria === "todas" || item.categoria === categoria;
    const matchSearch = busqueda === "" || item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (item.descripcion || "").toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchSearch;
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
        <header className="flex items-center justify-between gap-4 flex-wrap mb-10">
          <Link to="/" className="flex items-center gap-3">
            <span className="size-14 rounded-2xl bg-brand grid place-items-center text-2xl shadow-[5px_5px_0_var(--ink)]">
              ☕
            </span>
            <div>
              <p className="font-display font-bold text-3xl leading-none">CaféNFC</p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink/50">
                Menú digital
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
                  {mesa ? `Mesa ${mesa.numero}` : "Buscando…"}
                </p>
              </div>
            </div>
            <button
              onClick={() => pedido ? setPagando(true) : pedirCuenta()}
              className="rounded-2xl bg-sun px-5 py-3 font-display font-semibold shadow-[4px_4px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Pagar Cuenta
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          <section className="lg:col-span-7">
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-display font-bold text-5xl">
                  Nuestro <span className="text-brand">menú</span>
                </h2>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full sm:w-64 bg-white rounded-2xl py-3 pl-10 pr-4 outline-none border-2 border-ink/10 focus:border-brand shadow-[4px_4px_0_var(--ink)]"
                  />
                </div>
              </div>
              
              <CategoryTabs activa={categoria} onChange={setCategoria} />
            </div>

            {menuFiltrado?.length === 0 ? (
              <div className="text-center py-10 bg-white/50 rounded-3xl border-2 border-dashed border-ink/20">
                <p className="text-xl">No encontramos productos 😢</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {menuFiltrado?.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl bg-white p-4 shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 flex flex-col"
                  >
                    <img
                      src={imagenDe(item.imagen)}
                      alt={item.nombre}
                      loading="lazy"
                      className="w-full aspect-square rounded-2xl object-cover"
                    />
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-semibold text-lg leading-tight">{item.nombre}</p>
                        <p className="text-sm text-ink/50 leading-snug">{item.descripcion}</p>
                      </div>
                      <p className="font-display font-bold text-brand whitespace-nowrap">
                        {gs(item.precio)}
                      </p>
                    </div>
                    {item.opciones && item.opciones.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.opciones.map((op: string) => {
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
                      className="mt-auto pt-4"
                    >
                      <div className="w-full rounded-2xl bg-sun py-3 font-display font-semibold shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--ink)] text-center text-ink">
                        Agregar +
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:col-span-5 space-y-6">
            {pagando && pedido ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <PaymentPanel
                  total={pedido.total}
                  onClose={() => setPagando(false)}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            ) : (
              <div className="rounded-[28px] bg-ink text-cream p-6 shadow-[8px_8px_0_var(--brand)] sticky top-6">
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
                      key={`${l.menu_item_id}-${l.personalizacion}-${i}`}
                      className="flex justify-between items-center bg-white/5 rounded-2xl px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold">
                          {l.cantidad} × {l.nombre}
                        </p>
                        {l.personalizacion && (
                          <p className="text-xs text-brand font-bold">{l.personalizacion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-display font-semibold">{gs(l.precio * l.cantidad)}</p>
                        <button
                          onClick={() => quitar(i)}
                          aria-label="Quitar"
                          className="text-cream/40 hover:text-brand bg-white/5 rounded-full size-6 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-between items-end border-t border-white/15 pt-4">
                  <p className="text-cream/60 text-sm">Subtotal</p>
                  <p className="font-display font-bold text-4xl text-sun">{gs(total)}</p>
                </div>
                <button
                  onClick={enviarPedido}
                  disabled={carrito.length === 0 || enviando}
                  className="mt-5 w-full rounded-2xl bg-brand py-4 font-display font-bold text-xl shadow-[4px_4px_0_var(--sun)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:active:translate-x-0 disabled:active:shadow-[4px_4px_0_var(--sun)] transition-all"
                >
                  Confirmar a Cocina →
                </button>
                
                <div className="mt-6 flex flex-col gap-3 p-4 bg-white/10 rounded-2xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cream/70">Estado del Pedido</span>
                    <span className="font-bold text-brand">{pedido ? estadoLabel[estado] : "Ninguno"}</span>
                  </div>
                  {pedido && (
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-brand h-full transition-all duration-1000 ease-in-out" 
                        style={{ 
                          width: estado === 'pendiente' ? '25%' : 
                                estado === 'preparando' ? '50%' : 
                                estado === 'listo' ? '75%' : '100%' 
                        }} 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
