# VNTG Hub - E-commerce de Coleccionables

Plataforma de comercio electrónico para coleccionistas de cultura pop. Catálogo de funkos, figuras de acción, artículos de anime y gaming con carrito, wishlist, chatbot con IA, panel de administración y pagos integrados.

### Funcionalidades principales

- **Catálogo**: Productos con variantes, descuentos, filtros por categoría/precio/búsqueda, vista de grilla con cards glassmorphism.
- **Carrito**: Persistente por sesión, suma descuentos automáticos, enlace directo a compra.
- **Wishlist**: Guardar favoritos con un clic (corazón), sincronizado por contexto global.
- **Autenticación**: Registro/login con email + Google OAuth via Clerk.
- **Chatbot IA**: Asistente conversacional con Groq (Llama 3) que responde dudas de productos, pedidos y envíos. Consulta de órdenes por email. Formulario de contacto a humanos.
- **Pagos**: Integración con Mercado Pago (tarjetas, efectivo, transferencia).
- **Suscripción por email**: Bienvenida, recuperación de contraseña y confirmación de compra.
- **Puntos y canjeo**: Sistema de puntos por compras, canjeables por descuentos en el checkout.
- **Reproductor de video custom**: Reproductor en Tutoriales con controles de skip (-10s/+10s), timeline arrastrable, pantalla completa con orientación landscape, soporte Safari, barra de progreso fina, spinner de carga.
- **Soporte IMAP**: Escaneo automático de bandeja de entrada para respuestas de soporte vía ImapFlow.
- **Panel admin**: Gestión de productos (CRUD), variantes, canjeo de puntos, vista de catálogo completo.
- **Panel de soporte**: Gestión de consultas y respuestas.
- **Multi-moneda**: Selector USD / ARS con banderas.
- **Modo oscuro**: Toggle persistente con next-themes.
- **Diseño responsive**: Adaptado a mobile (320px+), tablet y desktop.
- **Sidebar categorías**: Navegación lateral por categorías de coleccionables.

## Stack Tecnológico

### Frontend
- **Core**: React 19 + Vite 8 + React Router 7
- **Estilos**: Tailwind CSS 4 + PostCSS + Autoprefixer
- **Iconos**: Lucide React
- **Autenticación**: Clerk + Google OAuth (`@react-oauth/google`)
- **Tema oscuro**: next-themes
- **Pagos**: Mercado Pago SDK (`@mercadopago/sdk-react`)
- **HTTP**: Axios
- **IDs**: uuid

### Backend & DB
- **Entorno**: Node.js + Express 5 (CommonJS)
- **Base de Datos**: MySQL 2 (TiDB Cloud via mysql2)
- **Seguridad**: JWT + Bcryptjs
- **IA**: Groq SDK (Llama 3) para chatbot, Google Generative AI (Gemini) para utilitarios
- **Email**: Nodemailer (envío), ImapFlow + mailparser (lectura de bandeja de entrada)
- **Archivos**: Multer
- **Pagos**: Mercado Pago SDK
- **Monitorización**: Nodemon (dev)

### Integraciones
- **Mercado Pago**: Pagos con tarjetas, efectivo y transferencia
- **Google OAuth**: Inicio de sesión con Google
- **Clerk**: Autenticación y gestión de usuarios
- **Groq**: Chatbot IA (Llama 3)
- **Gemini**: Utilidades de IA

## Estructura

```
vntg-hub/
├── client/                      # Frontend React + Vite
│   ├── public/
│   │   ├── ar.png, us.png       # Banderas multi-moneda
│   └── src/
│       ├── components/          # Navbar, Chatbot, Footer, CartSidebar, WishListSidebar, etc.
│       ├── context/             # CartContext, CurrencyContext, WishListContext, SidebarContext, ToastContext
│       ├── pages/               # 20 páginas (Inicio, Catálogo, DetalleProducto, Checkout, Tutoriales, AdminPanel, etc.)
│       ├── App.jsx
│       └── main.jsx
├── server/                      # Backend Express
│   ├── index.js                 # Servidor principal
│   ├── db.js                    # Conexión MySQL
│   ├── crypto.js                # Funciones criptográficas
│   ├── shipping.js              # Lógica de envíos
│   ├── escaner.js               # Escaneo de productos
│   ├── imapPoller.js            # Poller de bandeja de entrada IMAP
│   ├── migrate-shipping-config.sql
│   └── isrgrootx1.pem           # Certificado CA
├── .gitignore
└── README.md
```

### Contextos (Estado Global)
| Contexto | Propósito |
|----------|-----------|
| `CartContext` | Carrito de compras persistente |
| `WishListContext` | Lista de favoritos |
| `CurrencyContext` | Selector USD / ARS |
| `SidebarContext` | Estado de sidebars (carrito, wishlist, categorías) |
| `ToastContext` | Notificaciones toast |

### Páginas Principales
| Ruta | Página |
|------|--------|
| `/` | Inicio |
| `/categoria/:slug` | Catálogo por categoría (funkos, figuras, anime, gaming) |
| `/producto/:id` | Detalle de producto |
| `/checkout` | Checkout con Mercado Pago |
| `/login`, `/registro` | Autenticación |
| `/mi-cuenta` | Perfil de usuario |
| `/puntos` | Canjeo de puntos |
| `/tutoriales` | Videoteca con reproductor custom |
| `/admin` | Panel de administración (CRUD productos) |
| `/soporte` | Panel de soporte |
| `/contacto` | Formulario de contacto |
| `/pedido/:id` | Detalle de pedido |

## Requisitos

- Node.js v18+
- pnpm (obligatorio)

## Instalación

```bash
# Clonar
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

## Variables de Entorno

Copiar los archivos `.env.example` (crearlos si no existen) y completar con los valores reales provistos por el equipo.

### server/.env

```env
DB_HOST=
DB_PORT=4000
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
GOOGLE_CLIENT_ID=
MP_ACCESS_TOKEN=
GROQ_API_KEY=
GEMINI_API_KEY=
N8N_WEBHOOK_URL=
PORT=5000
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

## Reglas de Desarrollo

1. No subir cambios directamente a `main`. Usar ramas descriptivas (`feat/...`, `fix/...`).
2. Los archivos `.env` están en `.gitignore`. No compartir credenciales en el repo.
3. Usar pnpm, no npm.

---

## Créditos

Proyecto desarrollado por estudiantes de la Universidad del Aconcagua (Mendoza, Argentina):

- Máximo Fuentes
- Enzo Bautista Delluniversidad
- Ignacio Povolo
- Gaspar Barroso
- Santiago Zufia
- Bruno Guzmán

© 2026 VNTG Hub Team