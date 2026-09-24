import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gracias")({
  component: GraciasPage,
});

function GraciasPage() {
  return (
    <div className="min-h-screen bg-cream text-ink font-body relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      <div
        className="pointer-events-none absolute -top-20 -left-16 size-72 rounded-full bg-sun/40"
        style={{ animation: "floaty 6s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-teal/20"
        style={{ animation: "floaty 8s ease-in-out infinite" }}
      />
      
      <div className="z-10 bg-white rounded-3xl p-8 shadow-[8px_8px_0_var(--brand)] max-w-sm mx-auto border-2 border-ink/5">
        <span className="text-6xl mb-4 block">👋</span>
        <h1 className="font-display font-bold text-3xl mb-4">¡Gracias por tu visita!</h1>
        <p className="text-ink/60 mb-6">Tu pedido ha sido finalizado. Si querés pedir otra cosa en el futuro, por favor volvé a escanear el código NFC de tu mesa.</p>
        
        <p className="text-sm font-bold text-brand">Ya podés cerrar esta página.</p>
      </div>
    </div>
  );
}
