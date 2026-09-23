import { doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

const mesas = [
  { numero: 1, nfc_code: "NFC001" },
  { numero: 2, nfc_code: "NFC002" },
  { numero: 3, nfc_code: "NFC003" },
  { numero: 4, nfc_code: "NFC004" },
];

const menu = [
  {
    disponible: true,
    orden: 1,
    nombre: "Café Americano",
    descripcion: "Clásico café negro largo, suave y equilibrado.",
    precio: 12000,
    imagen: "cafe-americano",
    opciones: ["Normal", "Doble", "Descafeinado"],
  },
  {
    disponible: true,
    orden: 2,
    nombre: "Sándwich de Miga",
    descripcion: "Jamón y queso tostado en pan de miga triple.",
    precio: 25000,
    imagen: "sandwich",
    opciones: ["Frío", "Caliente (Tostado)"],
  },
  {
    disponible: true,
    orden: 3,
    nombre: "Cheesecake de Frutos Rojos",
    descripcion: "Porción de cheesecake artesanal con salsa de frutos rojos.",
    precio: 22000,
    imagen: "cheesecake",
    opciones: [],
  },
];

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);

    // Mesas
    mesas.forEach((mesa) => {
      // Usamos el nfc_code como ID para simplificar o autogenerado
      const mesaRef = doc(db, "mesas", mesa.nfc_code);
      batch.set(mesaRef, mesa);
    });

    // Menu
    menu.forEach((item, i) => {
      const menuRef = doc(db, "menu_items", `item-${i + 1}`);
      batch.set(menuRef, item);
    });

    await batch.commit();
    console.log("✅ Base de datos sembrada con éxito");
  } catch (error) {
    console.error("❌ Error sembrando base de datos:", error);
  }
}
