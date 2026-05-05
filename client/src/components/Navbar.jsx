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

const API_URL = import.meta.env.VITE_API_URL || "http://kernelos-pc:5000";

export default function Navbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [dbCategories, setDbCategories] = useState([]); 
    const [searchTerm, setSearchTerm] = useState('');
    
    const { cartCount } = useCart();
    const user = null; 
    const navigate = useNavigate(); 

    useEffect(() => {
        fetch(`${API_URL}/api/categories`, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        })
            .then(res => res.json())
            .then(data => setDbCategories(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error cargando categorías:", err));
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleSearch = (e) => {
        e.preventDefault(); 
        if (searchTerm.trim()) {
            navigate(`/categoria/all?search=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm(''); 
        }
    };

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-neutral-800 shadow-sm transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                <Menu size={24} />
                            </button>

                            <Link to="/" className="flex-shrink-0 flex items-center group">
                                <div className="text-2xl font-black dark:text-white tracking-tighter">
                                    <img 
                                        src="/logo-texto-transparente.webp" 
                                        alt="VNTG Hub" 
                                        className="w-[150px] h-[50px] object-contain transition-transform group-hover:scale-105 dark:invert dark:brightness-200" 
                                    />
                                </div>
                            </Link>
                        </div>

                        <div className="hidden md:flex flex-1 max-w-xl mx-8">
                            <form onSubmit={handleSearch} className="relative w-full flex group shadow-sm">
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar figuras, autos, franquicias..." 
                                    className="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-l-xl py-2 px-4 focus:ring-2 focus:ring-brand-blue outline-none dark:text-white transition-all"
                                />
                                <button type="submit" className="bg-brand-blue hover:bg-blue-800 text-white px-5 rounded-r-xl transition-colors">
                                    <Search size={18} />
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center space-x-1 md:space-x-3">
                            <Link to={user ? "/cuenta" : "/login"} className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-all">
                                <User size={22} />
                            </Link>

                            <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-all transform hover:rotate-12">
                                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                            </button>

                            <Link to="/carrito" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange group">
                                <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
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