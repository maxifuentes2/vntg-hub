import { X, HeartCrack, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext'; // <-- Importamos el contexto real
import { useCart } from '../context/CartContext'; // <-- Para poder pasarlos al carrito después

export default function WishlistSidebar({ isOpen, onClose }) {
    // 1. Usamos los datos reales y funciones del Contexto Global
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

const handleMoveToCart = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 1. Primero borramos el producto de la wishlist
    removeFromWishlist(item.id);
    
    // 2. Le damos a React 50 milisegundos para que actualice la UI
    // y luego lo metemos al carrito. Esto evita que los estados choquen.
    setTimeout(() => {
        addToCart(item);
    }, 50);
};

    return (
        <>
            {/* Fondo oscuro (Overlay) */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Panel Lateral */}
            <div 
                className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white dark:bg-[#111111] shadow-2xl z-[201] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-zinc-200 dark:border-white/5 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Cabecera */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/5">
                    <h2 className="text-xl font-black uppercase italic">Mi Lista de Deseos</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors dark:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* 2. Verificamos si la lista real está vacía */}
                    {wishlistItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <HeartCrack size={48} className="text-zinc-300 dark:text-zinc-600 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Tu lista está vacía</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                                Aún no has guardado ningún tesoro.
                            </p>
                            <button 
                                onClick={onClose}
                                className="bg-brand-orange text-white px-6 py-2 rounded-xl font-bold uppercase italic hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                            >
                                Seguir Explorando
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* 3. Mapeamos los productos guardados reales */}
                            {wishlistItems.map((item) => (
                                <div key={item.id} className="flex gap-4 bg-zinc-50 dark:bg-[#1a1a1a] p-3 rounded-2xl border border-zinc-200 dark:border-white/5 relative">
                                    
                                    {/* Imagen miniatura */}
                                    <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 relative">
                                        <img src={item.images || item.image} alt={item.title} className="w-full h-full object-cover" />
                                        {item.stock === 0 && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <span className="text-[9px] font-black text-white uppercase tracking-wider transform -rotate-12">Agotado</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info del producto */}
                                    <div className="flex flex-col flex-1 py-1">
                                        <p className="text-[10px] font-black uppercase italic text-brand-orange mb-1">
                                            {item.franchise || item.brand || 'VNTG'}
                                        </p>
                                        <Link 
                                            to={`/producto/${item.id}`} 
                                            onClick={onClose}
                                            className="text-sm font-bold leading-tight mb-auto hover:text-brand-orange line-clamp-2"
                                        >
                                            {item.title}
                                        </Link>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="font-black">${Number(item.price).toLocaleString('es-AR')}</p>
                                        </div>
                                    </div>

                                    {/* Acciones (Borrar y Carrito) */}
                                    <div className="flex flex-col items-end justify-between ml-2">
                                        <button 
                                            onClick={() => removeFromWishlist(item.id)}
                                            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        
                                        <button 
                                            onClick={(e) => handleMoveToCart(e, item)}
                                            disabled={item.stock === 0}
                                            className={`p-2 rounded-lg transition-colors ${
                                                item.stock === 0 
                                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                                : 'bg-zinc-900 dark:bg-white text-white dark:text-[#111111] hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white shadow-md'
                                            }`}
                                        >
                                            <ShoppingCart size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}