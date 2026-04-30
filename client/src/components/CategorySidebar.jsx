import { X, Tag, ChevronRight, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CategorySidebar({ isOpen, onClose, categories }) {
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-brand-dark z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-zinc-800">
                    <span className="font-black dark:text-white text-xl italic tracking-tighter">
                        VNTG <span className="text-brand-orange">MENU</span>
                    </span>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-brand-orange transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Categorías Disponibles
                    </div>

                    {/* Mapeo dinámico: Si el backend hizo bien el filtro, aquí no habrá vacías */}
                    {categories && categories.length > 0 ? (
                        categories.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/categoria/${cat.id}`}
                                onClick={onClose}
                                className="flex items-center justify-between p-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-brand-orange transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-brand-blue group-hover:scale-110 transition-transform">
                                        <Tag size={18} />
                                    </span>
                                    {/* Aquí cat.name traerá el nombre REAL de la DB */}
                                    <span className="font-bold text-sm uppercase tracking-tight">{cat.name}</span>
                                </div>
                                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <p className="text-xs text-zinc-500 italic uppercase font-bold">No hay categorías con stock disponible</p>
                        </div>
                    )}

                    <div className="pt-6 mt-6 border-t dark:border-zinc-800">
                        <Link
                            to="/productos"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-3 text-brand-blue font-black text-[11px] uppercase italic hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        >
                            <LayoutGrid size={16} /> Ver todo el catálogo
                        </Link>
                    </div>
                </nav>

                <div className="absolute bottom-0 left-0 w-full p-6 border-t dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                    <p className="text-[9px] text-gray-400 font-bold uppercase text-center tracking-widest">
                        VNTG-HUB © 2026 Maipú, Argentina
                    </p>
                </div>
            </aside>
        </>
    );
}