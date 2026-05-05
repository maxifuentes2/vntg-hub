import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot'; 
import Inicio from './pages/Inicio';
import Categoria from './pages/Categoria'; 
import DetalleProducto from './pages/DetalleProducto';
import Carrito from './pages/Carrito';
import Login from './pages/Login';
import Registro from './pages/Registro';
import GuiaAutenticidad from './pages/GuiaAutenticidad';
import EnviosSeguros from './pages/EnviosSeguros';
import Contacto from './pages/Contacto';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';

// 1. AGREGAMOS LA IMPORTACIÓN DE LA NUEVA PÁGINA AQUÍ
import NotFound from './pages/NotFound'; 

// IMPORTAMOS EL PROVEEDOR DEL CARRITO
import { CartProvider } from './context/CartContext';

function App() {
  return (
    /* ENVOLVEMOS TODA LA APP CON EL PROVIDER */
    <CartProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-neutral-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/producto/:id" element={<DetalleProducto />} />
              <Route path="/categoria/:id" element={<Categoria />} />
              <Route path="/carrito" element={<Carrito />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Registro />} />
              <Route path="/guia-autenticidad" element={<GuiaAutenticidad />} />
              <Route path="/envios" element={<EnviosSeguros />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/privacidad" element={<Privacidad />} />
              
              {/* 2. AGREGAMOS LA RUTA 404 AL FINAL DE TODAS LAS DEMÁS */}
              <Route path="*" element={<NotFound />} />
              
            </Routes>
          </main>
          <Footer />
          
          {/* COLOCAMOS EL CHATBOT AQUÍ, DENTRO DEL DIV PRINCIPAL */}
          <Chatbot />
          
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;