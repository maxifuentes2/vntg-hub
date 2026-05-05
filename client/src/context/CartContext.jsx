import { createContext, useState, useContext, useEffect } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

const CartContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://kernelos-pc:5000";

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

    const addToCart = async (product, userId = 1) => {
        try {
            const existingInCart = cart.find(item => item.id === product.id);
            const currentQty = existingInCart ? existingInCart.cantidad : 0;

            if (currentQty >= product.stock) {
                addToast(product, `Solo hay ${product.stock} unidades disponibles.`, 'error');
                return;
            }

            const res = await fetch(`${API_URL}/api/reserve`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ productId: product.id, userId })
            });

            const data = await res.json();
            
            if (!res.ok) {
                addToast(product, data.error || "Error al reservar stock", 'error');
                return;
            }

            setCart((prevCart) => {
                const existingItem = prevCart.find(item => item.id === product.id);
                if (existingItem) {
                    return prevCart.map(item =>
                        item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
                    );
                }
                return [...prevCart, { ...product, cantidad: 1 }];
            });

            addToast(product, '¡Tesoro añadido al carrito!', 'success');

        } catch (error) {
            console.error("Error al añadir al carrito:", error);
            addToast(product, "Error de conexión", 'error');
        }
    };

    const updateQuantity = (productId, amount) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.id === productId) {
                const newQty = item.cantidad + amount;
                if (newQty > item.stock) {
                    addToast(item, "Límite de stock alcanzado.", 'error');
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
            <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id}
                        className={`pointer-events-auto bg-white dark:bg-zinc-900 border-2 rounded-2xl shadow-2xl p-4 flex items-center gap-4 min-w-[300px] max-w-sm ${
                            toast.isExiting ? 'toast-exit' : 'toast-enter'
                        } ${
                            toast.type === 'error' ? 'border-red-500' : 'border-green-500'
                        }`}
                    >
                        {toast.product && (
                            <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <img 
                                    src={toast.product.images} 
                                    alt={toast.product.title} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        )}

                        <div className="flex-1">
                            <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-1 ${
                                toast.type === 'error' ? 'text-red-500' : 'text-green-500'
                            }`}>
                                {toast.type === 'error' ? <AlertCircle size={12} /> : <CheckCircle size={12} />} 
                                {toast.message}
                            </p>
                            {toast.product && (
                                <p className="text-sm font-black text-gray-900 dark:text-white italic line-clamp-1">
                                    {toast.product.title}
                                </p>
                            )}
                        </div>

                        <button 
                            onClick={() => removeToast(toast.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(120%); opacity: 0; }
                }
                .toast-enter {
                    animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .toast-exit {
                    animation: fadeOutRight 0.4s ease-in forwards;
                }
            `}} />
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);