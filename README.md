# VNTG Hub

**E-commerce de coleccionables** — Funkos, figuras de acción, anime y gaming.

Plataforma completa con catálogo, carrito, wishlist, autenticación, pagos (Mercado Pago + cripto), chatbot con IA, panel administrador, panel de soporte, reproductor de video y más.

- **Live:** [vntg-hub.vercel.app](https://vntg-hub.vercel.app)
- **API:** [vntg-hub.onrender.com](https://vntg-hub.onrender.com)

---

## Tabla de Contenidos

- [Funcionalidades](#funcionalidades)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Páginas](#páginas-20)
- [Componentes Globales](#componentes-globales)
- [Contextos (Estado Global)](#contextos-estado-global)
- [API Backend](#api-backend)
- [Autenticación](#autenticación)
- [Medios de Pago](#medios-de-pago)
- [IA y Automatización](#ia-y-automatización)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Reglas de Desarrollo](#reglas-de-desarrollo)
- [Créditos](#créditos)

---

## Funcionalidades

### Catálogo y Productos
- Productos con variantes (color, tamaño, etc.), galería de imágenes, descuentos y stock
- Filtros por categoría, franquicia, rango de precio y búsqueda por texto
- Ordenamiento por precio (menor/mayor), nombre y novedades
- Vista de grilla con cards glassmorphism
- Vista detalle con galería interactiva (hover swap + zoom modal con drag)
- Especificaciones técnicas en acordeón
- Productos relacionados

### Carrito de Compras
- Persistente por sesión, sincronizado con el servidor cuando el usuario inicia sesión
- Selector de método de envío (retiro/local/prioritario)
- Barra de progreso para envío gratis
- Suma automática de descuentos por puntos
- Sidebar deslizable con resumen y acceso directo al checkout

### Wishlist (Favoritos)
- Agregar/quitar con un clic (corazón)
- Sidebar deslizable con lista de favoritos
- Botón "mover al carrito"
- Sincronización con el servidor

### Autenticación
- Registro con nombre, email, contraseña y DNI
- Inicio de sesión en dos pasos: email → código de verificación
- Google OAuth
- "Recordar dispositivo" (cookie persistente)
- Recuperación de contraseña por email

### Medios de Pago
- **Mercado Pago** — Tarjetas de crédito/débito, efectivo y transferencia
- **Criptomonedas** — USDT (TRC20), USDC, BTC, ETH, LTC, SOL vía NowPayments.io con dirección de depósito, QR y polling de estado
- **Transferencia bancaria** — Subida de comprobante (imagen)

### Chatbot con IA
- Asistente conversacional usando Groq (Llama 3)
- Consulta de órdenes por ID o email
- Preguntas frecuentes con botones rápidos
- Derivación a soporte humano (formulario de contacto)
- Historial de conversación con cooldown

### Panel de Administración
- CRUD completo de productos (imágenes, variantes, especificaciones)
- CRUD de categorías (con banner)
- Gestión de pedidos (cambio de estado, selección múltiple)
- Configuración de envíos (costos por método)
- Gestión de puntos y canjeo
- Vista de stock y catálogo completo

### Panel de Soporte
- Gestión de consultas y mensajes
- Filtrado por estado (nuevo, leído, respondido, cerrado)
- Búsqueda por texto
- Borrado múltiple
- Respuesta automática vía Gmail

### Sistema de Puntos
- Puntos por cada compra realizada
- Canjeables por descuentos en el checkout
- Página informativa con tabla de beneficios

### Multi-moneda
- Selector USD / ARS con banderas
- Tasa de cambio actualizada cada 60 segundos

### Modo Oscuro
- Toggle persistente con `next-themes`
- Estrategia `class` para personalización

### Diseño Responsive
- Adaptado desde 320px (mobile) hasta desktop
- Navegación adaptativa con menú hamburguesa

### Reproductor de Video Custom
- Skip -10s/+10s
- Timeline arrastrable
- Pantalla completa con bloqueo de orientación landscape
- Soporte Safari
- Spinner de carga y barra de progreso

### Tutoriales
- Videoteca con reproductor custom
- Múltiples videos organizados visualmente

### Sidebar de Categorías
- Navegación lateral con categorías y submenús por franquicia
- Enlaces útiles, ubicación y contacto

### Notificaciones Toast
- Sistema de notificaciones internas con imagen del producto
- Barra de progreso, animación de entrada/salida
- Auto-dismiss

### Otras Páginas Informativas
- Guía de autenticidad
- Envíos seguros
- Términos y condiciones
- Política de privacidad
- Contacto
- Página 404 con animación glitch

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.2.5 | UI |
| Vite | 8.0.10 | Bundler |
| React Router | 7.14.2 | Routing |
| Tailwind CSS | 3.4.19 | Estilos |
| Lucide React | 1.14.0 | Iconos |
| Axios | 1.15.2 | HTTP client |
| Clerk | 5.61.6 | Autenticación |
| @mercadopago/sdk-react | 1.0.7 | Pagos MP |
| next-themes | 0.4.6 | Modo oscuro |
| qrcode.react | 4.2.0 | QR |
| @react-oauth/google | — | Google OAuth |

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.2.1 | Framework |
| MySQL (mysql2) | 3.22.3 | Base de datos |
| JWT (jsonwebtoken) | 9.0.3 | Autenticación |
| Bcryptjs | 3.0.3 | Hash de contraseñas |
| Mercado Pago SDK | 2.12.0 | Pagos server-side |
| Groq SDK | 1.2.0 | Chatbot IA |
| Google Generative AI | 0.24.1 | Gemini |
| Nodemailer | 8.0.10 | Envío de emails |
| SendGrid | 8.1.6 | Email transaccional |
| Multer | 2.1.1 | Subida de archivos |
| Google APIs | 173.0.0 | Lectura Gmail |
| express-rate-limit | 8.5.2 | Rate limiting |
| cookie-parser | 1.4.7 | Cookies |
| cors | 2.8.6 | CORS |
| dotenv | 17.4.2 | Variables de entorno |
| ImapFlow | — | Lectura IMAP |
| mailparser | — | Parseo de emails |

### Infraestructura

| Servicio | Uso |
|---|---|
| Vercel | Hosting frontend |
| Render | Hosting backend |
| Railway | Base de datos MySQL |
| NowPayments.io | Pagos crypto |
| Mercado Pago | Pagos Argentina |
| Groq | API Chatbot (Llama 3) |
| Google Cloud | OAuth + Gmail API |
| Clerk | Gestión de usuarios |

---

## Estructura del Proyecto

```
vntg-hub/
├── client/
│   ├── public/
│   │   ├── favicon.webp
│   │   ├── logo_texto.webp
│   │   ├── logo_redondo.webp
│   │   ├── logo_promocional.webp
│   │   ├── logo-texto-transparente.webp
│   │   ├── wallpaper.webp
│   │   ├── ar.png
│   │   ├── us.png
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── utils/
│   │   │   └── slugify.js
│   │   ├── hooks/
│   │   │   └── useScrollReveal.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── CurrencyContext.jsx
│   │   │   ├── WishListContext.jsx
│   │   │   ├── SidebarContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── CartSidebar.jsx
│   │   │   ├── WishListSidebar.jsx
│   │   │   ├── CategorySidebar.jsx
│   │   │   ├── SidebarWrapper.jsx
│   │   │   ├── Reveal.jsx
│   │   │   ├── TypewriterText.jsx
│   │   │   ├── ScrollToTopOnNavigation.jsx
│   │   │   ├── RouteTitleManager.jsx
│   │   │   └── SubtleScrollToTop.jsx
│   │   └── pages/
│   │       ├── Inicio.jsx
│   │       ├── Categoria.jsx
│   │       ├── DetalleProducto.jsx
│   │       ├── Checkout.jsx
│   │       ├── PedidoDetalle.jsx
│   │       ├── MiCuenta.jsx
│   │       ├── Login.jsx
│   │       ├── Registro.jsx
│   │       ├── RecuperarPassword.jsx
│   │       ├── RestablecerPassword.jsx
│   │       ├── AdminPanel.jsx
│   │       ├── SupportPanel.jsx
│   │       ├── Puntos.jsx
│   │       ├── Tutoriales.jsx
│   │       ├── GuiaAutenticidad.jsx
│   │       ├── EnviosSeguros.jsx
│   │       ├── Contacto.jsx
│   │       ├── Terminos.jsx
│   │       ├── Privacidad.jsx
│   │       └── NotFound.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── vercel.json
│
├── server/
│   ├── index.js
│   ├── db.js
│   ├── shipping.js
│   ├── escaner.js
│   ├── imapPoller.js
│   ├── migrate-shipping-config.sql
│   ├── isrgrootx1.pem
│   └── uploads/
│
├── .gitignore
└── README.md
```

---

## Páginas (20)

| Ruta | Página | Descripción |
|---|---|---|
| `/` | **Inicio** | Hero con texto scrambled "VNTG HUB", typewriter con subtítulos dinámicos, carruseles de productos por categoría + recomendaciones personalizadas |
| `/categoria/:slug` | **Categoria** | Grilla de productos con filtros (precio, franquicia, ordenamiento) y búsqueda por `?search=` |
| `/producto/:slug` | **DetalleProducto** | Galería de imágenes con hover swap, zoom modal con drag, especificaciones en acordeón, wishlist/cart, productos relacionados |
| `/checkout` | **Checkout** | Dirección de envío, método de envío, canjeo de puntos, pago MP / crypto (QR + address) / transferencia (subir comprobante) |
| `/pedido/:id` | **PedidoDetalle** | Línea de tiempo del pedido, estado, reintento de pago crypto, QR, subida de comprobante |
| `/mi-cuenta` | **MiCuenta** | Editar perfil, historial de pedidos, direcciones guardadas, gestión de intereses |
| `/login` | **Login** | Email/password + Google OAuth, verificación en 2 pasos, recordar dispositivo |
| `/registro` | **Registro** | Formulario de registro con nombre, email, contraseña, DNI |
| `/recuperar-password` | **RecuperarPassword** | Formulario de recuperación de contraseña por email |
| `/restablecer-password` | **RestablecerPassword** | Restablecer contraseña con token |
| `/admin` | **AdminPanel** | CRUD productos (variantes, galería, specs), CRUD categorías (banner), pedidos (estado, selección múltiple), envíos, puntos |
| `/soporte` | **SupportPanel** | Gestión de tickets: filtro por estado, búsqueda, borrado múltiple, respuesta vía Gmail |
| `/puntos` | **Puntos** | Página informativa del sistema de puntos y beneficios |
| `/tutoriales` | **Tutoriales** | Videoteca con reproductor custom (skip, timeline, fullscreen landscape, Safari) |
| `/guia-autenticidad` | **GuiaAutenticidad** | Guía de autenticidad de productos |
| `/envios` | **EnviosSeguros** | Información de métodos y políticas de envío |
| `/contacto` | **Contacto** | Formulario de contacto con envío por email |
| `/terminos` | **Terminos** | Términos y condiciones |
| `/privacidad` | **Privacidad** | Política de privacidad |
| `*` | **NotFound** | Página 404 con animación glitch |

---

## Componentes Globales

| Componente | Propósito |
|---|---|
| **Navbar** | Barra superior sticky: menú hamburguesa (abre sidebar categorías), logo, búsqueda con autocomplete (5 resultados predictivos), toggle dark/light, selector de moneda USD/ARS con banderas, menú usuario (login/register o perfil/admin/soporte + logout), wishlist con badge, carrito con badge |
| **Footer** | Logo, descripción, redes sociales (Instagram, X/Twitter, WhatsApp), enlaces informativos, enlaces legales, copyright, ubicación |
| **Chatbot** | Asistente IA con Groq (Llama 3). Preguntas frecuentes, consulta de órdenes por ID o email, derivación a soporte humano, markdown con enlaces internos, cooldown timer |
| **CartSidebar** | Carrito deslizable: lista con controles de cantidad, método de envío, barra de progreso envío gratis, total, botón "Finalizar Pedido" |
| **WishListSidebar** | Wishlist deslizable: lista con botón "mover al carrito", estado vacío, limpiar todo |
| **CategorySidebar** | Navegación lateral: categorías con submenús por franquicia, enlaces útiles, ubicación/contacto, redes sociales |
| **SidebarWrapper** | Contenedor genérico de sidebar (overlay, animación) |
| **Reveal** | Animación de revelado al scroll (fade-up/left/right/in/zoom) |
| **TypewriterText** | Animación de texto typewriter (escribe y borra) |
| **ScrollToTopOnNavigation** | Scroll automático al tope al cambiar de ruta |
| **RouteTitleManager** | Actualiza `document.title` según la ruta |
| **SubtleScrollToTop** | Botón flotante "volver arriba" |

---

## Contextos (Estado Global)

| Contexto | Estado que maneja |
|---|---|
| **AuthContext** | Usuario, token JWT, funciones login/logout |
| **CartContext** | Items del carrito, tipo de envío, config de envío, add/remove/update/clear, total, sync con servidor |
| **CurrencyContext** | Moneda activa (USD/ARS), tasa de cambio (polling cada 60s), conversión y formateo |
| **WishListContext** | Items de wishlist, add/remove/clear, sync con servidor |
| **SidebarContext** | Sidebar activo (carrito/wishlist/categorías/none), funciones open/close |
| **ToastContext** | Cola de notificaciones toast, add/remove, auto-dismiss |

---

## API Backend

Todas las rutas en `server/index.js` (Express 5).

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login (paso 1: enviar código) |
| POST | `/api/auth/login/verify` | Login (paso 2: verificar código) |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/forgot-password` | Enviar email de recuperación |
| POST | `/api/auth/reset-password` | Restablecer contraseña con token |
| POST | `/api/auth/logout` | Limpiar cookie |
| GET | `/api/auth/interests` | Obtener intereses del usuario |
| POST | `/api/auth/interests` | Guardar intereses del usuario |

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Listar productos (filtros: q, categoryId, franchise) |
| GET | `/api/products/:id` | Obtener producto por ID |
| GET | `/api/products/:slug` | Obtener producto por slug |
| POST | `/api/products` | Crear producto (admin) |
| PUT | `/api/products/:id` | Actualizar producto (admin) |
| DELETE | `/api/products/:id` | Eliminar producto (admin) |

### Categorías
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categories` | Listar categorías |
| POST | `/api/categories` | Crear categoría (admin) |
| PUT | `/api/categories/:id` | Actualizar categoría (admin) |
| DELETE | `/api/categories/:id` | Eliminar categoría (admin) |

### Carrito
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/cart/:userId` | Obtener carrito del servidor |
| POST | `/api/cart/sync` | Sincronizar carrito al servidor |

### Wishlist
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/wishlist/:userId` | Obtener wishlist |
| POST | `/api/wishlist` | Agregar a wishlist |
| DELETE | `/api/wishlist/:userId` | Limpiar wishlist |
| DELETE | `/api/wishlist/:userId/:productId` | Quitar de wishlist |

### Pedidos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/orders/:userId` | Obtener pedidos del usuario |
| POST | `/api/orders/lookup` | Buscar pedido por ID |
| POST | `/api/orders` | Crear pedido |
| PUT | `/api/orders/:id/status` | Actualizar estado (admin) |
| POST | `/api/orders/:id/retry-payment` | Reintentar pago MP |
| POST | `/api/orders/:id/upload-proof` | Subir comprobante transferencia |
| POST | `/api/orders/:id/retry-crypto` | Reintentar pago crypto |

### Pagos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/create-preference` | Crear preferencia de Mercado Pago |
| POST | `/api/payments/notification` | Webhook de MP |
| GET | `/api/payments/status/:orderId` | Estado del pago MP |
| POST | `/api/nowpayments/create` | Crear factura NowPayments |
| POST | `/api/nowpayments/notification` | Webhook de NowPayments |
| GET | `/api/nowpayments/status/:orderId` | Estado del pago crypto |
| GET | `/api/nowpayments/min-amount` | Montos mínimos por crypto |

### Envíos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/shipping/config` | Obtener configuración de envíos |
| PUT | `/api/shipping/config` | Actualizar configuración (admin) |

### Soporte
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/support/messages` | Listar mensajes de soporte |
| PUT | `/api/support/messages/:id/status` | Actualizar estado |
| DELETE | `/api/support/messages/:id` | Eliminar mensaje |
| POST | `/api/support/messages/bulk-delete` | Borrado múltiple |

### Usuario
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/user` | Obtener perfil del usuario |
| PUT | `/api/user` | Actualizar perfil |
| POST | `/api/user/points/redeem` | Canjear puntos |
| GET | `/api/addresses` | Obtener direcciones |
| POST | `/api/addresses` | Guardar dirección |
| DELETE | `/api/addresses/:id` | Eliminar dirección |

### Otros
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tasa-usd` | Obtener tasa USD/ARS |
| POST | `/api/contact` | Enviar formulario de contacto |
| GET | `/api/health` | Health check |
| GET | `/api/chat` | Endpoint del chatbot |

### Tareas Automatizadas
- **Limpieza de pedidos**: Cada 60s se cancelan pedidos expirados y se restaura el stock
- **Gmail poller**: Revisa la bandeja de entrada por respuestas de soporte no leídas

---

## Autenticación

El sistema usa dos capas de autenticación:

1. **Clerk** — Manejo de usuarios, sesiones y Google OAuth desde el frontend
2. **JWT + Bcryptjs** — Autenticación propia desde el backend para comunicación con la API

El flujo de login es de dos pasos:
1. El usuario ingresa email y contraseña
2. Se envía un código de verificación al email
3. El usuario ingresa el código para completar el acceso

---

## Medios de Pago

### Mercado Pago
- Modalidad: SDK de React (`@mercadopago/sdk-react`) + backend SDK
- Métodos: Tarjetas de crédito/débito, efectivo (Rapipago, Pago Fácil), transferencia bancaria
- Webhook: `POST /api/payments/notification`

### Criptomonedas (NowPayments.io)
- Monedas aceptadas: USDT (TRC20), USDC, BTC, ETH, LTC, SOL
- Flujo: Se crea una factura → se muestra dirección y QR → se hace polling hasta confirmar el pago
- Webhook: `POST /api/nowpayments/notification`

### Transferencia Bancaria
- El usuario sube una imagen del comprobante
- El administrador verifica y confirma el pago manualmente

---

## IA y Automatización

### Chatbot (Groq - Llama 3)
- Asistente conversacional integrado en el frontend
- Puede responder preguntas sobre productos, pedidos y envíos
- Consulta de órdenes por ID o email
- Derivación a soporte humano
- Cooldown de 5 segundos entre mensajes

### Gemini (Google Generative AI)
- Disponible como fallback/utilitario en el servidor

### Gmail API Poller
- Escanea automáticamente la bandeja de entrada del correo `hubvntg@gmail.com`
- Vincula respuestas de email a tickets de soporte existentes

---

## Instalación

### Requisitos
- Node.js v18+
- pnpm (obligatorio)

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# O en Windows:
winget install pnpm
```

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/maxifuentes2/vntg-hub.git
cd vntg-hub

# Servidor
cd server
pnpm install
pnpm run dev    # http://localhost:5000

# Cliente (otra terminal)
cd client
pnpm install
pnpm run dev    # http://localhost:5173
```

---

## Variables de Entorno

### server/.env

```env
DB_HOST=localhost
DB_PORT=4000
DB_USER=root
DB_PASSWORD=
DB_NAME=vntg_hub
JWT_SECRET=
GOOGLE_CLIENT_ID=
MP_ACCESS_TOKEN=
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_MOCK=true
GROQ_API_KEY=
GEMINI_API_KEY=
N8N_WEBHOOK_URL=
PORT=5000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="VNTG Hub" <hubvntg@gmail.com>

GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
```

### client/.env

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=
VITE_MP_PUBLIC_KEY=
```

### client/.env.production

```env
VITE_API_URL=https://vntg-hub.onrender.com
VITE_MP_PUBLIC_KEY=
```

---

## Reglas de Desarrollo

1. No subir cambios directamente a `main`. Usar ramas descriptivas (`feat/...`, `fix/...`)
2. Los archivos `.env` están en `.gitignore`. No compartir credenciales en el repo
3. Usar pnpm, no npm

---

## Créditos

Proyecto desarrollado por estudiantes de la **Universidad del Aconcagua** (Mendoza, Argentina):

- Máximo Fuentes
- Enzo Bautista Delluniversidad
- Ignacio Povolo
- Gaspar Barroso
- Santiago Zufia
- Bruno Guzmán

© 2026 VNTG Hub Team
