import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'; // Importamos tu Navbar

// Estos son componentes "de relleno" para probar que la navegación funciona.
// Luego los cambiaremos por tus archivos reales (Home, Login, etc.)
const Inicio = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-black dark:text-white flex justify-center pt-20 text-3xl font-bold transition-colors duration-300">
    Página de Inicio
  </div>
);

const Login = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-black dark:text-white flex justify-center pt-20 text-3xl font-bold transition-colors duration-300">
    Página de Login
  </div>
);

const Registro = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-black dark:text-white flex justify-center pt-20 text-3xl font-bold transition-colors duration-300">
    Página de Registro
  </div>
);

function App() {
  return (
    <Router>
      {/* 1. La Navbar se pone fuera de las Routes para que sea visible en TODAS las pantallas */}
      <Navbar />

      {/* 2. Aquí definimos qué componente se carga según la URL */}
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registro />} />
        {/* Aquí iremos agregando /contacto, /categorias/autos, etc. */}
      </Routes>
    </Router>
  );
}

export default App;