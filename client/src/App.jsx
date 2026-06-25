import { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot'; 
import SubtleScrollToTop from './components/SubtleScrollToTop'; 
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
import Tutoriales from './pages/Tutoriales';
import AdminPanel from './pages/AdminPanel';
import Puntos from './pages/Puntos';

// NUEVA IMPORTACIÓN PARA EL RESET DE SCROLL Y TÍTULOS DINÁMICOS
import ScrollToTopOnNavigation from './components/ScrollToTopOnNavigation';
import RouteTitleManager from './components/RouteTitleManager';

// IMPORTACIONES DE SIDEBARS
import CartSidebar from './components/CartSidebar'; 
import WishListSidebar from './components/WishListSidebar'; 
import CategorySidebar from './components/CategorySidebar';

// IMPORTACIONES DE CONTEXTOS
import { CartProvider } from './context/CartContext';
import { WishListProvider } from './context/WishListContext';
import { ToastProvider, useToast } from './context/ToastContext'; 
import { SidebarProvider } from './context/SidebarContext'; 
import { CurrencyProvider } from './context/CurrencyContext'; 
import { AuthProvider, useAuth } from './context/AuthContext';

// IMPORTACIONES DE AUTENTICACIÓN Y CHECKOUT
import Checkout from './pages/Checkout';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import MiCuenta from './pages/MiCuenta'; 

function ChatbotWrapper() {
  return <Chatbot />;
}

function TokenGuard() {
  const { logout } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('vntg_token');
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          logout();
        }
      } catch {
        logout();
      }
    };
    checkToken();
    window.addEventListener('focus', checkToken);
    return () => window.removeEventListener('focus', checkToken);
  }, [logout]);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, opts = {}] = args;
      // Add credentials: 'include' for API calls so httpOnly cookie is sent
      if (typeof url === 'string' && (url.startsWith(API_URL) || url.startsWith('/api'))) {
        opts.credentials = opts.credentials || 'include';
      }
      const res = await originalFetch(url, opts);
      if (res.status === 401 && localStorage.getItem('vntg_token')) {
        logout();
      }
      return res;
    };
    return () => { window.fetch = originalFetch; };
  }, [logout]);

  return null;
}

function GoogleOAuthHandler() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        window.history.replaceState({}, '', window.location.pathname);
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken })
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              login(data.user, data.token);
              addToast({ title: 'Sesión Iniciada' }, `Bienvenid@ ${(data.user.name || '').split(' ')[0] || data.user.email}`, 'success');
              navigate('/', { replace: true });
            } else {
              navigate('/login', { state: { googleError: data.error || "Error al iniciar sesión con Google" }, replace: true });
            }
          })
          .catch(() => {
            navigate('/login', { state: { googleError: "Error de conexión. Inténtalo más tarde." }, replace: true });
          });
      }
    }
  }, []);

  return null;
}

function FloatingHomeButton() {
  const location = useLocation();
  if (location.pathname === '/' || location.pathname === '/admin') return null;
  return (
    <Link
      to="/"
      className="fixed top-[150px] md:top-24 left-4 z-[60] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 rounded-2xl flex items-center gap-2 transition-all duration-500 hover:scale-105 active:scale-95 group shadow-lg max-[360px]:top-[130px] max-[360px]:z-[110] max-[360px]:px-2 max-[360px]:py-1.5"
    >
      <ArrowLeft size={16} className="text-zinc-500 group-hover:text-brand-orange transition-colors" />
      <span className="text-[10px] font-black uppercase italic tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Volver al inicio</span>
    </Link>
  );
}

function App() {
  const [categories, setCategories] = useState([]); 

  // Carga de categorías para el CategorySidebar
  const loadCategories = () => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Error cargando categorías en App:", err));
  };

  useEffect(() => {
    loadCategories();
    const onUpdate = () => loadCategories();
    window.addEventListener('vntg-categories-update', onUpdate);
    window.addEventListener('popstate', onUpdate);
    window.addEventListener('focus', onUpdate);
    return () => {
      window.removeEventListener('vntg-categories-update', onUpdate);
      window.removeEventListener('popstate', onUpdate);
      window.removeEventListener('focus', onUpdate);
    };
  }, []);

  return (
    <AuthProvider>
    <ToastProvider>
      <CurrencyProvider>
      <SidebarProvider>
        <CartProvider>
          <WishListProvider> 
            <Router>
              {/* COMPONENTE LÓGICO DE SCROLL Y TÍTULO: Asegura que cada navegación empiece desde arriba y cambie el título */}
              <ScrollToTopOnNavigation />
              <RouteTitleManager />
              <GoogleOAuthHandler />
              <TokenGuard />

              <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-brand-dark text-zinc-900 dark:text-white transition-colors duration-300">

                <Navbar /> 
                <CartSidebar />
                <WishListSidebar />
                <CategorySidebar categories={categories} />

                <FloatingHomeButton />

                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Inicio />} />
                    <Route path="/producto/:slug" element={<DetalleProducto />} />
                    <Route 
                      path="/categoria/:slug" 
                      element={
                        <Categoria />
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
                    <Route path="/guia-autenticidad" element={<GuiaAutenticidad />} />
                    <Route path="/envios" element={<EnviosSeguros />} />
                    <Route path="/contacto" element={<Contacto />} />
                    <Route path="/tutoriales" element={<Tutoriales />} />
                    <Route path="/terminos" element={<Terminos />} />
                    <Route path="/privacidad" element={<Privacidad />} />
                    <Route path="/puntos" element={<Puntos />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                
                <Footer />
                <ChatbotWrapper /> 
                <SubtleScrollToTop />
              </div>
            </Router>
          </WishListProvider>
        </CartProvider>
      </SidebarProvider>
      </CurrencyProvider>
    </ToastProvider>
    </AuthProvider>
  );
}

export default App;