# Café Connect

royecto: CaféNFC

La idea sería colocar un sticker NFC en cada mesa de la cafetería.

📱 ¿Qué pasa cuando el cliente acerca el celular?

Cliente
   ↓
Acerca celular al NFC
   ↓
PWA de la cafetería
   ↓
Menú digital
   ↓
Elige productos
   ↓
Envía pedido
   ↓
Cocina / mozo recibe pedido

🧾 El cliente podría:

 Ver el menú.

 Ver fotos y precios.

 Elegir productos.

 Personalizar el pedido.

 Enviar el pedido.

 Ver el estado:

 🟡 Pendiente

 🔵 Preparando

 🟢 Listo

 Solicitar la cuenta.

👨‍🍳 Panel de la cafetería

El administrador podría tener:

Pedidos

 Mesa 5

 2 cafés

 1 sándwich

 Total: Gs. 35.000

 Estado: Preparando

Y botones:

ACEPTAR → PREPARANDO → LISTO → ENTREGADO

🔐 NFC diferente para cada mesa

Por ejemplo:

Mesa 1 → NFC001
Mesa 2 → NFC002
Mesa 3 → NFC003
Mesa 4 → NFC004

Así, cuando alguien escanea el NFC de la mesa 3, el sistema ya sabe que el pedido corresponde a esa mesa.

🛠️ Tecnologías

Podrías hacerlo con:

Frontend

 HTML

 CSS

 JavaScript

 PWA / Service Worker

Backend

 PHP o Java

Base de datos

 MySQL

NFC

 Sticker NFC con una URL única por mesa.

💡 Nombre

Podrías llamarlo:

☕ CaféNFC — Menú y pedidos inteligentes

NFC + PWA + base de datos + CRUD + pedidos + usuarios + panel administrativo + estados de pedido.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2b6ab1d3-58b8-41d2-9267-47ff094d9195).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
