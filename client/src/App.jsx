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
import AdminPanel from './pages/AdminPanel';

// IMPORTACIONES DE CONTEXTOS
import { CartProvider } from './context/CartContext';
import { WishListProvider } from './context/WishListContext';
import { ToastProvider } from './context/ToastContext'; // <-- 1. RECUPERAMOS EL CONTEXTO DE TU AMIGO

// IMPORTACIONES DE AUTENTICACIÓN, CHECKOUT Y SIDEBARS
import Checkout from './pages/Checkout';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import MiCuenta from './pages/MiCuenta'; 
import WishListSidebar from './components/WishListSidebar'; 

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isWishListOpen, setIsWishListOpen] = useState(false); 

  return (
    <ToastProvider> {/* <-- 2. ENVOLVEMOS LA APP CON EL TOAST DE TU AMIGO */}
      <CartProvider>
        <WishListProvider> 
          <Router>
            <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-brand-dark text-zinc-900 dark:text-white transition-colors duration-300">
              
              <Navbar 
                onOpenCart={() => setIsCartOpen(true)} 
                onOpenWishList={() => setIsWishListOpen(true)} 
              />
              
              <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
              <WishListSidebar isOpen={isWishListOpen} onClose={() => setIsWishListOpen(false)} /> 

                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Inicio />} />
                    
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

                  <Route path="/checkout" element={<Checkout />} />
                  
                  <Route path="/mi-cuenta" element={<MiCuenta />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Registro />} />
                  <Route path="/recuperar-password" element={<RecuperarPassword />} />
                  <Route path="/reset-password" element={<RestablecerPassword />} />
                  
                  {/* 3. RECUPERAMOS TU RUTA DE ADMINISTRADOR QUE SE HABÍA BORRADO */}
                  <Route path="/admin" element={<AdminPanel />} />
                  
                  <Route path="/guia-autenticidad" element={<GuiaAutenticidad />} />
                  <Route path="/envios" element={<EnviosSeguros />} />
                  <Route path="/contacto" element={<Contacto />} />
                  <Route path="/terminos" element={<Terminos />} />
                  <Route path="/privacidad" element={<Privacidad />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              <Footer />
              <ScrollToTop />
              <Chatbot isSidebarOpen={isCartOpen || isFilterOpen || isWishListOpen} /> 
            </div>
          </Router>
        </WishListProvider>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;