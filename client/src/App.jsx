import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Inicio from './pages/Inicio';
// Importamos la nueva página de categorías
import Categoria from './pages/Categoria'; 
import DetalleProducto from './pages/DetalleProducto';

// Dejamos Login y Registro de relleno por ahora
const Login = () => (
  <div className="py-20 flex justify-center text-3xl font-bold text-black dark:text-white">
    Página de Login
  </div>
);

const Registro = () => (
  <div className="py-20 flex justify-center text-3xl font-bold text-black dark:text-white">
    Página de Registro
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-neutral-900 transition-colors duration-300">
        
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/producto/:id" element={<DetalleProducto />} />
            {/* RUTA DINÁMICA: Detecta /categorias/marvel, /categorias/autos, etc. */}
            <Route path="/categorias/:categorySlug" element={<Categoria />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registro />} />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </Router>
  );
}

export default App; 