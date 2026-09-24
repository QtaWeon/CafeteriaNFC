import { useState } from "react";
import { gs } from "@/lib/cafe";

interface PaymentPanelProps {
  total: number;
  onCash: () => void;
  onClose: () => void;
}

export function PaymentPanel({ total, onCash, onClose }: PaymentPanelProps) {
  const [propinaPct, setPropinaPct] = useState(10);
  const propina = (total * propinaPct) / 100;
  const final = total + propina;

  return (
    <div className="bg-white rounded-[28px] p-6 shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 relative animate-in fade-in zoom-in-95 duration-200">
      <button onClick={onClose} className="absolute top-4 right-4 text-ink/40 hover:text-ink font-bold text-xl">✕</button>
      <h3 className="font-display font-bold text-2xl mb-1">Pago del Pedido</h3>
      <p className="text-ink/60 text-sm mb-6">Seleccioná la propina y realizá el pago</p>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center text-ink/70">
          <span>Subtotal</span>
          <span className="font-display font-semibold text-lg">{gs(total)}</span>
        </div>
        
        <div>
          <p className="text-sm font-bold mb-2">Propina</p>
          <div className="flex gap-2">
            {[0, 5, 10, 15].map(pct => (
              <button
                key={pct}
                onClick={() => setPropinaPct(pct)}
                className={`flex-1 rounded-xl py-2 font-bold transition-all shadow-[2px_2px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                  propinaPct === pct ? "bg-sun text-ink" : "bg-cream text-ink hover:bg-sun/40"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center border-t-2 border-ink/5 pt-4">
          <span className="font-bold">Total a Pagar</span>
          <span className="font-display font-bold text-2xl text-brand">{gs(final)}</span>
        </div>
      </div>

      <div className="bg-cream p-4 rounded-2xl text-sm space-y-3 mb-6 border-2 border-ink/5">
        <div className="flex justify-between items-center">
          <span className="text-ink/60">Titular</span>
          <span className="font-bold">Giovanni Portillo</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-ink/60">Documento / Alias</span>
          <span className="font-bold text-lg text-brand bg-brand/10 px-2 py-0.5 rounded-lg">6670901</span>
        </div>
        <div className="mt-4 pt-4 border-t-2 border-ink/10 text-center">
          <p className="text-ink/60 text-xs mb-2">Enviar comprobante al WhatsApp:</p>
          <a 
            href={`https://wa.me/595992351545?text=Hola,%20acá%20está%20el%20comprobante%20de%20mi%20pedido%20por%20${gs(final)}`} 
            target="_blank" 
            rel="noreferrer" 
            className="font-bold text-ink bg-[#25D366]/20 px-4 py-2 rounded-xl inline-block"
          >
            📱 0992 351 545
          </a>
        </div>
      </div>

      <button
        onClick={onCash}
        className="w-full rounded-2xl bg-brand text-cream py-4 font-display font-bold text-lg shadow-[4px_4px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        Notificar Pago y Salir
      </button>
    </div>
  );
}
