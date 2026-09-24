import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, getDocs, doc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export function MesaManager() {
  const qc = useQueryClient();
  const [agregando, setAgregando] = useState(false);

  const { data: mesas, isLoading } = useQuery({
    queryKey: ["mesas-admin"],
    queryFn: async () => {
      const q = query(collection(db, "mesas"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      return items.sort((a, b) => a.numero - b.numero);
    },
  });

  async function eliminarMesa(id: string) {
    if (!confirm("¿Seguro que querés eliminar esta mesa?")) return;
    try {
      await deleteDoc(doc(db, "mesas", id));
      qc.invalidateQueries({ queryKey: ["mesas-admin"] });
      toast.success("Mesa eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  }

  async function agregarMesa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const numero = Number(form.get("numero"));
    const nfc_code = form.get("nfc_code") as string;
    
    try {
      await addDoc(collection(db, "mesas"), {
        numero,
        nfc_code,
      });
      setAgregando(false);
      qc.invalidateQueries({ queryKey: ["mesas-admin"] });
      toast.success("Mesa agregada");
    } catch (error) {
      toast.error("Error al agregar");
    }
  }

  if (isLoading) return <p className="text-center py-10 opacity-50">Cargando mesas...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-bold text-2xl">Administrar Mesas & NFC</h2>
        <button
          onClick={() => setAgregando(!agregando)}
          className="bg-brand text-cream px-4 py-2 rounded-xl font-bold shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          {agregando ? "Cancelar" : "+ Nueva Mesa"}
        </button>
      </div>

      {agregando && (
        <form onSubmit={agregarMesa} className="bg-white p-5 rounded-3xl shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 space-y-4">
          <h3 className="font-display font-bold text-lg">Nueva Mesa</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input required type="number" name="numero" placeholder="Número de Mesa (ej. 5)" className="bg-cream rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand" />
            <input required name="nfc_code" placeholder="Código NFC (ej. NFC005)" className="bg-cream rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <button type="submit" className="w-full bg-sun text-ink py-3 rounded-xl font-bold">
            Guardar Mesa
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mesas?.map((mesa) => (
          <div key={mesa.id} className="rounded-3xl bg-white p-5 shadow-[4px_4px_0_var(--ink)] border-2 border-ink/5 flex flex-col justify-center items-center text-center">
            <span className="text-4xl mb-2">📡</span>
            <p className="font-display font-bold text-xl">Mesa {mesa.numero}</p>
            <span className="mt-1 bg-sun/40 text-ink text-xs font-bold px-2 py-0.5 rounded-md">
              {mesa.nfc_code}
            </span>
            <button
              onClick={() => eliminarMesa(mesa.id)}
              className="mt-4 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
