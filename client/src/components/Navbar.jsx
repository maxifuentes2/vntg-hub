import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // En Vite usamos react-router-dom, no next/link
import { Menu, X, ShoppingCart, Search, ChevronDown, Sun, Moon, User, LogOut, Globe } from 'lucide-react'; 

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    
    // Lógica de Modo Oscuro nativa para Vite
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

    // MOCK: Simulamos el usuario por ahora
    const user = null; // Cambia a { name: "Usuario" } para ver cómo queda logueado
    const handleLogout = () => setIsOpen(false);

    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-neutral-800 shadow-sm transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                
                    {/* Logo Dinámico (Usamos etiqueta <img> normal en Vite) */}
                    <Link to="/" className="flex-shrink-0 flex items-center group">
                        <img 
                            src="/logo-texto-transparente.webp" 
                            alt="VNTG Hub" 
                            className="w-[150px] h-[50px] object-contain transition-transform group-hover:scale-105 dark:invert dark:brightness-200" 
                        />
                    </Link>

                    {/* Buscador Desktop */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-8">
                        <div className="relative w-full flex shadow-sm group">
                            <input 
                                type="text" 
                                placeholder="Buscar figuras, cómics, monedas..." 
                                className="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-l-lg py-2.5 px-4 focus:ring-2 focus:ring-brand-blue outline-none dark:text-white transition-all duration-300"
                            />
                            <button className="bg-brand-blue hover:bg-blue-800 text-white px-5 rounded-r-lg transition-colors duration-300 flex items-center justify-center">
                                <Search size={20} className="group-hover:scale-110 transition-transform duration-300" />
                            </button>
                        </div>
                    </div>

                    {/* Menú Desktop */}
                    <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                        
                        {/* Dropdown Categorías */}
                        <div className="relative group"> 
                            <button className="p-2 flex items-center space-x-1 text-gray-600 dark:text-gray-300 group-hover:text-brand-orange transition-colors duration-300 rounded-lg">
                                <span className="font-medium">Categorías</span>
                                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
                            </button>
                            
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible origin-top scale-y-95 group-hover:scale-y-100 transition-all duration-300 z-50">
                                <div className="w-48 mx-auto bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                                    <div className="py-2">
                                        <Link to="/categorias/marvel" className="block px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors duration-200">Marvel</Link>
                                        <Link to="/categorias/dc" className="block px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors duration-200">DC Comics</Link>
                                        <Link to="/categorias/anime" className="block px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors duration-200">Anime</Link>
                                        <Link to="/categorias/numismatica" className="block px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors duration-200">Numismática</Link>
                                        <Link to="/categorias/autos" className="block px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors duration-200">Autos</Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link to="/contacto" className="text-gray-600 dark:text-gray-300 hover:text-brand-orange font-medium transition-colors duration-300">
                            Contacto
                        </Link>

                        {/* Menú de Usuario */}
                        <div className="relative group">
                            <button className="p-2 text-gray-600 dark:text-gray-300 group-hover:text-brand-orange rounded-full transition-all duration-300 flex items-center gap-1">
                                <User size={20} />
                                {user && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />}
                            </button>
                            
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible origin-top scale-y-95 group-hover:scale-y-100 transition-all duration-300 z-50">
                                <div className="w-32 mx-auto bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                                    <div className="py-2 flex flex-col">
                                        {user ? (
                                            <>
                                                <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700 text-left">
                                                    <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Bienvenido</p>
                                                    <p className="text-sm font-bold text-brand-blue dark:text-white truncate">{user.name}</p>
                                                </div>
                                                <Link to="/cuenta" className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors flex items-center justify-start gap-2">
                                                    <User size={16} /> Cuenta
                                                </Link>
                                                <button onClick={handleLogout} className="px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-start gap-2 text-left w-full">
                                                    <LogOut size={16} /> Salir
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link to="/login" className="block px-4 py-3 text-sm text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors duration-200">
                                                    Ingresar
                                                </Link>
                                                <Link to="/register" className="block px-4 py-3 text-sm text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors duration-200">
                                                    Registrarse
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selector de Idiomas */}
                        <div className="relative group">
                            <button className="p-2 text-gray-600 dark:text-gray-300 group-hover:text-brand-orange rounded-full transition-all duration-300">
                                <Globe size={20} />
                            </button>
                            
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible origin-top scale-y-95 group-hover:scale-y-100 transition-all duration-300 z-50">
                                <div className="w-32 mx-auto bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                                    <div className="py-2 flex flex-col">
                                        <button className="px-4 py-2 text-sm text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors">🇪🇸 Español</button>
                                        <button className="px-4 py-2 text-sm text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors">🇺🇸 English</button>
                                        <button className="px-4 py-2 text-sm text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-orange hover:text-white transition-colors">🇵🇹 Português</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botón de Modo Oscuro / Claro */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all duration-300 transform hover:rotate-12"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <Link to="/carrito" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors duration-300 group">
                            <ShoppingCart size={24} className="group-hover:scale-110 transition-transform duration-300" />
                            <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">2</span>
                        </Link>
                    </div>

                    {/* Botones Móvil */}
                    <div className="md:hidden flex items-center space-x-2">
                        <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-300">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <Link to="/carrito" className="relative p-2 text-gray-900 dark:text-white">
                            <ShoppingCart size={24} />
                            <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">2</span>
                        </Link>
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-900 dark:text-white p-1 hover:text-brand-orange transition-colors z-50">
                            {isOpen ? <X size={28} className="transform rotate-90 transition-transform duration-300" /> : <Menu size={28} className="transition-transform duration-300" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menú Móvil Desplegable */}
            <div className={`md:hidden absolute top-20 left-0 w-full bg-white dark:bg-brand-dark border-t border-gray-200 dark:border-neutral-800 shadow-2xl overflow-hidden transition-all duration-500 origin-top ${isOpen ? 'opacity-100 max-h-screen scale-y-100' : 'opacity-0 max-h-0 scale-y-0'}`}>
                <div className="px-4 pt-4 pb-12 space-y-6 overflow-y-auto">
                    <div className="relative w-full flex shadow-sm">
                        <input type="text" placeholder="Buscar figuras..." className="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-l-lg py-3 px-4 focus:ring-2 focus:ring-brand-blue outline-none dark:text-white transition-colors duration-300" />
                        <button className="bg-brand-blue hover:bg-blue-800 text-white px-5 rounded-r-lg flex items-center justify-center transition-colors duration-300"><Search size={20} /></button>
                    </div>

                    <div className="flex flex-col space-y-5">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Categorías</span>
                        <Link onClick={() => setIsOpen(false)} to="/categorias/marvel" className="text-xl font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange transition-colors duration-200">Marvel</Link>
                        <Link onClick={() => setIsOpen(false)} to="/categorias/dc" className="text-xl font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange transition-colors duration-200">DC Comics</Link>
                        <Link onClick={() => setIsOpen(false)} to="/categorias/anime" className="text-xl font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange transition-colors duration-200">Anime</Link>
                        <Link onClick={() => setIsOpen(false)} to="/categorias/numismatica" className="text-xl font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange transition-colors duration-200">Numismática</Link>
                        <Link onClick={() => setIsOpen(false)} to="/categorias/autos" className="text-xl font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange transition-colors duration-200">Autos</Link>
                        
                        <div className="border-t border-gray-100 dark:border-neutral-800 pt-5 mt-2 flex flex-col space-y-5">
                            <Link onClick={() => setIsOpen(false)} to="/contacto" className="block text-xl font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange transition-colors duration-200">Contacto</Link>
                            
                            <div className="flex items-center space-x-3 text-gray-500 overflow-x-auto pb-2">
                                <Globe size={24} className="flex-shrink-0" />
                                <button className="text-lg font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange">ES</button>
                                <span className="text-gray-300 dark:text-neutral-700">|</span>
                                <button className="text-lg font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange">EN</button>
                                <span className="text-gray-300 dark:text-neutral-700">|</span>
                                <button className="text-lg font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange">PT</button>
                            </div>

                            {user ? (
                                <>
                                    <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl mt-2 text-left">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">Sesión iniciada</p>
                                        <p className="font-bold text-brand-blue dark:text-white">{user.name}</p>
                                    </div>
                                    <Link onClick={() => setIsOpen(false)} to="/cuenta" className="flex items-center gap-2 text-xl font-bold text-brand-orange">
                                        <User size={20} /> Mi Cuenta
                                    </Link>
                                    <button onClick={handleLogout} className="flex items-center gap-2 text-left text-xl font-bold text-red-500 hover:text-red-700 transition-colors">
                                        <LogOut size={20} /> Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col space-y-3 pt-2">
                                    <Link onClick={() => setIsOpen(false)} to="/login" className="text-xl font-bold text-gray-800 dark:text-gray-200 hover:text-brand-orange transition-colors duration-200">Ingresar</Link>
                                    <Link onClick={() => setIsOpen(false)} to="/register" className="w-full text-center bg-brand-orange hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors duration-300">Registrarse</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}