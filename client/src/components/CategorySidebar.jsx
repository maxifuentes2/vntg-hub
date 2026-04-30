import { 
    X, 
    Tag, 
    ChevronRight, 
    LayoutGrid, 
    CarFront, 
    Film, 
    BookOpen, 
    Bot,
    Gamepad2,
    Package
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getCategoryIcon = (categoryName) => {
    if (!categoryName) return <Tag size={18} />;
    
    const name = categoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (name.includes('auto') || name.includes('vehiculo')) return <CarFront size={18} />;
    if (name.includes('pelicula') || name.includes('cine')) return <Film size={18} />;
    if (name.includes('comic') || name.includes('manga')) return <BookOpen size={18} />;
    if (name.includes('figura') || name.includes('funko')) return <Bot size={18} />;
    if (name.includes('juego') || name.includes('gamer')) return <Gamepad2 size={18} />;
    if (name.includes('caja') || name.includes('sellado')) return <Package size={18} />;

    return <Tag size={18} />;
};

export default function CategorySidebar({ isOpen, onClose, categories }) {
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* CORRECCIÓN: Agregamos flex y flex-col al aside */}
            <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-brand-dark z-[70] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Header (Fijo arriba) */}
                <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 shrink-0">
                    <span className="font-black dark:text-white text-xl italic tracking-tighter">
                        VNTG <span className="text-brand-orange">MENU</span>
                    </span>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-brand-orange transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* CORRECCIÓN: flex-1 y overflow-y-auto para que el contenido scrollee si es muy largo */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Categorías Disponibles
                    </div>

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
                                        {getCategoryIcon(cat.name)}
                                    </span>
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

                {/* CORRECCIÓN: Quitamos el "absolute bottom-0", agregamos mt-auto y shrink-0 */}
                <div className="w-full p-6 border-t dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 mt-auto shrink-0">
                    <p className="text-[9px] text-gray-400 font-bold uppercase text-center tracking-widest">
                        VNTG-HUB © 2026 Maipú, Argentina
                    </p>
                </div>
            </aside>
        </>
    );
}