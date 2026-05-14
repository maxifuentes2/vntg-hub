import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Menu, 
    ShoppingCart, 
    Search, 
    Sun, 
    Moon, 
    User,
    LogOut,
    Settings,
    Heart // <-- 1. Importamos el ícono del corazón
} from 'lucide-react'; 
import CategorySidebar from './CategorySidebar';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Navbar({ onOpenCart, onOpenWishlist }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [dbCategories, setDbCategories] = useState([]); 
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- NUEVOS ESTADOS PARA EL MENÚ DE USUARIO ---
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const userMenuRef = useRef(null);
    
    // --- ESTADO TEMPORAL PARA LA WISHLIST ---
    // (A futuro lo puedes cambiar por algo como: const { wishlistCount } = useWishlist() )
    const { wishlistCount } = useWishlist();
    
    const { cartCount } = useCart();
    const navigate = useNavigate(); 

    // Cargar categorías y verificar si el usuario está logueado
    useEffect(() => {
        fetch(`${API_URL}/api/categories`)
            .then(res => res.json())
            .then(data => setDbCategories(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error cargando categorías:", err));

        // Verificar sesión del usuario
        const storedUser = localStorage.getItem('vntg_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Cerrar el menú de usuario si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Manejar el cambio de tema (Dark/Light)
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/categoria/all?search=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
            setIsSidebarOpen(false);
        }
    };

    // Función para cerrar sesión
    const handleLogout = () => {
        localStorage.removeItem('vntg_user');
        setUser(null);
        setIsUserMenuOpen(false);
        navigate('/');
        window.location.reload(); // Recarga para limpiar cualquier estado global
    };

    return (
        <>
            <nav className="sticky top-0 z-[100] bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
                <div className="max-w-[1700px] mx-auto px-4 h-20 flex items-center justify-between gap-4">
                    
                    {/* SECCIÓN IZQUIERDA: MENU Y LOGO */}
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white"
                        >
                            <Menu size={24} />
                        </button>

                        <Link to="/" className="flex items-center">
                            <img 
                                src="/logo-texto-transparente.webp" 
                                alt="VNTG HUB Logo" 
                                className="h-10 md:h-12 w-auto object-contain" 
                            />
                        </Link>
                    </div>

                    {/* SECCIÓN CENTRAL: BUSCADOR (DESKTOP) */}
                    <div className="hidden md:flex flex-1 max-w-xl">
                        <form onSubmit={handleSearch} className="relative w-full flex bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-transparent focus-within:border-brand-orange transition-all">
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar tesoros..." 
                                className="w-full bg-transparent py-2.5 px-6 outline-none dark:text-white text-sm italic font-medium"
                            />
                            <button type="submit" className="px-6 text-zinc-400 hover:text-brand-orange transition-colors">
                                <Search size={20} />
                            </button>
                        </form>
                    </div>

                    {/* SECCIÓN DERECHA: ACCIONES */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white"
                        >
                            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                        </button>

                        {/* --- MENÚ DE USUARIO DESPLEGABLE --- */}
                        <div className="relative" ref={userMenuRef}>
                            <button 
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white"
                            >
                                <User size={22} />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/5 shadow-2xl py-2 z-50">
                                    {user ? (
                                        // SI ESTÁ LOGUEADO
                                        <>
                                            <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 mb-2 bg-zinc-50 dark:bg-white/5">
                                                <p className="text-[9px] font-black uppercase italic tracking-widest text-brand-orange">Bienvenido</p>
                                                <p className="text-sm font-bold truncate text-zinc-900 dark:text-white">{user.name}</p>
                                                <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                                            </div>
                                            <Link 
                                                to="/mi-cuenta" 
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white transition-colors"
                                            >
                                                <Settings size={16} /> Mi Cuenta
                                            </Link>
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 text-left px-4 py-3 text-xs font-black uppercase italic text-red-500 hover:bg-red-500 hover:text-white transition-colors border-t border-zinc-200 dark:border-white/5 mt-1"
                                            >
                                                <LogOut size={16} /> Cerrar Sesión
                                            </button>
                                        </>
                                    ) : (
                                        // SI NO ESTÁ LOGUEADO
                                        <>
                                            <Link 
                                                to="/login" 
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="block px-4 py-3 text-xs font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white transition-colors"
                                            >
                                                Iniciar Sesión
                                            </Link>
                                            <Link 
                                                to="/register" 
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="block px-4 py-3 text-xs font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white transition-colors"
                                            >
                                                Registrarse
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* --- FIN MENÚ DE USUARIO --- */}

                        {/* --- BOTÓN DE WISHLIST SIDEBAR --- */}
                        <button 
                            onClick={onOpenWishlist}
                            className="relative p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white group"
                            aria-label="Abrir Lista de Deseos"
                        >
                            <Heart size={22} className="group-hover:text-brand-orange transition-colors" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-brand-dark">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* BOTÓN DEL CARRITO */}
                        <button 
                            onClick={onOpenCart} 
                            className="relative p-2 bg-brand-orange text-white rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all ml-1"
                        >
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-zinc-900 dark:bg-white text-white dark:text-brand-dark text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-orange">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            <CategorySidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                categories={dbCategories}
            />
        </>
    );
}