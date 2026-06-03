import { useState, useEffect } from 'react';
import { Heart, HeartCrack, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishList } from '../context/WishListContext'; 
import { useCart } from '../context/CartContext'; 
import { useCurrency } from '../context/CurrencyContext'; 
import { useSidebar } from '../context/SidebarContext';
import { slugify } from '../utils/slugify'; // <-- Importante
import SidebarWrapper from './SidebarWrapper';

export default function WishListSidebar() { // <-- Sin props
    const { isWishListOpen, closeAll } = useSidebar(); // <-- Obtenemos el estado global
    const { wishListItems, removeFromWishList, clearWishList } = useWishList();
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        if (!confirmClear) return;
        const timer = setTimeout(() => setConfirmClear(false), 3000);
        return () => clearTimeout(timer);
    }, [confirmClear]);

    const handleClearWishList = () => {
        if (confirmClear) {
            clearWishList();
            setConfirmClear(false);
        } else {
            setConfirmClear(true);
        }
    };

    const handleMoveToCart = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        removeFromWishList(item.id);
        setTimeout(() => { addToCart(item); }, 50);
    };

    return (
        <SidebarWrapper 
            isOpen={isWishListOpen} 
            onClose={closeAll} 
            title="Mi Lista de Deseos" 
            icon={Heart}
            side="right"
        >
            {wishListItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <HeartCrack size={48} className="text-zinc-300 dark:text-zinc-600 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Tu lista está vacía</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Aún no has guardado ningún tesoro.</p>
                    <button onClick={closeAll} className="bg-brand-orange text-white px-6 py-2 rounded-xl font-bold uppercase italic hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">Seguir Explorando</button>
                </div>
            ) : (
                <>
                    <div className="flex justify-end mb-2">
                        <button onClick={handleClearWishList} className={`text-[10px] font-black uppercase italic tracking-widest transition-colors flex items-center gap-1.5 ${confirmClear ? 'text-red-600' : 'text-red-400 hover:text-red-500'}`}>
                            <Trash2 size={12} /> {confirmClear ? 'Vuelve a presionar para vaciar la lista' : 'Vaciar lista'}
                        </button>
                    </div>
                    <div className="flex flex-col gap-4">
                        {wishListItems.map((item) => (
                            <div key={item.id} className="flex gap-3 xs:gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-2 xs:p-3 rounded-2xl  relative shadow-sm group">
                                <div className="w-16 xs:w-24 h-16 xs:h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-sm">
                                    <img src={item.images || item.image} alt={item.title} className="w-full h-full object-cover" />
                                    {item.stock === 0 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-[9px] font-black text-white uppercase tracking-wider transform -rotate-12">Agotado</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 py-1">
                                    <p className="text-[10px] font-black uppercase italic text-brand-orange mb-1">{item.franchise || item.brand || 'VNTG'}</p>
                                    <Link to={`/producto/${slugify(item.title)}`} onClick={closeAll} className="text-sm font-bold leading-tight mb-auto hover:text-brand-orange line-clamp-2">{item.title}</Link>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="font-black">{formatPrice(item.price)}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between ml-2">
                                    <button onClick={() => removeFromWishList(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                                    <button onClick={(e) => handleMoveToCart(e, item)} disabled={item.stock === 0} className={`p-2 rounded-lg transition-all ${item.stock === 0 ? 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-orange shadow-lg active:scale-95'}`}><ShoppingCart size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </SidebarWrapper>
    );
}