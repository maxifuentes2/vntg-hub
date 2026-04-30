import { X, Sword, Shield, Zap, Coins, Car, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
    { name: 'Marvel', slug: 'marvel', icon: <Zap size={20} /> },
    { name: 'DC Comics', slug: 'dc', icon: <Shield size={20} /> },
    { name: 'Anime', slug: 'anime', icon: <Sword size={20} /> },
    { name: 'Numismática', slug: 'numismatica', icon: <Coins size={20} /> },
    { name: 'Autos', slug: 'autos', icon: <Car size={20} /> },
    ];

    export default function CategorySidebar({ isOpen, onClose }) {
    return (
        <>
        {/* Fondo oscuro traslúcido */}
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        {/* Menú deslizante */}
        <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-brand-dark z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-zinc-800">
            <span className="font-black dark:text-white text-xl">VNTG <span className="text-brand-orange">MENU</span></span>
            <button onClick={onClose} className="dark:text-white"><X size={24} /></button>
            </div>

            <nav className="p-4 space-y-1">
            {categories.map((cat) => (
                <Link
                key={cat.slug}
                to={`/categorias/${cat.slug}`}
                onClick={onClose}
                className="flex items-center justify-between p-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors group"
                >
                <div className="flex items-center gap-4">
                    <span className="text-brand-blue">{cat.icon}</span>
                    <span className="font-bold">{cat.name}</span>
                </div>
                <ChevronRight size={16} />
                </Link>
            ))}
            </nav>
        </aside>
        </>
    );
}