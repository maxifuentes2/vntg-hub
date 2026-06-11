# VNTG Hub

**E-commerce de coleccionables** — Funkos, figuras de acción, anime y gaming.

Plataforma completa con catálogo, carrito, wishlist, autenticación, pagos (Mercado Pago + crypto + transferencia), chatbot con IA, panel administrador, panel de soporte, reproductor de video y más.

- **Live:** [vntg-hub.vercel.app](https://vntg-hub.vercel.app)
- **API:** [Alojada en Render]

---

## Funcionalidades

### Catálogo y Productos
- Productos con variantes, galería de imágenes, descuentos y stock
- Filtros por categoría, franquicia, rango de precio y búsqueda por texto
- Ordenamiento por precio (menor/mayor), nombre y novedades
- Vista de grilla con cards glassmorphism
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

### Autenticación
- Registro con nombre, email, contraseña y DNI
- Login en dos pasos: email + código de verificación
- Google OAuth (redirect flow con id_token)
- "Recordar dispositivo"
- Recuperación y restablecimiento de contraseña por email

### Medios de Pago
- **Mercado Pago** — Tarjetas de crédito/débito, efectivo y transferencia
- **Criptomonedas** — USDT (TRC20), USDC, BTC, ETH, LTC, SOL con direcciones estáticas, QR y verificación manual
- **Transferencia bancaria** — Envío de datos del comprobante (titular, banco y nro. de operación) en texto plano para verificación manual

### Chatbot con IA
- Asistente conversacional vía Groq API (Llama 3) con fetch directo
- Consulta de órdenes por ID o email
- Preguntas frecuentes con botones rápidos
- Derivación a soporte humano

### Panel de Administración
- CRUD completo de productos (imágenes, variantes, especificaciones)
- CRUD de categorías (con banner)
- Gestión de pedidos (cambio de estado, selección múltiple)
- Configuración de envíos
- Gestión de puntos y canjeo

### Panel de Soporte
- Gestión de tickets con filtro por estado
- Búsqueda por texto
- Borrado múltiple
- Respuesta automática vía Gmail API (poller)

### Sistema de Puntos
- Puntos por compra, canjeables por descuentos en checkout

### Multi-moneda
- Selector USD / ARS con banderas
- Tasa de cambio actualizada cada 60s

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

### Otras Páginas
- Guía de autenticidad, envíos seguros, términos, privacidad, contacto, 404 con animación glitch

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI |
| Vite | 8 | Bundler |
| React Router | 7 | Routing |
| Tailwind CSS | 3.4 | Estilos |
| Lucide React | — | Iconos |
| qrcode.react | — | QR codes |

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5 | Framework |
| MySQL (mysql2) | 3 | Base de datos |
| JWT | 9 | Autenticación |
| Bcryptjs | 3 | Hash de contraseñas |
| Mercado Pago SDK | 2 | Pagos server-side |
| Groq API | — | Chatbot IA (fetch directo) |
| Google Generative AI | 0.24 | Búsqueda semántica (Gemini) |
| Google Auth Library | 10 | Verificación Google OAuth |
| Google APIs | 173 | Gmail API (poller soporte) |
| Nodemailer | 8 | Envío de emails |
| SendGrid | 8 | Email transaccional (fallback) |
| cookie-parser | 1 | Cookies |
| cors | 2 | CORS |
| dotenv | 17 | Variables de entorno |

### Infraestructura

| Servicio | Uso |
|---|---|
| Vercel | Hosting frontend |
| Render | Hosting backend |
| Railway | Base de datos MySQL |
| Mercado Pago | Pagos Argentina |
| Groq | API Chatbot (Llama 3) |
| Google Cloud | OAuth + Gmail API |

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
| `/` | **Inicio** | Hero con texto scrambled, typewriter, carruseles de productos por categoría |
| `/categoria/:slug` | **Categoria** | Grilla con filtros (precio, franquicia, orden, búsqueda) |
| `/producto/:slug` | **DetalleProducto** | Galería con hover swap + zoom drag, specs, relacionados |
| `/checkout` | **Checkout** | Dirección, envío, puntos, pago (MP / crypto QR / transferencia con comprobante) |
| `/pedido/:id` | **PedidoDetalle** | Timeline, estado, QR crypto, reintentos, comprobante |
| `/mi-cuenta` | **MiCuenta** | Perfil, pedidos, direcciones, intereses |
| `/login` | **Login** | Email/password + Google OAuth, verificación en 2 pasos |
| `/registro` | **Registro** | Formulario de registro |
| `/recuperar-password` | **RecuperarPassword** | Solicitud de recuperación |
| `/restablecer-password` | **RestablecerPassword** | Reset con token |
| `/admin` | **AdminPanel** | CRUD productos, categorías, pedidos, envíos, puntos |
| `/soporte` | **SupportPanel** | Gestión de tickets, filtros, borrado múltiple |
| `/puntos` | **Puntos** | Info del sistema de puntos |
| `/tutoriales` | **Tutoriales** | Videoteca con reproductor custom. 6 tutoriales: "Cómo utilizar el Chat Bot", "Cómo utilizar los Filtros de búsqueda", "Cómo gestionar tus intereses", "Cómo guardar tus direcciones", "Cómo usar diferentes medios de pago", "Cómo iniciar sesión/registrarse" |
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
| **Footer** | Logo, descripción, redes (Instagram, X, WhatsApp), enlaces |
| **Chatbot** | Asistente IA via Groq API. FAQ, órdenes por ID/email, derivación a soporte |
| **CartSidebar** | Carrito deslizable: productos, envío, progreso envío gratis, total |
| **WishListSidebar** | Wishlist deslizable: mover al carrito, vaciar |
| **CategorySidebar** | Navegación lateral: categorías + franquicias, contacto |
| **SidebarWrapper** | Contenedor genérico con overlay y animación |
| **Reveal** | Animación scroll (fade-up/left/right/in/zoom) |
| **TypewriterText** | Animación de tipeo |
| **ScrollToTopOnNavigation** | Scroll automático al tope al cambiar de ruta |
| **RouteTitleManager** | `document.title` dinámico |
| **SubtleScrollToTop** | Botón flotante "volver arriba" |

---

## Contextos (Estado Global)

| Contexto | Estado que maneja |
|---|---|
| **AuthContext** | Usuario, token JWT, login/logout, verificación 2 pasos |
| **CartContext** | Items, envío, add/remove/update/clear, total, sync servidor |
| **CurrencyContext** | Moneda activa (USD/ARS), tasa de cambio (polling 60s), conversión |
| **WishListContext** | Items, add/remove/clear, sync servidor |
| **SidebarContext** | Sidebar activo (carrito/wishlist/categorías/none) |
| **ToastContext** | Notificaciones toast, auto-dismiss |

---

## API Backend

Todas las rutas en `server/index.js` (Express 5, CommonJS).

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login paso 1 (enviar código) |
| POST | `/api/auth/login/verify` | Login paso 2 (verificar código) |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/forgot-password` | Email de recuperación |
| POST | `/api/auth/reset-password` | Reset con token |
| POST | `/api/auth/logout` | Limpiar cookie |
| GET | `/api/auth/interests` | Obtener intereses |
| POST | `/api/auth/interests` | Guardar intereses |

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Listar (filtros: q, categoryId, franchise) |
| GET | `/api/products/:id` | Obtener por ID |
| GET | `/api/products/:slug` | Obtener por slug |
| POST | `/api/products` | Crear (admin) |
| PUT | `/api/products/:id` | Actualizar (admin) |
| DELETE | `/api/products/:id` | Eliminar (admin) |

### Categorías
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categories` | Listar |
| POST | `/api/categories` | Crear (admin) |
| PUT | `/api/categories/:id` | Actualizar (admin) |
| DELETE | `/api/categories/:id` | Eliminar (admin) |

### Carrito
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/cart/:userId` | Obtener carrito |
| POST | `/api/cart/sync` | Sincronizar |

### Wishlist
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/wishlist/:userId` | Obtener |
| POST | `/api/wishlist` | Agregar |
| DELETE | `/api/wishlist/:userId` | Limpiar |
| DELETE | `/api/wishlist/:userId/:productId` | Quitar |

### Pedidos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/orders/:userId` | Listar del usuario |
| POST | `/api/orders/lookup` | Buscar por ID |
| POST | `/api/orders` | Crear |
| PUT | `/api/orders/:id/status` | Actualizar estado (admin) |
| POST | `/api/orders/:id/retry-payment` | Reintentar MP |
| POST | `/api/orders/:id/upload-proof` | Subir comprobante |
| POST | `/api/orders/:id/retry-crypto` | Reintentar crypto |

### Pagos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/create-preference` | Preferencia MP |
| POST | `/api/payments/notification` | Webhook MP |
| GET | `/api/payments/status/:orderId` | Estado MP |
| POST | `/api/checkout-crypto` | Checkout crypto |
| POST | `/api/checkout-transfer` | Checkout transferencia |
| GET | `/api/crypto/min-amounts` | Montos mínimos crypto |
| GET | `/api/crypto/prices` | Precios crypto |

### Envíos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/shipping/config` | Configuración |
| PUT | `/api/shipping/config` | Actualizar (admin) |

### Soporte
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/support/messages` | Listar |
| PUT | `/api/support/messages/:id/status` | Actualizar estado |
| DELETE | `/api/support/messages/:id` | Eliminar |
| POST | `/api/support/messages/bulk-delete` | Borrado múltiple |

### Usuario
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/user` | Perfil |
| PUT | `/api/user` | Actualizar perfil |
| POST | `/api/user/points/redeem` | Canjear puntos |
| GET | `/api/addresses` | Direcciones |
| POST | `/api/addresses` | Guardar dirección |
| DELETE | `/api/addresses/:id` | Eliminar dirección |

### Otros
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tasa-usd` | Tasa USD/ARS |
| POST | `/api/contact` | Formulario de contacto |
| GET | `/api/health` | Health check |
| GET | `/api/chat` | Chatbot (Groq API) |

### Tareas Automatizadas
- **Limpieza de pedidos**: cada 60s se cancelan pedidos expirados y se restaura stock
- **Gmail poller**: revisa bandeja de entrada para vincular respuestas a tickets de soporte

---

## Autenticación

- **JWT + Bcryptjs** — Autenticación propia con tokens y hash de contraseñas
- **Google OAuth** — Verificación de id_token vía `google-auth-library`
- **Login en 2 pasos**: email + contraseña → código de verificación al email
- **Persistencia**: token en localStorage + cookie httpOnly

---

## Medios de Pago

### Mercado Pago
- SDK server-side (`mercadopago`) para crear preferencias y gestionar pagos
- Webhook: `POST /api/payments/notification`

### Criptomonedas
- Direcciones estáticas para USDT (TRC20), USDC, BTC, ETH, LTC, SOL
- QR code para cada dirección
- Verificación manual por el admin

### Transferencia Bancaria
- Envío de datos del comprobante (titular, banco y nro. de operación) en texto plano por el usuario
- Verificación manual por el admin desde el panel de administración

---

## IA y Automatización

### Chatbot (Groq API - Llama 3)
- Llamada directa a `api.groq.com` usando `fetch()` (sin SDK)
- Consulta de órdenes, FAQ, derivación a soporte humano

### Gemini (Google Generative AI)
- Expansión semántica de búsqueda en el catálogo

### Gmail API Poller
- Escanea `hubvntg@gmail.com` vía `googleapis`
- Vincula respuestas a tickets de soporte

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
DB_HOST=localhost
DB_PORT=4000
DB_USER=root
DB_PASSWORD=
DB_NAME=vntg_hub
JWT_SECRET=
GOOGLE_CLIENT_ID=
MP_ACCESS_TOKEN=
GROQ_API_KEY=
GEMINI_API_KEY=
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="VNTG Hub" <hubvntg@gmail.com>
SENDGRID_API_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
CRYPTO_USDT_TRC20=
CRYPTO_USDC=
CRYPTO_BTC=
CRYPTO_ETH=
CRYPTO_LTC=
CRYPTO_SOL=
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

## Reglas de Desarrollo

1. No subir cambios directamente a `main`. Usar ramas descriptivas (`feat/...`, `fix/...`)
2. Los archivos `.env` están en `.gitignore`. No compartir credenciales en el repo
3. Usar pnpm, no npm

---

## Dependencias no utilizadas (package.json)

Las siguientes dependencias están en `package.json` pero no se usan en el código:

**Cliente:** `@clerk/clerk-react`, `@mercadopago/sdk-react`, `@tailwindcss/vite`, `axios`, `mercadopago` (server SDK), `next-themes`, `uuid`

**Servidor:** `express-rate-limit` (importado pero sin usar), `groq-sdk` (se usa fetch directo), `mailparser`, `multer` (configurado pero sin usar)

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
