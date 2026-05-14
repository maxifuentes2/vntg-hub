import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollTotop';
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
import { WishListProvider } from './context/WishListContext'; // <-- Corregido con L mayúscula

// IMPORTACIONES DE AUTENTICACIÓN, CHECKOUT Y SIDEBARS
import Checkout from './pages/Checkout';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import MiCuenta from './pages/MiCuenta'; 
import WishListSidebar from './components/WishListSidebar'; // <-- Corregido con L mayúscula

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isWishListOpen, setIsWishListOpen] = useState(false); // <-- Estado con L mayúscula

  return (
    <CartProvider>
      <WishListProvider> {/* <-- Provider con L mayúscula */}
        <Router>
          <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-brand-dark text-zinc-900 dark:text-white transition-colors duration-300">
            
            {/* Le pasamos ambas funciones a la Navbar */}
            <Navbar 
              onOpenCart={() => setIsCartOpen(true)} 
              onOpenWishList={() => setIsWishListOpen(true)} // <-- Prop con L mayúscula
            />
            
            {/* PANELES LATERALES (SIDEBARS) */}
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <WishListSidebar isOpen={isWishListOpen} onClose={() => setIsWishListOpen(false)} /> {/* <-- Componente con L mayúscula */}

            <main className="flex-grow">
              <Routes>
                {/* RUTA PRINCIPAL */}
                <Route path="/" element={<Inicio />} />
                
                {/* PRODUCTOS Y CATEGORÍAS */}
                <Route path="/producto/:id" element={<DetalleProducto />} />
                <Route 
                  path="/categoria/:id" 
                  element={
                    <Categoria 
                      isFilterOpen={isFilterOpen} 
                      setIsFilterOpen={setIsFilterOpen} 
                    />
                  } 
                />

                {/* FLUJO DE PAGO */}
                <Route path="/checkout" element={<Checkout />} />
                
                {/* USUARIO Y SESIÓN */}
                <Route path="/mi-cuenta" element={<MiCuenta />} />
                {/* Se eliminó la ruta /wishlist porque ahora es un Sidebar */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Registro />} />
                <Route path="/recuperar-password" element={<RecuperarPassword />} />
                <Route path="/reset-password" element={<RestablecerPassword />} />
                
                {/* PÁGINAS DE INFORMACIÓN */}
                <Route path="/guia-autenticidad" element={<GuiaAutenticidad />} />
                <Route path="/envios" element={<EnviosSeguros />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/terminos" element={<Terminos />} />
                <Route path="/privacidad" element={<Privacidad />} />
                
                {/* ERROR 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            <Footer />

            <ScrollToTop />

            <Chatbot isSidebarOpen={isCartOpen || isFilterOpen || isWishListOpen} /> {/* <-- Estado con L mayúscula */}
          </div>
        </Router>
      </WishListProvider>
    </CartProvider>
  );
}

export default App;