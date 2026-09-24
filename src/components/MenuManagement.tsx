import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { gs, imagenDe, menuImages, categoriaLabel } from "@/lib/cafe";

export function MenuManagement() {
  const qc = useQueryClient();
  const [agregando, setAgregando] = useState(false);

  const { data: menu, isLoading } = useQuery({
    queryKey: ["menu-admin"],
    queryFn: async () => {
      const q = query(collection(db, "menu_items"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      return items.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    },
  });

  async function toggleDisponible(id: string, actual: boolean) {
    try {
      await updateDoc(doc(db, "menu_items", id), { disponible: !actual });
      qc.invalidateQueries({ queryKey: ["menu-admin"] });
      toast.success(actual ? "Producto ocultado" : "Producto disponible");
    } catch (error) {
      toast.error("Error al actualizar");
    }
  }

  async function eliminarProducto(id: string) {
    if (!confirm("¿Seguro que querés eliminar este producto?")) return;
    try {
      await deleteDoc(doc(db, "menu_items", id));
      qc.invalidateQueries({ queryKey: ["menu-admin"] });
      toast.success("Producto eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  }

  async function agregarProducto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nombre = form.get("nombre") as string;
    const precio = Number(form.get("precio"));
    const categoria = form.get("categoria") as string;
    const imagen = form.get("imagen") as string;
    const descripcion = form.get("descripcion") as string;
    
    if (!nombre || nombre.trim().length === 0) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!precio || isNaN(precio) || precio <= 0) {
      toast.error("El precio debe ser un número mayor a 0");
      return;
    }
    
    try {
      await addDoc(collection(db, "menu_items"), {
        nombre,
        precio,
        descripcion,
        categoria,
        imagen,
        disponible: true,
        opciones: [],
        orden: (menu?.length || 0) + 1,
      });
      setAgregando(false);
      qc.invalidateQueries({ queryKey: ["menu-admin"] });
      toast.success("Producto agregado");
    } catch (error) {
      toast.error("Error al agregar");
    }
  }

  if (isLoading) return <p className="text-center py-10 opacity-50">Cargando menú...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-bold text-2xl">Administrar Menú</h2>
        <button
          onClick={() => setAgregando(!agregando)}
          className="bg-brand text-cream px-4 py-2 rounded-xl font-bold shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          {agregando ? "Cancelar" : "+ Nuevo Producto"}
        </button>
      </div>

      {agregando && (
        <form onSubmit={agregarProducto} className="bg-white p-5 rounded-3xl shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 space-y-4">
          <h3 className="font-display font-bold text-lg">Nuevo Producto</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input required name="nombre" placeholder="Nombre (ej. Cappuccino)" className="bg-cream rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand" />
            <input required type="number" name="precio" placeholder="Precio (ej. 15000)" className="bg-cream rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand" />
            <select required name="categoria" className="bg-cream rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand">
              {Object.entries(categoriaLabel).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select required name="imagen" className="bg-cream rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand">
              {Object.keys(menuImages).map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
            <input required name="descripcion" placeholder="Descripción corta" className="bg-cream rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand sm:col-span-2" />
          </div>
          <button type="submit" className="w-full bg-sun text-ink py-3 rounded-xl font-bold">
            Guardar Producto
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menu?.map((item) => (
          <div key={item.id} className={`rounded-3xl p-5 shadow-[4px_4px_0_var(--ink)] border-2 border-ink/5 flex flex-col ${item.disponible ? 'bg-white' : 'bg-ink/5 opacity-70'}`}>
            <div className="flex gap-4">
              <img src={imagenDe(item.imagen)} alt="" className="size-16 rounded-xl object-cover bg-cream" />
              <div className="flex-1">
                <p className="font-display font-bold text-lg leading-tight">{item.nombre}</p>
                <p className="font-bold text-brand">{gs(item.precio)}</p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 flex gap-2">
              <button
                onClick={() => toggleDisponible(item.id, item.disponible)}
                className={`flex-1 rounded-xl py-2 font-bold text-sm ${item.disponible ? 'bg-cream text-ink' : 'bg-sage text-ink'}`}
              >
                {item.disponible ? "Ocultar" : "Activar"}
              </button>
              <button
                onClick={() => eliminarProducto(item.id)}
                className="bg-red-500/10 text-red-600 px-4 rounded-xl font-bold"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
