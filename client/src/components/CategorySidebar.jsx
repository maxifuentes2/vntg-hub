import { 
    X, Tag, ChevronRight, LayoutGrid, CarFront, Film, 
    BookOpen, Bot, Gamepad2, Package 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import SidebarWrapper from './SidebarWrapper';
import { slugify } from '../utils/slugify';

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

// Ponemos categories = [] por defecto para evitar el error de 'length'
export default function CategorySidebar({ categories = [] }) { 
    const { isCategoryOpen, closeAll } = useSidebar(); // <-- Usamos el contexto

    return (
        <SidebarWrapper 
            isOpen={isCategoryOpen} 
            onClose={closeAll} 
            title="Categorías" 
            side="left"
        >
            <div className="space-y-2">
                {/* Ahora categories siempre será al menos un array vacío, no undefined */}
                {categories.length > 0 ? (
                    categories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/categoria/${cat.slug || slugify(cat.name)}`}
                            onClick={closeAll}
                            className="flex items-center justify-between group px-4 py-4 bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 hover:border-brand-orange/50 transition-all rounded-xl shadow-sm mb-2"
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
                        onClick={closeAll}
                        className="flex items-center gap-3 px-4 py-4 bg-brand-blue/5 text-brand-blue font-black text-[11px] uppercase italic hover:bg-brand-blue hover:text-white transition-all rounded-xl"
                    >
                        <LayoutGrid size={16} /> Ver todo el catálogo
                    </Link>
                </div>
            </div>
        </SidebarWrapper>
    );
}