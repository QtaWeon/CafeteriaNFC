import { useState, useEffect } from "react";
import { gs } from "@/lib/cafe";
import { toast } from "sonner";

interface PaymentPanelProps {
  total: number;
  onSuccess: () => void;
  onCash: () => void;
  onClose: () => void;
}

export function PaymentPanel({ total, onSuccess, onCash, onClose }: PaymentPanelProps) {
  const [propinaPct, setPropinaPct] = useState(10);
  const propina = (total * propinaPct) / 100;
  const final = total + propina;

  const [estadoPago, setEstadoPago] = useState<"idle" | "reading" | "success" | "mp_fallback" | "transferencia">("idle");

  async function handleTapToPay() {
    if ("NDEFReader" in window) {
      setEstadoPago("reading");
      try {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        ndef.addEventListener("reading", () => {
          setEstadoPago("success");
          setTimeout(onSuccess, 1500);
        });
      } catch (error) {
        console.warn("NFC error:", error);
        toast.error("Error al iniciar el lector NFC.");
        setEstadoPago("mp_fallback");
      }
    } else {
      setEstadoPago("mp_fallback");
    }
  }

  if (estadoPago === "transferencia") {
    return (
      <div className="bg-white rounded-[28px] p-6 shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={() => setEstadoPago("idle")} className="absolute top-4 right-4 text-ink/40 hover:text-ink font-bold text-xl">✕</button>
        <h3 className="font-display font-bold text-2xl mb-1">Efectivo o Transferencia</h3>
        <p className="text-ink/60 text-sm mb-6">Monto total a pagar: <strong className="text-ink">{gs(final)}</strong></p>
        
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
          Avisar al mozo
        </button>
      </div>
    );
  }

  if (estadoPago === "mp_fallback") {
    return (
      <div className="bg-white rounded-[28px] p-6 text-center shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-ink/40 hover:text-ink font-bold text-xl">✕</button>
        <div className="size-16 bg-[#009EE3] rounded-2xl mx-auto flex items-center justify-center mb-4 mt-2">
           <span className="text-white font-bold text-2xl tracking-tighter">mp</span>
        </div>
        <h3 className="font-display font-bold text-2xl mb-2">Pagar con Mercado Pago</h3>
        <p className="text-ink/60 text-sm mb-6 px-2">
          Tu dispositivo no soporta NFC. Podés completar el pago de forma segura a través de Mercado Pago.
        </p>
        
        <button
          onClick={() => {
            // NOTA: Reemplazá este enlace con tu Link de Pago real de MP
            // Usando un link real temporal para que no tire error de DNS
            window.open("https://www.mercadopago.com", "_blank");
            
            // Simulación: Asumimos que el pago se completó para avanzar la demo.
            // En producción, deberías esperar a un Webhook de MP que actualice Firebase.
            setTimeout(() => {
              setEstadoPago("success");
              setTimeout(onSuccess, 1500);
            }, 3000);
          }}
          className="w-full rounded-2xl bg-[#009EE3] text-white py-4 font-bold text-lg shadow-[4px_4px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Pagar {gs(final)} en MP
        </button>

        <button
          onClick={() => setEstadoPago("transferencia")}
          className="mt-4 w-full rounded-2xl bg-cream text-ink py-4 font-bold text-lg border-2 border-ink/10 active:bg-ink/5"
        >
          Efectivo o Transferencia
        </button>
      </div>
    );
  }

  if (estadoPago === "reading" || estadoPago === "success") {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 flex flex-col items-center justify-center min-h-[300px]">
        {estadoPago === "reading" ? (
          <>
            <span className="size-20 rounded-full bg-brand/20 text-brand text-4xl grid place-items-center mb-6 animate-pulse">
              📡
            </span>
            <h3 className="font-display font-bold text-2xl">Acercá tu dispositivo</h3>
            <p className="text-ink/60 mt-2">Mantené tu tarjeta NFC o celular cerca del lector</p>
          </>
        ) : (
          <>
            <span className="size-20 rounded-full bg-sage text-ink text-4xl grid place-items-center mb-6">
              ✅
            </span>
            <h3 className="font-display font-bold text-2xl text-sage">¡Pago Exitoso!</h3>
            <p className="text-ink/60 mt-2">Pagaste {gs(final)}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] p-6 shadow-[6px_6px_0_var(--ink)] border-2 border-ink/5 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-ink/40 hover:text-ink font-bold text-xl">✕</button>
      <h3 className="font-display font-bold text-2xl mb-1">Pago NFC</h3>
      <p className="text-ink/60 text-sm mb-6">Seleccioná la propina y apoyá tu celular</p>

      <div className="space-y-4">
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

      <button
        onClick={handleTapToPay}
        className="mt-6 w-full rounded-2xl bg-brand text-cream py-4 font-display font-bold text-xl shadow-[4px_4px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-3"
      >
        <span>📡</span> Tap to Pay
      </button>

      <button
        onClick={() => setEstadoPago("transferencia")}
        className="mt-4 w-full rounded-2xl bg-cream text-ink py-4 font-bold text-lg border-2 border-ink/10 active:bg-ink/5 flex items-center justify-center gap-3"
      >
        <span>💵</span> Efectivo o Transferencia
      </button>
    </div>
  );
}
