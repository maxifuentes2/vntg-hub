import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const CartProvider = ({ children }) => {
    const { addToast } = useToast();
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('vntg_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [shippingType, setShippingType] = useState('normal');
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('vntg_user');
            return stored && stored !== "undefined" ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const FREE_SHIPPING_THRESHOLD = 200000;
    const COSTO_NORMAL = 9426.05;
    const COSTO_PRIO = 17276.99;

    // Persistir a localStorage en cada cambio
    useEffect(() => {
        localStorage.setItem('vntg_cart', JSON.stringify(cart));
    }, [cart]);

    // Detectar cambios de usuario desde otras pestañas
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'vntg_user') {
                try {
                    setUser(e.newValue && e.newValue !== "undefined" ? JSON.parse(e.newValue) : null);
                } catch {
                    setUser(null);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Sincronizar al servidor
    const syncCartToServer = useCallback(async (itemsToSync) => {
        const currentUser = (() => {
            try {
                const stored = localStorage.getItem('vntg_user');
                return stored && stored !== "undefined" ? JSON.parse(stored) : null;
            } catch { return null; }
        })();
        if (!currentUser || !itemsToSync) return;
        try {
            await fetch(`${API_URL}/api/cart/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    items: itemsToSync.map(i => ({ product_id: i.id, quantity: i.cantidad }))
                })
            });
        } catch {}
    }, []);

    // Traer carrito del servidor al montar si hay usuario logueado
    useEffect(() => {
        const storedUser = (() => {
            try {
                const stored = localStorage.getItem('vntg_user');
                return stored && stored !== "undefined" ? JSON.parse(stored) : null;
            } catch { return null; }
        })();
        if (!storedUser) return;

        const fetchServerCart = async () => {
            try {
                const res = await fetch(`${API_URL}/api/cart/${storedUser.id}`);
                if (!res.ok) return;
                const serverItems = await res.json();
                if (!serverItems.length) return;

                setCart(prev => {
                    const merged = prev.map(i => ({ ...i }));
                    for (const si of serverItems) {
                        const idx = merged.findIndex(i => i.id === si.product_id);
                        if (idx >= 0) {
                            merged[idx] = {
                                ...merged[idx],
                                cantidad: Math.max(merged[idx].cantidad, si.quantity),
                            };
                        } else {
                            merged.push({
                                id: si.product_id,
                                title: si.title,
                                price: si.price,
                                stock: si.stock,
                                images: si.images,
                                cantidad: si.quantity,
                            });
                        }
                    }
                    if (prev.length !== merged.length || prev.some((i, idx) => {
                        const m = merged[idx];
                        return i.id !== m.id || i.cantidad !== m.cantidad;
                    })) {
                        return merged;
                    }
                    return prev;
                });
            } catch {}
        };

        fetchServerCart();
    }, []);

    // Sincronizar carrito al servidor cuando cambie (solo si hay usuario)
    useEffect(() => {
        const currentUser = (() => {
            try {
                const stored = localStorage.getItem('vntg_user');
                return stored && stored !== "undefined" ? JSON.parse(stored) : null;
            } catch { return null; }
        })();
        if (!currentUser) return;
        const timer = setTimeout(() => syncCartToServer(cart), 300);
        return () => clearTimeout(timer);
    }, [cart, syncCartToServer]);

    const addToCart = (product) => {
        if (product.stock <= 0) {
            addToast(product, "Producto sin stock", 'error');
            return;
        }
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

    const refreshCartPrices = async (apiUrl) => {
        if (cart.length === 0) return;
        try {
            const updates = await Promise.all(
                cart.map(async (item) => {
                    const res = await fetch(`${apiUrl}/api/products/${item.id}`);
                    if (!res.ok) return null;
                    const product = await res.json();
                    return {
                        id: item.id,
                        price: product.price,
                        stock: product.stock,
                        title: product.title,
                    };
                })
            );
            let changed = false;
            setCart(prev =>
                prev.map(item => {
                    const updated = updates.find(u => u && u.id === item.id);
                    if (updated && (updated.price !== item.price || updated.stock !== item.stock)) {
                        changed = true;
                        return { ...item, price: updated.price, stock: updated.stock };
                    }
                    return item;
                })
            );
            if (changed) {
                addToast({ title: 'Carrito actualizado' }, 'Algunos precios se actualizaron', 'info');
            }
        } catch {}
    };
    
    const getShippingCost = () => {
        if (cartTotal >= FREE_SHIPPING_THRESHOLD) return 0;
        if (shippingType === 'normal') return COSTO_NORMAL;
        if (shippingType === 'prioritario') return COSTO_PRIO;
        return 0; 
    };

    const finalTotal = cartTotal + getShippingCost();

    return (
        <CartContext.Provider value={{ 
            cart, addToCart, removeFromCart, updateQuantity, clearCart, 
            cartTotal, shippingType, setShippingType, finalTotal, getShippingCost,
            FREE_SHIPPING_THRESHOLD, cartCount: cart.length, refreshCartPrices,
            syncCartToServer
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);