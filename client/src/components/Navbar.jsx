import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Menu, 
    ShoppingCart, 
    Search, 
    Sun, 
    Moon, 
    Globe,
    User,
    LogOut
} from 'lucide-react'; 
import CategorySidebar from './CategorySidebar';

export default function Navbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    
    // MOCK: Simulamos el usuario por ahora
    const user = null; 
    const cartItemCount = 0; // Cambia a 1, 2, etc. para ver cómo aparece el círculo
    const handleLogout = () => console.log("Cerrando sesión...");
    
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
                                <div className="text-2xl font-black dark:text-white tracking-tighter">
                                    <img 
                                        src="/logo-texto-transparente.webp" 
                                        alt="VNTG Hub" 
                                        className="w-[150px] h-[50px] object-contain transition-transform group-hover:scale-105 dark:invert dark:brightness-200" 
                                    />
                                </div>
                            </Link>
                        </div>

                        {/* Centro: Buscador Desktop */}
                        <div className="hidden md:flex flex-1 max-w-xl mx-8">
                            <div className="relative w-full flex group shadow-sm">
                                <input 
                                    type="text" 
                                    placeholder="Buscar figuras, monedas..." 
                                    className="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-l-xl py-2 px-4 focus:ring-2 focus:ring-brand-blue outline-none dark:text-white transition-all"
                                />
                                <button className="bg-brand-blue hover:bg-blue-800 text-white px-5 rounded-r-xl transition-colors flex items-center justify-center">
                                    <Search size={18} className="group-hover:scale-110 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        {/* Derecha: Acciones en el orden solicitado */}
                        <div className="flex items-center space-x-1 md:space-x-3">
                            
                            {/* 1. Personita (Usuario) - AHORA ES UN LINK DIRECTO */}
                            <Link 
                                to={user ? "/cuenta" : "/login"} 
                                title={user ? "Mi Cuenta" : "Iniciar Sesión"}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all duration-300 flex items-center"
                            >
                                <User size={22} />
                            </Link>

                            {/* 2. Mundito (Idioma) */}
                            <div className="relative group flex justify-center">
                                <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all duration-300">
                                    <Globe size={22} />
                                </button>
                                
                                {/* Redujimos el ancho: cambiamos w-32 por w-20 */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-20 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible origin-top scale-y-95 group-hover:scale-y-100 transition-all duration-300 z-50">
                                    <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-lg shadow-xl py-2 flex flex-col">
                                        {/* Volvimos a poner text-left */}
                                        <button className="px-3 py-2 text-sm text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors w-full">🇪🇸 ES</button>
                                        <button className="px-3 py-2 text-sm text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors w-full">🇺🇸 EN</button>
                                        <button className="px-3 py-2 text-sm text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors w-full">🇵🇹 PT</button>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Tema Claro/Oscuro (Sol/Luna) */}
                            <button 
                                onClick={toggleTheme} 
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all duration-300 transform hover:rotate-12"
                            >
                                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                            </button>

                            {/* 4. Carrito */}
                            <Link to="/carrito" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all duration-300 group ml-1">
                                <ShoppingCart size={24} className="group-hover:scale-110 transition-transform duration-300" />
                                
                                {/* RENDERIZADO CONDICIONAL: Solo muestra el span si cartItemCount es mayor a 0 */}
                                {cartItemCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                                        {cartItemCount}
                                    </span>
                                )}
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