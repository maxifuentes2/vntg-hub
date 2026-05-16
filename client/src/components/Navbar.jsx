import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    Menu, 
    ShoppingCart, 
    Search, 
    Sun, 
    Moon, 
    User,
    LogOut,
    Settings,
    Heart,
    Shield 
} from 'lucide-react'; 
import { useCart } from '../context/CartContext';
import { useWishList } from '../context/WishListContext';
import { useSidebar } from '../context/SidebarContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Navbar() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [searchTerm, setSearchTerm] = useState('');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const userMenuRef = useRef(null);
    
    // Conexión con el estado global de los sidebars
    const { openCart, openWishList, openCategory } = useSidebar();
    const { wishListCount } = useWishList();
    const { cartCount } = useCart();
    const navigate = useNavigate(); 
    const location = useLocation();

    useEffect(() => {
        const storedUser = localStorage.getItem('vntg_user');
        if (storedUser && storedUser !== "undefined") {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Dato corrupto en localStorage", error);
                localStorage.removeItem('vntg_user');
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('vntg_user');
        setUser(null);
        setIsUserMenuOpen(false);
        navigate('/');
        window.location.reload();
    };

    return (
        <nav className="sticky top-0 z-[100] bg-white/40 dark:bg-brand-dark/40 backdrop-blur-2xl border-b border-white/20 dark:border-white/5 transition-all duration-500">
            <div className="max-w-[1700px] mx-auto px-2 sm:px-4 h-20 flex items-center justify-between gap-1 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-6">
                    {/* Botón de categorías conectado al contexto */}
                    <button onClick={openCategory} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white group">
                        <Menu size={24} className="group-hover:text-brand-orange transition-colors" />
                    </button>
                    <Link 
                        to="/" 
                        onClick={() => { if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="flex items-center"
                    >
                        <img src="/logo-texto-transparente.webp" alt="VNTG HUB Logo" className="h-8 sm:h-10 md:h-12 w-auto object-contain" />
                    </Link>
                </div>

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

                <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white group">
                        {theme === 'dark' ? (
                            <Sun size={22} className="group-hover:text-brand-orange transition-colors" />
                        ) : (
                            <Moon size={22} className="group-hover:text-brand-orange transition-colors" />
                        )}
                    </button>

                    <div className="relative" ref={userMenuRef}>
                        <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white group">
                            <User size={22} className="group-hover:text-brand-orange transition-colors" />
                        </button>
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl py-2 z-50 rounded-2xl overflow-hidden">
                                {user ? (
                                    <>
                                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 mb-2 bg-zinc-50 dark:bg-white/5">
                                            <p className="text-[9px] font-black uppercase italic tracking-widest text-brand-orange">Bienvenido</p>
                                            <p className="text-sm font-bold truncate text-zinc-900 dark:text-white capitalize">{user.name}</p>
                                            <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                                        </div>
                                        {user.role === 'admin' && (
                                            <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase italic text-brand-orange hover:bg-brand-orange hover:text-white transition-colors">
                                                <Shield size={16} /> Panel Admin
                                            </Link>
                                        )}
                                        {(user.role === 'support' || user.role === 'admin') && (
                                            <Link to="/soporte" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase italic text-brand-blue hover:bg-brand-blue hover:text-white transition-colors">
                                                <Shield size={16} /> Panel Soporte
                                            </Link>
                                        )}
                                        <Link to="/mi-cuenta" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white transition-colors">
                                            <Settings size={16} /> Mi Cuenta
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 text-left px-4 py-3 text-xs font-black uppercase italic text-red-500 hover:bg-red-500 hover:text-white transition-colors border-t border-zinc-200 dark:border-white/5 mt-1">
                                            <LogOut size={16} /> Cerrar Sesión
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-3 text-xs font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white transition-colors">Iniciar Sesión</Link>
                                        <Link to="/register" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-3 text-xs font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white transition-colors">Registrarse</Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button onClick={openWishList} className="relative p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white group">
                        <Heart size={22} className="group-hover:text-brand-orange transition-colors" />
                        {wishListCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-brand-dark">{wishListCount}</span>
                        )}
                    </button>

                    <button onClick={openCart} className="relative p-2 bg-brand-orange text-white rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all ml-1">
                        <ShoppingCart size={22} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-zinc-900 dark:bg-white text-white dark:text-brand-dark text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-orange">{cartCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Buscador Móvil */}
            <div className="md:hidden px-4 pb-4">
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
        </nav>
    );
}