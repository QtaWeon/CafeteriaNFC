import cappuccino from "@/assets/cappuccino.jpg";
import sandwich from "@/assets/sandwich.jpg";
import coldbrew from "@/assets/coldbrew.jpg";
import croissant from "@/assets/croissant.jpg";

export const menuImages: Record<string, string> = {
  cappuccino,
  sandwich,
  coldbrew,
  croissant,
};

export function imagenDe(key: string): string {
  return menuImages[key] ?? cappuccino;
}

export function gs(valor: any): string {
  if (typeof valor !== "number") {
    const parsed = Number(valor);
    valor = isNaN(parsed) ? 0 : parsed;
  }
  return "Gs " + valor.toLocaleString("es-PY");
}

export type Estado = "pendiente" | "preparando" | "listo" | "entregado" | "finalizado";

export const estadoLabel: Record<Estado, string> = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Servido",
  finalizado: "Finalizado",
};

export const estadoDot: Record<Estado, string> = {
  pendiente: "bg-sun",
  preparando: "bg-teal",
  listo: "bg-sage",
  entregado: "bg-brand",
  finalizado: "bg-ink/30",
};

export const siguienteEstado: Record<Estado, Estado | null> = {
  pendiente: "preparando",
  preparando: "listo",
  listo: "entregado",
  entregado: "finalizado",
  finalizado: null,
};

export const accionLabel: Record<Estado, string> = {
  pendiente: "ACEPTAR",
  preparando: "LISTO",
  listo: "SERVIR",
  entregado: "CERRAR MESA",
  finalizado: "",
};

export type Categoria = "cafe" | "fria" | "reposteria" | "snack";

export const categoriaLabel: Record<Categoria, string> = {
  cafe: "Cafés",
  fria: "Bebidas Frías",
  reposteria: "Repostería",
  snack: "Snacks",
};

export const categoriaEmoji: Record<Categoria, string> = {
  cafe: "☕",
  fria: "🧊",
  reposteria: "🥐",
  snack: "🥪",
};

export function formatHora(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" });
}
