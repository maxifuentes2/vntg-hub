import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Menu, 
    ShoppingCart, 
    Search, 
    Sun, 
    Moon, 
    User
} from 'lucide-react'; 
import CategorySidebar from './CategorySidebar';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Navbar({ onOpenCart }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [dbCategories, setDbCategories] = useState([]); 
    const [searchTerm, setSearchTerm] = useState('');
    
    const { cartCount } = useCart();
    const navigate = useNavigate(); 

    // Cargar categorías desde la API
    useEffect(() => {
        fetch(`${API_URL}/api/categories`)
            .then(res => res.json())
            .then(data => setDbCategories(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error cargando categorías:", err));
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
                                /* Se eliminó 'dark:invert' para mantener el naranja original del logo */
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

                        <Link to="/login" className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white">
                            <User size={22} />
                        </Link>

                        <button 
                            onClick={onOpenCart} 
                            className="relative p-2 bg-brand-orange text-white rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
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