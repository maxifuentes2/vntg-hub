import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { slugify } from '../utils/slugify';
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
    const [searchResults, setSearchResults] = useState([]);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const userMenuRef = useRef(null);
    const searchRef = useRef(null);
    
    // Conexión con el estado global de los sidebars
    const { openCart, openWishList, openCategory } = useSidebar();
    const { wishListCount } = useWishList();
    const { cartCount, cart, syncCartToServer } = useCart();
    const navigate = useNavigate(); 
    const location = useLocation();

    // Búsqueda predictiva (Autocomplete)
    useEffect(() => {
        const fetchResults = async () => {
            if (searchTerm.trim().length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                const res = await fetch(`${API_URL}/api/products?q=${encodeURIComponent(searchTerm)}`);
                const data = await res.json();
                setSearchResults(data.slice(0, 5)); // Mostrar máximo 5 predicciones
            } catch (err) {
                console.error("Error en búsqueda predictiva:", err);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300); // Debounce de 300ms
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Cerrar resultados al hacer clic afuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const performSearch = (term) => {
        const query = term || searchTerm;
        if (query.trim()) {
            navigate(`/categoria/all?search=${encodeURIComponent(query.trim())}`);
            setSearchTerm('');
            setSearchResults([]);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        performSearch();
    };

    const handleSelectResult = (product) => {
        navigate(`/producto/${slugify(product.title)}`);
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleLogout = async () => {
        await syncCartToServer(cart);
        localStorage.removeItem('vntg_user');
        localStorage.removeItem('vntg_token');
        localStorage.removeItem('vntg_interests');
        setUser(null);
        setIsUserMenuOpen(false);
        navigate('/');
        window.location.reload();
    };

    return (
        <nav className="sticky top-0 z-[100] bg-white dark:bg-brand-dark border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-all duration-500">
            <div className="max-w-[1700px] mx-auto px-2 sm:px-4 h-20 flex items-center justify-between gap-1 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-6">
                    {/* Botón de categorías conectado al contexto */}
                    <button onClick={openCategory} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors dark:text-white group">
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

                <div className="hidden md:flex flex-1 max-w-xl relative" ref={searchRef}>
                    <form onSubmit={handleSearch} className="relative w-full flex bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-transparent hover:border-brand-orange focus-within:border-brand-orange transition-all">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar tesoros..." 
                            className="w-full bg-transparent py-2.5 px-6 outline-none dark:text-white text-base italic font-medium"
                        />
                        <button type="submit" className="px-6 text-zinc-400 hover:text-brand-orange transition-colors">
                            <Search size={20} />
                        </button>
                    </form>

                    {/* Resultados Predictivos Desktop */}
                    {searchTerm.trim().length >= 2 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-brand-card  shadow-xl rounded-2xl shadow-2xl overflow-hidden py-2 animate-reveal">
                            {searchResults.length > 0 ? (
                                <>
                                    {searchResults.map(p => (
                                        <button 
                                            key={p.id}
                                            onMouseDown={() => handleSelectResult(p)}
                                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-brand-orange group transition-all text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                                <img src={p.images} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black uppercase italic text-zinc-900 dark:text-white group-hover:text-white truncate">{p.title}</p>
                                                <p className="text-[9px] font-bold text-zinc-500 group-hover:text-white/70 uppercase truncate">{p.franchise || 'VNTG Hub'}</p>
                                            </div>
                                            <Search size={14} className="text-zinc-400 group-hover:text-white" />
                                        </button>
                                    ))}
                                    <button 
                                        onMouseDown={handleSearch}
                                        className="w-full flex items-center justify-between px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-brand-orange/10 rounded-lg group-hover:bg-brand-orange transition-colors">
                                                <Search size={14} className="text-brand-orange group-hover:text-white" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase italic text-zinc-600 dark:text-white/60 group-hover:text-brand-orange transition-colors">Ver todos los resultados para <span className="text-zinc-900 dark:text-white">"{searchTerm}"</span></p>
                                        </div>
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onMouseDown={handleSearch}
                                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                                >
                                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-brand-orange transition-colors">
                                        <Search size={14} className="text-zinc-400 group-hover:text-white" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase italic text-zinc-600 dark:text-white/60 group-hover:text-brand-orange transition-colors">No hay coincidencias directas. Buscar <span className="text-zinc-900 dark:text-white">"{searchTerm}"</span> en toda la tienda</p>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors dark:text-white group">
                        {theme === 'dark' ? (
                            <Sun size={22} className="group-hover:text-brand-orange transition-colors" />
                        ) : (
                            <Moon size={22} className="group-hover:text-brand-orange transition-colors" />
                        )}
                    </button>

                    <div className="relative" ref={userMenuRef}>
                        <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors dark:text-white group">
                            <User size={22} className="group-hover:text-brand-orange transition-colors" />
                        </button>
                        <div className={`absolute right-0 max-[400px]:fixed max-[400px]:left-2 max-[400px]:right-2 max-[400px]:w-auto mt-3 w-64 bg-white dark:bg-brand-card  shadow-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 rounded-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-top-right transform ${isUserMenuOpen ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto' : 'scale-0 opacity-0 -translate-y-4 pointer-events-none'}`}>
                            {user ? (
                                <>
                                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 mb-2 bg-zinc-50/50 dark:bg-zinc-800">
                                        <p className="text-[9px] font-black uppercase italic tracking-[0.2em] text-brand-orange mb-1">Usuario Identificado</p>
                                        <p className="text-sm font-black italic uppercase truncate text-zinc-900 dark:text-white">{user.name}</p>
                                        <p className="text-[10px] font-bold text-zinc-500 truncate">{user.email}</p>
                                    </div>
                                    <div className="px-2 space-y-1 pb-2">
                                        {user.role === 'admin' && (
                                            <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase italic text-brand-orange hover:bg-brand-orange hover:text-white rounded-xl transition-all">
                                                <Shield size={16} /> Panel Admin
                                            </Link>
                                        )}
                                        {(user.role === 'support' || user.role === 'admin') && (
                                            <Link to="/soporte" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase italic text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl transition-all">
                                                <Shield size={16} /> Panel Soporte
                                            </Link>
                                        )}
                                        <Link to="/mi-cuenta" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white rounded-xl transition-all">
                                            <Settings size={16} /> Mi Cuenta
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 text-left px-4 py-3 text-[11px] font-black uppercase italic text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border-t border-zinc-100 dark:border-zinc-800 mt-2">
                                            <LogOut size={16} /> Cerrar Sesión
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="px-2 space-y-1 py-1">
                                    <Link to="/login" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-3 text-[11px] font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white rounded-xl transition-all">Iniciar Sesión</Link>
                                    <Link to="/register" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-3 text-[11px] font-black uppercase italic text-zinc-700 dark:text-zinc-300 hover:bg-brand-orange hover:text-white rounded-xl transition-all">Registrarse</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <button onClick={openWishList} className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors dark:text-white group">
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
            <div className="md:hidden px-4 pb-4 relative" ref={searchRef}>
                <form onSubmit={handleSearch} className="relative w-full flex bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-transparent hover:border-brand-orange focus-within:border-brand-orange transition-all">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar tesoros..." 
                        className="w-full bg-transparent py-2.5 px-6 outline-none dark:text-white text-base italic font-medium"
                    />
                    <button type="submit" className="px-6 text-zinc-400 hover:text-brand-orange transition-colors">
                        <Search size={20} />
                    </button>
                </form>

                {/* Resultados Predictivos Móvil */}
                {searchTerm.trim().length >= 2 && (
                    <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-brand-card  shadow-xl rounded-2xl shadow-2xl overflow-hidden py-2 z-50 animate-reveal">
                        {searchResults.length > 0 ? (
                            <>
                                {searchResults.map(p => (
                                    <button 
                                        key={p.id}
                                        onMouseDown={() => handleSelectResult(p)}
                                        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-brand-orange group transition-all text-left"
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                            <img src={p.images} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black uppercase italic text-zinc-900 dark:text-white group-hover:text-white truncate">{p.title}</p>
                                            <p className="text-[9px] font-bold text-zinc-500 group-hover:text-white/70 uppercase truncate">{p.franchise || 'VNTG Hub'}</p>
                                        </div>
                                        <Search size={14} className="text-zinc-400 group-hover:text-white" />
                                    </button>
                                ))}
                                <button 
                                    onMouseDown={handleSearch}
                                    className="w-full flex items-center justify-between px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-orange/10 rounded-lg group-hover:bg-brand-orange transition-colors">
                                            <Search size={14} className="text-brand-orange group-hover:text-white" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase italic text-zinc-600 dark:text-white/60 group-hover:text-brand-orange transition-colors">Ver todos los resultados para <span className="text-zinc-900 dark:text-white">"{searchTerm}"</span></p>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <button 
                                onMouseDown={handleSearch}
                                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                            >
                                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-brand-orange transition-colors">
                                    <Search size={14} className="text-zinc-400 group-hover:text-white" />
                                </div>
                                <p className="text-[10px] font-black uppercase italic text-zinc-600 dark:text-white/60 group-hover:text-brand-orange transition-colors">No hay coincidencias directas. Buscar <span className="text-zinc-900 dark:text-white">"{searchTerm}"</span> en toda la tienda</p>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}