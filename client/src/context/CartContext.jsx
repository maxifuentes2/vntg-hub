import { createContext, useState, useContext, useEffect } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('vntg_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [toasts, setToasts] = useState([]);

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

    // VERSIÓN CORREGIDA: Carrito 100% local sin llamar a /api/reserve
    const addToCart = (product) => {
        try {
            const existingInCart = cart.find(item => item.id === product.id);
            const currentQty = existingInCart ? existingInCart.cantidad : 0;

            // Verificamos si supera el stock disponible
            if (currentQty >= product.stock) {
                addToast(product, `Máximo ${product.stock} unidades`, 'error');
                return;
            }

            // Actualizamos el carrito localmente
            setCart((prevCart) => {
                const existingItem = prevCart.find(item => item.id === product.id);
                if (existingItem) {
                    return prevCart.map(item =>
                        item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
                    );
                }
                return [...prevCart, { ...product, cantidad: 1 }];
            });

            addToast(product, '¡Añadido con éxito!', 'success');

        } catch (error) {
            console.error("Error al añadir al carrito:", error);
            addToast(product, "Error al procesar", 'error');
        }
    };

    const updateQuantity = (productId, amount) => {
        setCart(prevCart => prevCart.map(item => {
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

    const removeFromCart = (productId) => setCart(prevCart => prevCart.filter(item => item.id !== productId));
    const clearCart = () => setCart([]);
    
    const cartCount = cart.reduce((total, item) => total + item.cantidad, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.cantidad), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
            {children}
            
            {/* CONTENEDOR DE NOTIFICACIONES */}
            <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-4 items-end pointer-events-none">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id}
                        className={`pointer-events-auto bg-zinc-950 text-white border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center w-[340px] h-[85px] overflow-hidden transition-all duration-500 ${
                            toast.isExiting ? 'toast-exit' : 'toast-enter'
                        }`}
                    >
                        {/* Imagen - Tamaño fijo */}
                        {toast.product && (
                            <div className="w-[85px] h-[85px] shrink-0 bg-zinc-800 border-r border-white/5">
                                <img 
                                    src={toast.product.images} 
                                    alt={toast.product.title} 
                                    className="w-full h-full object-cover opacity-80" 
                                />
                            </div>
                        )}

                        {/* Contenido - Truncado y colores actualizados */}
                        <div className="flex-1 px-4 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {toast.type === 'error' ? (
                                    <AlertCircle size={12} className="text-red-500 shrink-0" />
                                ) : (
                                    <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                                )}
                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] truncate ${
                                    toast.type === 'error' ? 'text-red-500' : 'text-emerald-500'
                                }`}>
                                    {toast.type === 'error' ? 'System Error' : 'Success Acquisition'}
                                </span>
                            </div>
                            
                            <p className="text-[11px] font-black uppercase italic leading-tight truncate mb-0.5">
                                {toast.product?.title || 'Notificación'}
                            </p>
                            
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                                {toast.message}
                            </p>
                        </div>

                        {/* Botón cerrar */}
                        <button 
                            onClick={() => removeToast(toast.id)}
                            className="h-full px-4 text-zinc-600 hover:text-white transition-colors border-l border-white/5"
                        >
                            <X size={16} />
                        </button>

                        {/* Barra de progreso con color dinámico */}
                        <div className={`absolute bottom-0 left-0 h-[2px] animate-progress ${
                            toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                        }`} />
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideInRight {
                    from { transform: translateX(100%) skewX(-5deg); opacity: 0; }
                    to { transform: translateX(0) skewX(0deg); opacity: 1; }
                }
                @keyframes fadeOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(120%); opacity: 0; }
                }
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .toast-enter {
                    animation: slideInRight 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
                .toast-exit {
                    animation: fadeOutRight 0.4s ease-in forwards;
                }
                .animate-progress {
                    animation: progress 3.5s linear forwards;
                }
            `}} />
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);