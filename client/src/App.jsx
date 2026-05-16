import { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollTotop';
import Chatbot from './components/Chatbot'; 
import Inicio from './pages/Inicio';
import Categoria from './pages/Categoria'; 
import PedidoDetalle from './pages/PedidoDetalle';
import DetalleProducto from './pages/DetalleProducto';
import Login from './pages/Login';
import Registro from './pages/Registro';
import GuiaAutenticidad from './pages/GuiaAutenticidad';
import EnviosSeguros from './pages/EnviosSeguros';
import Contacto from './pages/Contacto';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import NotFound from './pages/NotFound'; 
import AdminPanel from './pages/AdminPanel';
import SupportPanel from './pages/SupportPanel';

// NUEVA IMPORTACIÓN PARA EL RESET DE SCROLL
import ScrollToTopOnNavigation from './components/ScrollToTopOnNavigation';

// IMPORTACIONES DE SIDEBARS
import CartSidebar from './components/CartSidebar'; 
import WishListSidebar from './components/WishListSidebar'; 
import CategorySidebar from './components/CategorySidebar';

// IMPORTACIONES DE CONTEXTOS
import { CartProvider } from './context/CartContext';
import { WishListProvider } from './context/WishListContext';
import { ToastProvider } from './context/ToastContext'; 
import { SidebarProvider } from './context/SidebarContext'; 

// IMPORTACIONES DE AUTENTICACIÓN Y CHECKOUT
import Checkout from './pages/Checkout';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import MiCuenta from './pages/MiCuenta'; 

function App() {
  const [isFilterOpen, setIsFilterOpen] = useState(false); 
  const [categories, setCategories] = useState([]); 

  // Carga de categorías para el CategorySidebar
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Error cargando categorías en App:", err));
  }, []);

  return (
    <ToastProvider>
      <SidebarProvider>
        <CartProvider>
          <WishListProvider> 
            <Router>
              {/* COMPONENTE LÓGICO DE SCROLL: Asegura que cada navegación empiece desde arriba */}
              <ScrollToTopOnNavigation />

              <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-brand-dark text-zinc-900 dark:text-white transition-colors duration-300">
                <Navbar /> 
                <CartSidebar />
                <WishListSidebar />
                <CategorySidebar categories={categories} />

                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Inicio />} />
                    <Route path="/producto/:slug" element={<DetalleProducto />} />
                    <Route 
                      path="/categoria/:slug" 
                      element={
                        <Categoria 
                          isFilterOpen={isFilterOpen} 
                          setIsFilterOpen={setIsFilterOpen} 
                        />
                      } 
                    />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/mi-cuenta" element={<MiCuenta />} />
                    <Route path="/pedido/:id" element={<PedidoDetalle />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Registro />} />
                    <Route path="/recuperar-password" element={<RecuperarPassword />} />
                    <Route path="/reset-password" element={<RestablecerPassword />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/soporte" element={<SupportPanel />} />
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
                <Chatbot isFilterOpen={isFilterOpen} /> 
              </div>
            </Router>
          </WishListProvider>
        </CartProvider>
      </SidebarProvider>
    </ToastProvider>
  );
}

export default App;