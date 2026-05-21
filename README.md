# VNTG Hub - E-commerce de Coleccionables

Plataforma de comercio electrónico para coleccionistas de cultura pop con diseño glassmorphism, modo oscuro y chatbot IA.

## Stack Tecnológico

### Frontend
- **Core**: React 19 + Vite 8
- **Estilos**: Tailwind CSS 4
- **Iconos**: Lucide React
- **Estado Global**: React Context API (Carrito, Wishlist)
- **Autenticación**: Clerk + Google OAuth

### Backend & DB
- **Entorno**: Node.js + Express 5 (CommonJS)
- **Base de Datos**: MySQL (TiDB Cloud)
- **Seguridad**: JWT + Bcryptjs
- **IA**: Groq (Llama 3) para chatbot, Google Gemini para utilitarios

### Integraciones
- **Mercado Pago**: Pagos con tarjetas y otros medios
- **Google OAuth**: Inicio de sesión con Google
- **n8n**: Automatización de emails (bienvenida, recuperación, confirmación)

## Estructura

```
vntg-hub/
├── client/          # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── .env
│   ├── .env.production
│   └── package.json
├── server/          # Backend Express
│   ├── index.js
│   ├── db.js
│   ├── escaner.js
│   ├── .env
│   └── package.json
└── README.md
```

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