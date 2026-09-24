import { useEffect, useState } from "react";
import { estadoLabel, accionLabel, type Estado } from "@/lib/cafe";

interface KanbanCardProps {
  pedido: any;
  onAvanzar: (id: string, estado: Estado) => void;
}

export function KanbanCard({ pedido, onAvanzar }: KanbanCardProps) {
  const [elapsed, setElapsed] = useState("");
  const estado = pedido.estado as Estado;

  useEffect(() => {
    const updateTime = () => {
      const diff = Date.now() - new Date(pedido.created_at).getTime();
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [pedido.created_at]);

  const isLate = estado === "pendiente" && Date.now() - new Date(pedido.created_at).getTime() > 5 * 60000;

  return (
    <div className={`rounded-3xl p-5 shadow-[4px_4px_0_var(--ink)] border-2 flex flex-col h-full ${isLate ? 'border-brand bg-brand/5' : 'border-ink/5 bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-2xl">Mesa {pedido.mesa_numero}</p>
          <span className="bg-sun/40 text-ink text-xs font-bold px-2 py-0.5 rounded-md">
            {pedido.nfc_code}
          </span>
        </div>
        <div className={`text-sm font-bold px-2 py-1 rounded-lg ${isLate ? 'bg-brand text-cream' : 'bg-cream text-ink'}`}>
          ⏱ {elapsed}
        </div>
      </div>
      
      <ul className="text-ink/80 space-y-2 mb-4 flex-1">
        {(pedido.items || []).map((it: any, i: number) => (
          <li key={i} className="flex gap-2 text-sm leading-tight">
            <span className="font-bold min-w-[20px]">{it.cantidad}x</span>
            <div>
              <p className="font-semibold">{it.nombre}</p>
              {it.personalizacion && (
                <p className="text-xs text-brand font-medium">{it.personalizacion}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      
      {pedido.cuenta_solicitada && (
        <div className="mb-4 bg-sun/30 text-ink text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-2">
          🧾 Cliente pide la cuenta
        </div>
      )}

      <button
        onClick={() => onAvanzar(pedido.id, estado)}
        className={`w-full mt-auto rounded-2xl py-3 font-display font-bold shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-colors ${
          estado === "pendiente" ? "bg-sun text-ink hover:bg-sun/80"
          : estado === "preparando" ? "bg-teal text-cream hover:bg-teal/80"
          : estado === "listo" ? "bg-sage text-ink hover:bg-sage/80"
          : "bg-ink text-cream hover:bg-ink/80"
        }`}
      >
        {accionLabel[estado]}
      </button>
    </div>
  );
}
