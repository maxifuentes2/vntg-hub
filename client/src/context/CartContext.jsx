import { createContext, useState, useContext, useEffect } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

const CartContext = createContext();
const WishlistContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('vntg_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [shippingType, setShippingType] = useState('normal');
    const [toasts, setToasts] = useState([]);

    // Configuración de envíos
    const FREE_SHIPPING_THRESHOLD = 200000;
    const COSTO_NORMAL = 9426.05;
    const COSTO_PRIO = 17276.99;

    useEffect(() => {
        localStorage.setItem('vntg_cart', JSON.stringify(cart));
    }, [cart]);

    const addToast = (product, message, type = 'success') => {
        const id = Date.now() + Math.random(); 
        setToasts((prev) => [...prev, { id, product, message, type, isExiting: false }]);
        setTimeout(() => setToasts((prev) => prev.map(t => t.id === id ? { ...t, isExiting: true } : t)), 3500);
        setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3900);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
        setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 400); 
    };

    const addToCart = (product) => {
        const existingInCart = cart.find(item => item.id === product.id);
        const currentQty = existingInCart ? existingInCart.cantidad : 0;
        if (currentQty >= product.stock) {
            addToast(product, `Máximo ${product.stock} unidades`, 'error');
            return;
        }
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) return prev.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            return [...prev, { ...product, cantidad: 1 }];
        });
        addToast(product, '¡Añadido con éxito!', 'success');
    };

    const updateQuantity = (productId, amount) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = item.cantidad + amount;
                if (newQty > item.stock) {
                    addToast(item, "Límite alcanzado", 'error');
                    return item;
                }
                return { ...item, cantidad: Math.max(1, Math.min(newQty, item.stock)) };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => setCart(prev => prev.filter(item => item.id !== productId));
    const clearCart = () => setCart([]);
    
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.cantidad), 0);
    
    // Lógica de costo de envío dinámico
    const getShippingCost = () => {
        if (cartTotal >= FREE_SHIPPING_THRESHOLD) return 0;
        if (shippingType === 'normal') return COSTO_NORMAL;
        if (shippingType === 'prioritario') return COSTO_PRIO;
        return 0; // Retiro gratis
    };

    const finalTotal = cartTotal + getShippingCost();

    return (
        <CartContext.Provider value={{ 
            cart, addToCart, removeFromCart, updateQuantity, clearCart, 
            cartTotal, shippingType, setShippingType, finalTotal, getShippingCost,
            FREE_SHIPPING_THRESHOLD 
        }}>
            {children}
            {/* Sistema de Toasts (No se pierde) */}
            <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-4 items-end pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`pointer-events-auto bg-zinc-950 text-white border border-white/10 shadow-2xl flex items-center w-[340px] h-[85px] transition-all duration-500 ${toast.isExiting ? 'toast-exit' : 'toast-enter'}`}>
                        {toast.product && <div className="w-[85px] h-[85px] shrink-0 bg-zinc-800 border-r border-white/5"><img src={toast.product.images} className="w-full h-full object-cover opacity-80" alt="" /></div>}
                        <div className="flex-1 px-4 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {toast.type === 'error' ? <AlertCircle size={12} className="text-red-500" /> : <CheckCircle size={12} className="text-emerald-500" />}
                                <span className="text-[8px] font-black uppercase tracking-widest">{toast.type === 'error' ? 'Error' : 'Éxito'}</span>
                            </div>
                            <p className="text-[11px] font-black uppercase italic truncate">{toast.product?.title}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="h-full px-4 text-zinc-600 hover:text-white transition-colors border-l border-white/5"><X size={16} /></button>
                        <div className={`absolute bottom-0 left-0 h-[2px] animate-progress ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    </div>
                ))}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.toast-enter { animation: slideInRight 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; } .toast-exit { animation: fadeOutRight 0.4s ease-in forwards; } .animate-progress { animation: progress 3.5s linear forwards; } @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes fadeOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } } @keyframes progress { from { width: 100%; } to { width: 0%; } }` }} />
        </CartContext.Provider>
    );
};

export function WishlistProvider({ children }) {
    // Inicializar desde localStorage si hay datos, si no, array vacío
    const [wishlistItems, setWishlistItems] = useState(() => {
        const saved = localStorage.getItem('vntg_wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    // Guardar en localStorage cada vez que cambie la lista
    useEffect(() => {
        localStorage.setItem('vntg_wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    // Función para agregar (evitando duplicados)
    const addToWishlist = (product) => {
        setWishlistItems((prevItems) => {
            if (prevItems.some(item => item.id === product.id)) {
                return prevItems; // Ya está en la lista, no hacemos nada
            }
            return [...prevItems, product];
        });
    };

    // Función para eliminar
    const removeFromWishlist = (id) => {
        setWishlistItems((prevItems) => prevItems.filter(item => item.id !== id));
    };

    // Calcular la cantidad de items
    const wishlistCount = wishlistItems.length;

    return (
        <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, wishlistCount }}>
            {children}
        </WishlistContext.Provider>
    );
}

// Hook personalizado para usarlo fácilmente
export function useWishlist() {
    return useContext(WishlistContext);
}

export const useCart = () => useContext(CartContext);