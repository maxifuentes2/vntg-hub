import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Menu, 
    ShoppingCart, 
    Search, 
    Sun, 
    Moon, 
    Globe,
    User 
} from 'lucide-react'; 
import CategorySidebar from './CategorySidebar';

export default function Navbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    
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

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-neutral-800 shadow-sm transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        
                        {/* Izquierda: Menú + Logo */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                <Menu size={24} />
                            </button>

                            <Link to="/" className="flex-shrink-0 flex items-center group">
                                {/* Asegúrate de que esta imagen esté en public/ */}
                                <div className="text-2xl font-black dark:text-white tracking-tighter">
                                    <img 
                                        src="/logo-texto-transparente.webp" 
                                        alt="VNTG Hub" 
                                        className="w-[150px] h-[50px] object-contain transition-transform group-hover:scale-105 dark:invert dark:brightness-200" />
                                </div>
                            </Link>
                        </div>

                        {/* Centro: Buscador Desktop */}
                        <div className="hidden md:flex flex-1 max-w-xl mx-8">
                            <div className="relative w-full flex group">
                                <input 
                                    type="text" 
                                    placeholder="Buscar figuras, monedas..." 
                                    className="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-l-xl py-2 px-4 focus:ring-2 focus:ring-brand-blue outline-none dark:text-white transition-all"
                                />
                                <button className="bg-brand-blue hover:bg-blue-800 text-white px-5 rounded-r-xl transition-colors flex items-center justify-center">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Derecha: Acciones */}
                        <div className="flex items-center space-x-4">
                            <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-all">
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            <Link to="/carrito" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange">
                                <ShoppingCart size={24} />
                                <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
                            </Link>

                            <Link to="/login" className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange">
                                <User size={24} />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar Lateral */}
            <CategorySidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
        </>
    );
}