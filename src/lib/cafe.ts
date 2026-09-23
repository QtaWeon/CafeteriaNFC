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

export function gs(valor: number): string {
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
