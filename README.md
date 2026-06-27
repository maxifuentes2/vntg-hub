# VNTG Hub

**E-commerce de coleccionables** — Funkos, figuras de acción, anime y gaming.

Plataforma completa con catálogo, carrito, wishlist, autenticación, pagos (Mercado Pago + crypto + transferencia), chatbot con IA, panel administrador con gestión de soporte integrada, reproductor de video y más.

- **Live:** [vntg-hub.vercel.app](https://vntg-hub.vercel.app)
- **API:** Alojada en Render

---

## Funcionalidades

### Catálogo y Productos
- Productos con variantes, galería de imágenes, descuentos y stock
- Filtros por categoría, franquicia, rango de precio y búsqueda por texto
- Búsqueda semántica asistida por Gemini (Google Generative AI)
- Ordenamiento por precio (menor/mayor), nombre y novedades
- Vista de grilla con cards animadas
- Vista detalle con galería interactiva (hover swap + zoom modal con drag)
- Especificaciones técnicas en acordeón
- Productos relacionados

### Carrito de Compras
- Persistente por sesión, sincronizado con el servidor al iniciar sesión
- Selector de método de envío (retiro/local/prioritario)
- Barra de progreso para envío gratis
- Descuentos automáticos por puntos
- Sidebar deslizable con resumen

### Wishlist (Favoritos)
- Agregar/quitar con un clic
- Sidebar deslizable
- Sincronización con el servidor
- Alertas por email de stock y descuentos en productos de la wishlist

### Autenticación
- Registro con nombre, email, contraseña y DNI
- Login en dos pasos: email + código de verificación (vía email)
- Google OAuth (redirect flow con id_token)
- "Recordar dispositivo" con tokens persistentes
- Recuperación y restablecimiento de contraseña por email

### Medios de Pago
- **Mercado Pago** — Tarjetas de crédito/débito, efectivo y transferencia
- **Criptomonedas** — USDT (TRC20), USDC, BTC, ETH, LTC, SOL con direcciones estáticas, QR y verificación manual
- **Transferencia bancaria** — Envío de datos del comprobante (titular, banco y nro. de operación) para verificación manual

### Chatbot con IA
- Asistente conversacional vía Groq API (Llama 3.3 70B) con fetch directo (sin SDK)
- Consulta de órdenes por ID o historial del usuario autenticado
- Catálogo en contexto con precios y links directos
- Preguntas frecuentes con botones rápidos
- Derivación a soporte humano

### Panel de Administración
- CRUD completo de productos (imágenes, variantes, especificaciones)
- CRUD de categorías (con banner)
- Gestión de pedidos (cambio de estado, verificación de pagos manuales, selección múltiple)
- Configuración de envíos
- Gestión de puntos y canjeo
- Gestión de soporte (tickets con filtro por estado, respuesta, asignación IA/humano, borrado múltiple)

### Sistema de Puntos
- Puntos por compra, canjeables por descuentos en checkout

### Multi-moneda
- Selector USD / ARS con banderas
- Tasa de cambio actualizada cada 60s vía DolarAPI

### Modo Oscuro
- Toggle manual con clase `dark` en `<html>`

### Diseño Responsive
- Adaptado desde 320px hasta desktop

### Reproductor de Video Custom
- Skip -10s/+10s, timeline arrastrable, fullscreen landscape, soporte Safari

### Tutoriales
- Videoteca con reproductor custom

### Sidebar de Categorías
- Navegación lateral con categorías y submenús por franquicia

### Notificaciones Toast
- Sistema interno con imagen, barra de progreso y auto-dismiss

### Emails Transaccionales
- Templates HTML premium para: código 2FA, alertas de stock/descuento, estado de pedido, respuesta de soporte, contacto y auto-respuesta
- Envío vía SendGrid (primario) y SMTP/Nodemailer (fallback)

### Tareas Automatizadas
- **Limpieza de pedidos**: cada 60s se cancelan pedidos expirados y se restaura stock + puntos
- **Auto-cierre de tickets**: cada 1 hora se cierran tickets respondidos sin actividad en 48h
- **Gmail poller**: revisa bandeja de entrada para vincular respuestas a tickets de soporte
- **Email poller**: polling IMAP para auto-respuestas de soporte

### Seguridad
- Rate limiting por endpoint (auth, chat, contacto, lookup)
- Cabeceras HTTP de seguridad (HSTS, CSP, X-Frame-Options, etc.)
- JWT httpOnly cookie + localStorage token
- Verificación de roles (admin, support) con middleware dedicado

### Otras Páginas
- Guía de autenticidad, envíos seguros, términos, privacidad, contacto, 404 con animación glitch

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI |
| Vite | 8 | Bundler |
| React Router DOM | 7 | Routing |
| Tailwind CSS | 3.4 | Estilos |
| Lucide React | — | Iconos |
| qrcode.react | — | QR codes para pagos crypto |
| Barlow (Google Fonts) | — | Tipografía principal |

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5 | Framework HTTP |
| MySQL (mysql2) | 3 | Base de datos (pool con promises) |
| JWT (jsonwebtoken) | 9 | Autenticación |
| Bcryptjs | 3 | Hash de contraseñas |
| uuid | 14 | Generación de tokens únicos |
| express-rate-limit | 8 | Rate limiting por endpoint |
| Mercado Pago SDK | 2 | Pagos server-side |
| Groq API | — | Chatbot IA (fetch directo, sin SDK) |
| Google Generative AI | 0.24 | Búsqueda semántica (Gemini) |
| Google Auth Library | 10 | Verificación Google OAuth |
| Google APIs (googleapis) | 173 | Gmail API (poller soporte) |
| Nodemailer | 8 | Envío de emails (SMTP) |
| SendGrid (@sendgrid/mail) | 8 | Email transaccional (primario) |
| multer | 2 | Configurado para subida de comprobantes |
| cookie-parser | 1 | Cookies httpOnly |
| cors | 2 | CORS |
| dotenv | 17 | Variables de entorno |

### Infraestructura

| Servicio | Uso |
|---|---|
| Vercel | Hosting frontend |
| Render | Hosting backend |
| MySQL remoto | Base de datos (con soporte SSL opcional) |
| Mercado Pago | Pagos Argentina |
| Groq | API Chatbot (Llama 3.3 70B) |
| Google Cloud | OAuth + Gmail API |
| SendGrid | Emails transaccionales |
| DolarAPI | Tasa de cambio USD/ARS |

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
│   │   │   ├── slugify.js
│   │   │   ├── dateUtils.js
│   │   │   └── priceUtils.js
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
│   ├── pnpm-workspace.yaml
│   └── vercel.json
│
├── server/
│   ├── index.js
│   ├── db.js
│   ├── shipping.js
│   ├── imapPoller.js
│   ├── emailPoller.js
│   ├── isrgrootx1.pem
│   └── uploads/
│
├── .gitignore
└── README.md
```

---

## Páginas (19)

| Ruta | Página | Descripción |
|---|---|---|
| `/` | **Inicio** | Hero con texto scrambled, typewriter, carruseles de productos por categoría |
| `/categoria/:slug` | **Categoria** | Grilla con filtros (precio, franquicia, orden, búsqueda) |
| `/producto/:slug` | **DetalleProducto** | Galería con hover swap + zoom drag, specs, relacionados |
| `/checkout` | **Checkout** | Dirección, envío, puntos, pago (MP / crypto QR / transferencia con comprobante) |
| `/pedido/:id` | **PedidoDetalle** | Timeline, estado, QR crypto, reintentos, comprobante |
| `/mi-cuenta` | **MiCuenta** | Perfil, pedidos, direcciones, intereses |
| `/login` | **Login** | Email/password + Google OAuth, verificación en 2 pasos |
| `/register` | **Registro** | Formulario de registro |
| `/recuperar-password` | **RecuperarPassword** | Solicitud de recuperación |
| `/reset-password` | **RestablecerPassword** | Reset con token |
| `/admin` | **AdminPanel** | CRUD productos, categorías, pedidos, envíos, puntos, soporte |
| `/puntos` | **Puntos** | Info del sistema de puntos |
| `/tutoriales` | **Tutoriales** | Videoteca con reproductor custom |
| `/guia-autenticidad` | **GuiaAutenticidad** | Guía de autenticidad |
| `/envios` | **EnviosSeguros** | Políticas de envío |
| `/contacto` | **Contacto** | Formulario de contacto |
| `/terminos` | **Terminos** | Términos y condiciones |
| `/privacidad` | **Privacidad** | Política de privacidad |
| `*` | **NotFound** | 404 con animación glitch |

---

## Componentes Globales

| Componente | Propósito |
|---|---|
| **Navbar** | Sticky: menú hamburguesa, logo, búsqueda con autocomplete (5 resultados), toggle dark/light, selector USD/ARS, menú usuario, wishlist badge, carrito badge |
| **Footer** | Logo, descripción, redes (Instagram, TikTok, WhatsApp, Web), enlaces |
| **Chatbot** | Asistente IA vía Groq API. FAQ, órdenes del usuario, catálogo en contexto, derivación a soporte |
| **CartSidebar** | Carrito deslizable: productos, envío, progreso envío gratis, total |
| **WishListSidebar** | Wishlist deslizable: mover al carrito, vaciar |
| **CategorySidebar** | Navegación lateral: categorías + franquicias, contacto |
| **SidebarWrapper** | Contenedor genérico con overlay y animación |
| **Reveal** | Animación scroll (fade-up/left/right/in/zoom) |
| **TypewriterText** | Animación de tipeo |
| **ScrollToTopOnNavigation** | Scroll automático al tope al cambiar de ruta |
| **RouteTitleManager** | `document.title` dinámico por ruta |
| **SubtleScrollToTop** | Botón flotante "volver arriba" |

---

## Contextos (Estado Global)

| Contexto | Estado que maneja |
|---|---|
| **AuthContext** | Usuario, token JWT, login/logout |
| **CartContext** | Items, envío, add/remove/update/clear, total, sync servidor |
| **CurrencyContext** | Moneda activa (USD/ARS), tasa de cambio (polling 60s), conversión |
| **WishListContext** | Items, add/remove/clear, sync servidor |
| **SidebarContext** | Sidebar activo (carrito/wishlist/categorías/none) |
| **ToastContext** | Notificaciones toast, auto-dismiss |

---

## Utilidades Frontend

| Archivo | Funciones | Uso |
|---|---|---|
| `slugify.js` | `slugify()` | Genera slugs URL-friendly desde títulos |
| `dateUtils.js` | `formatArgTime()` | Formatea fechas UTC a hora argentina (timezone `America/Argentina/Buenos_Aires`) |
| `priceUtils.js` | `calculateDiscountedPrice()`, `formatPrice()` | Cálculo de precios con descuento y formateo en ARS |

---

## Hooks

| Hook | Propósito |
|---|---|
| `useScrollReveal` | Observer de intersección para animaciones al hacer scroll |

---

## API Backend

Todas las rutas en `server/index.js` (Express 5, CommonJS).

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro (rate limited) |
| POST | `/api/auth/login/local` | Login paso 1: email + password → enviar código 2FA (rate limited) |
| POST | `/api/auth/verify-code` | Login paso 2: verificar código (rate limited) |
| POST | `/api/auth/google` | Google OAuth con id_token (rate limited) |
| POST | `/api/auth/forgot-password` | Email de recuperación (rate limited) |
| POST | `/api/auth/reset-password` | Reset con token (rate limited) |
| POST | `/api/auth/logout` | Limpiar cookie httpOnly |
| PUT | `/api/auth/update-profile` | Actualizar perfil (auth) |
| GET | `/api/auth/interests` | Obtener intereses del usuario (auth) |
| PUT | `/api/auth/interests` | Guardar intereses (auth) |

### Usuario
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/user` | Perfil del usuario actual (auth) |

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Listar (filtros: q, categoryId, franchise) |
| GET | `/api/products/:id` | Obtener producto por ID |

### Categorías
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categories` | Listar |

### Carrito
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/cart/:userId` | Obtener carrito (auth) |
| POST | `/api/cart/sync` | Sincronizar carrito con servidor (auth) |

### Wishlist
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/wishlist/:userId` | Obtener (auth) |
| POST | `/api/wishlist` | Agregar producto (auth) |
| DELETE | `/api/wishlist/:userId/:productId` | Quitar producto (auth) |
| DELETE | `/api/wishlist/:userId` | Limpiar wishlist completa (auth) |

### Pedidos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/orders/:userId` | Listar pedidos del usuario (auth) |
| GET | `/api/orders/detail/:id` | Detalle de un pedido (auth) |
| POST | `/api/orders/lookup` | Buscar orden por ID (rate limited, público) |
| POST | `/api/checkout` | Crear pedido con Mercado Pago (auth) |
| POST | `/api/orders/:id/retry-payment` | Reintentar pago MP (auth) |
| POST | `/api/orders/:id/retry-crypto-payment` | Reintentar pago crypto (auth) |
| POST | `/api/orders/upload-proof` | Subir comprobante de transferencia (auth) |

### Pagos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/webhooks/mercadopago` | Webhook de notificaciones MP |
| GET | `/api/order/payment-status/:orderId` | Estado de pago MP (auth) |
| POST | `/api/checkout-crypto` | Checkout con criptomonedas (auth) |
| POST | `/api/checkout-transfer` | Checkout con transferencia bancaria (auth) |
| GET | `/api/crypto/min-amounts` | Montos mínimos por criptomoneda |
| GET | `/api/crypto/prices` | Precios actuales de criptomonedas |

### Envíos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/shipping/config` | Configuración pública de envíos |

### Direcciones
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/addresses` | Listar direcciones (auth) |
| POST | `/api/addresses` | Guardar dirección (auth) |
| PUT | `/api/addresses/:id` | Actualizar dirección (auth) |
| PUT | `/api/addresses/:id/default` | Marcar como predeterminada (auth) |
| DELETE | `/api/addresses/:id` | Eliminar dirección (auth) |

### Contacto
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/contact` | Formulario de contacto (rate limited) |

### Chat
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/chat` | Chatbot IA - Groq API (rate limited) |

### Tasa de Cambio
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tasa-usd` | Tasa USD/ARS actual |

### Administración (requiere rol `admin`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/products` | Listar productos |
| POST | `/api/admin/products` | Crear producto |
| PUT | `/api/admin/products/:id` | Actualizar producto |
| DELETE | `/api/admin/products/:id` | Eliminar producto |
| GET | `/api/admin/categories` | Listar categorías |
| POST | `/api/admin/categories` | Crear categoría |
| PUT | `/api/admin/categories/:id` | Actualizar categoría |
| DELETE | `/api/admin/categories/:id` | Eliminar categoría |
| DELETE | `/api/admin/categories/:id/banner` | Eliminar banner de categoría |
| GET | `/api/admin/orders` | Listar todos los pedidos |
| PUT | `/api/admin/orders/:id/status` | Cambiar estado de pedido |
| PUT | `/api/admin/orders/:id/verify-payment` | Verificar pago manual (crypto/transferencia) |
| DELETE | `/api/admin/orders/:id` | Eliminar pedido |
| GET | `/api/admin/shipping-config` | Obtener configuración de envíos |
| PUT | `/api/admin/shipping-config` | Actualizar configuración de envíos |

### Soporte (requiere rol `admin` o `support`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/support/messages` | Listar mensajes de soporte |
| PUT | `/api/support/messages/:id/status` | Actualizar estado del ticket |
| PUT | `/api/support/messages/:id/assign` | Asignar ticket (IA/HUMANO) |
| DELETE | `/api/support/messages/:id` | Eliminar hilo de soporte completo |
| POST | `/api/support/messages/bulk-delete` | Borrado múltiple |

### Debug
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/debug-categories` | Debug de categorías |

---

## Módulos del Servidor

| Archivo | Propósito |
|---|---|
| `index.js` | Servidor Express principal: rutas, middleware, pollers, tareas programadas |
| `db.js` | Pool de conexiones MySQL2 con promises (soporte SSL opcional) |
| `shipping.js` | Configuración de envíos con cache y fallback a variables de entorno |
| `imapPoller.js` | Gmail API poller: vincula respuestas de email a tickets de soporte |
| `emailPoller.js` | Email poller: auto-respuestas de soporte vía Gmail API |
| `isrgrootx1.pem` | Certificado raíz Let's Encrypt para conexiones SSL |

---

## Autenticación

- **JWT + Bcryptjs** — Autenticación propia con tokens y hash de contraseñas
- **Google OAuth** — Verificación de id_token vía `google-auth-library`
- **Login en 2 pasos**: email + contraseña → código de verificación al email
- **Persistencia**: token en localStorage + cookie httpOnly con `sameSite` dinámico
- **Token Guard**: verificación automática de expiración en el cliente (on focus + interceptor fetch)
- **Roles**: `admin` y `support` con middleware de verificación

---

## Medios de Pago

### Mercado Pago
- SDK server-side (`mercadopago`) para crear preferencias y gestionar pagos
- Webhook: `POST /api/webhooks/mercadopago`
- Reintentos de pago disponibles

### Criptomonedas
- Direcciones estáticas para USDT (TRC20), USDC, BTC, ETH, LTC, SOL
- QR code para cada dirección
- Verificación manual por el admin desde el panel

### Transferencia Bancaria
- Envío de datos del comprobante (titular, banco y nro. de operación)
- Datos bancarios configurados vía variables de entorno
- Verificación manual por el admin desde el panel de administración

---

## IA y Automatización

### Chatbot (Groq API - Llama 3.3 70B Versatile)
- Llamada directa a `api.groq.com` usando `fetch()` (sin SDK)
- Modelo: `llama-3.3-70b-versatile`
- Catálogo completo en contexto con precios y links
- Historial del usuario autenticado en contexto
- Consulta de órdenes, FAQ, derivación a soporte humano

### Gemini (Google Generative AI)
- Expansión semántica de búsqueda en el catálogo

### Gmail Poller (imapPoller.js)
- Escanea bandeja de entrada vía `googleapis` (Gmail API)
- Vincula respuestas a tickets de soporte por thread ID

### Email Poller (emailPoller.js)
- Polling de emails vía Gmail API
- Auto-respuestas para soporte

---

## Instalación

### Requisitos
- Node.js v18+
- pnpm

```bash
npm install -g pnpm
```

### Pasos

```bash
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
# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=vntg_hub
DB_SSL=false

# Servidor
PORT=5000
BASE_URL=https://vntg-hub.onrender.com

# Autenticación
JWT_SECRET=
JWT_EXPIRES=1d
GOOGLE_CLIENT_ID=

# Mercado Pago
MP_ACCESS_TOKEN=

# IA
GROQ_API_KEY=
GEMINI_API_KEY=

# Email SMTP (Nodemailer - fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="VNTG Hub" <hubvntg@gmail.com>

# SendGrid (primario)
SENDGRID_API_KEY=

# Gmail API (pollers de soporte)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

# Direcciones crypto
CRYPTO_USDT_TRC20=
CRYPTO_USDC=
CRYPTO_BTC=
CRYPTO_ETH=
CRYPTO_LTC=
CRYPTO_SOL=

# Datos bancarios para transferencia
BANK_NAME=
BANK_HOLDER=
BANK_CUIT=
BANK_ALIAS=
BANK_CBU=
```

### client/.env

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=
```

### client/.env.production

```env
VITE_API_URL=https://vntg-hub.onrender.com
```

---

## Dependencias no utilizadas en el código

Las siguientes dependencias están en `package.json` pero **no se importan ni usan** en el código fuente:

**Cliente:**
- `@clerk/clerk-react` — No se importa en ningún archivo
- `@mercadopago/sdk-react` — No se importa (pagos se manejan server-side)
- `@tailwindcss/vite` — No se usa en `vite.config.js` (se usa el plugin PostCSS clásico)
- `axios` — No se importa (se usa `fetch` nativo)
- `mercadopago` — SDK de servidor, no corresponde al cliente
- `next-themes` — No se importa (dark mode manual con clase CSS)
- `uuid` — No se importa en el cliente

**Servidor:**
- `groq-sdk` — No se importa (se usa fetch directo a la API de Groq)
- `mailparser` — No se importa en ningún archivo del servidor
- `multer` — Importado y configurado, pero el middleware `upload` no se usa en ninguna ruta

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
