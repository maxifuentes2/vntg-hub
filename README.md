# 🛒 VNTG Hub - E-commerce de Coleccionables

## 📄 Descripción del Proyecto
Plataforma de comercio electrónico de alta gama diseñada para coleccionistas de cultura pop. El sistema ofrece una experiencia premium con diseño *glassmorphism*, modo oscuro nativo y una interfaz ultra-reactiva.

## 🚀 Stack Tecnológico

### Frontend
* **Core**: React.js 18.
* **Estilos**: Tailwind CSS (Diseño moderno, premium y responsivo).
* **Iconos**: Lucide React.
* **Estado Global**: React Context API (Carrito, Wishlist, Notificaciones).
* **Herramienta de Construcción**: Vite.

### Backend & DB
* **Entorno**: Node.js + Express.
* **Base de Datos**: MySQL (Gestión de productos, órdenes y usuarios).
* **Seguridad**: Autenticación basada en JWT y encriptación con Bcryptjs.

### 🔌 Integraciones Clave
* **Mercado Pago API**: Integración completa para pagos seguros con tarjetas y otros medios.
* **Google Gemini AI**: Chatbot inteligente de soporte integrado para resolver dudas en tiempo real.
* **n8n**: Orquestación de flujos de trabajo para el envío automatizado de correos electrónicos (Bienvenida, Recuperación, Confirmación de compra).

## 📁 Estructura y Setup
El proyecto está organizado en dos módulos: `/client` (Frontend) y `/server` (Backend).

### Requisitos Previos
* Node.js (v18+)
* MySQL
* PNPM (Recomendado) o NPM

### Instalación
1. Clonar el repositorio.
2. Configurar los archivos `.env` tanto en `/client` como en `/server` (usar `.env.example` como guía).

#### Ejecución en Desarrollo:
1. **Servidor**:
   ```bash
   cd server
   pnpm install
   pnpm run dev
   ```
2. **Cliente**:
   ```bash
   cd client
   pnpm install
   pnpm run dev
   ```

## ⚠️ Reglas de Desarrollo
1. **Ramas**: No subir cambios directamente a `main`. Usar ramas descriptivas (ej: `feat/panel-soporte`).
2. **Pull Requests**: Todo cambio debe ser revisado antes de integrarse.
3. **Seguridad**: El archivo `.env` está en `.gitignore`. No compartir credenciales.

---

## 🎓 Créditos
Este proyecto es desarrollado por estudiantes de la Universidad del Aconcagua (Mendoza, Argentina):

* Máximo Fuentes
* Enzo Bautista Delluniversidad
* Ignacio Povolo
* Gaspar Barroso
* Santiago Zufia
* Bruno Guzmán

© 2026 VNTG Hub Team