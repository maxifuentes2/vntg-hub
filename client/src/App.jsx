import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot'; 
import Inicio from './pages/Inicio';
import Categoria from './pages/Categoria'; 
import DetalleProducto from './pages/DetalleProducto';
import Login from './pages/Login';
import Registro from './pages/Registro';
import GuiaAutenticidad from './pages/GuiaAutenticidad';
import EnviosSeguros from './pages/EnviosSeguros';
import Contacto from './pages/Contacto';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import NotFound from './pages/NotFound'; 
import CartSidebar from './components/CartSidebar'; 
import { CartProvider } from './context/CartContext';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Estado compartido para los filtros de la página Categoria
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <CartProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-brand-dark text-zinc-900 dark:text-white transition-colors duration-300">
          
          <Navbar onOpenCart={() => setIsCartOpen(true)} />
          
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/producto/:id" element={<DetalleProducto />} />
              
              {/* Categoria recibe el estado y el setter como props */}
              <Route 
                path="/categoria/:id" 
                element={
                  <Categoria 
                    isFilterOpen={isFilterOpen} 
                    setIsFilterOpen={setIsFilterOpen} 
                  />
                } 
              />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Registro />} />
              <Route path="/guia-autenticidad" element={<GuiaAutenticidad />} />
              <Route path="/envios" element={<EnviosSeguros />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          
          <Footer />

          {/* El Chatbot solo se declara aquí una vez. 
              Se desplaza si el carrito O los filtros están abiertos.
          */}
          <Chatbot isSidebarOpen={isCartOpen || isFilterOpen} />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;