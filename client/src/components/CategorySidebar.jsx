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
            {/* Overlay: Se pone por encima de todo (z-200) y cierra al clickear */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-[200] ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Sidebar: z-210 para estar sobre el overlay */}
            <aside className={`fixed top-0 left-0 h-full w-[300px] sm:w-[350px] bg-white dark:bg-brand-dark shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-[210] ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    <div className="p-6 flex items-center justify-between border-b dark:border-white/5">
                        <span className="text-brand-orange font-black uppercase tracking-[0.3em] text-[10px] italic">Menu Principal</span>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors dark:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        <div className="px-4 py-4">
                            <h3 className="text-zinc-400 font-black uppercase text-[10px] tracking-widest mb-6">Categorías</h3>
                        </div>

                        {categories.length > 0 ? (
                            categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/categoria/${cat.id}`}
                                    onClick={onClose}
                                    className="flex items-center justify-between group px-4 py-4 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-brand-orange/20"
                                >
                                    <div className="flex items-center gap-4 dark:text-white">
                                        <div className="text-brand-blue group-hover:text-brand-orange transition-colors">
                                            {getCategoryIcon(cat.name)}
                                        </div>
                                        <span className="text-sm font-black uppercase italic tracking-tight">{cat.name}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-zinc-300 group-hover:text-brand-orange group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-xs text-zinc-500 italic uppercase font-bold">Sin categorías disponibles</p>
                            </div>
                        )}

                        <div className="pt-6 mt-6 border-t dark:border-white/5">
                            <Link
                                to="/categoria/all"
                                onClick={onClose}
                                className="flex items-center gap-3 px-4 py-4 bg-brand-blue/5 text-brand-blue font-black text-[11px] uppercase italic hover:bg-brand-blue hover:text-white transition-all"
                            >
                                <LayoutGrid size={16} /> Ver todo el catálogo
                            </Link>
                        </div>
                    </nav>

                    <div className="p-6 border-t dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50">
                        <p className="text-[9px] text-zinc-400 font-black uppercase text-center tracking-[0.2em]">
                            VNTG-HUB © 2026 MENDOZA, ARG
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}