// IMPORTACIONES
import { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { calculateDiscountedPrice } from '../utils/priceUtils';

const CartContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const CartProvider = ({ children }) => {
    const { addToast } = useToast();
    const { user: authUser, token: authToken } = useAuth();
    const [cart, setCart] = useState(() => {
        if (authUser) return [];
        const savedCart = localStorage.getItem('vntg_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [shippingType, setShippingType] = useState('normal');
    const [serverCartReady, setServerCartReady] = useState(false);

    const [shippingConfig, setShippingConfig] = useState({
        envioNormal: 9426.05, envioPrioritario: 17276.99, envioGratisDesde: 200000,
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_URL}/api/shipping/config`);
                if (res.ok) setShippingConfig(await res.json());
            } catch {}
        };
        fetchConfig();
    }, []);

    const FREE_SHIPPING_THRESHOLD = shippingConfig.envioGratisDesde;
    const COSTO_NORMAL = shippingConfig.envioNormal;
    const COSTO_PRIO = shippingConfig.envioPrioritario;

    // Persistir a localStorage solo para invitados
    useEffect(() => {
        if (authUser) return;
        localStorage.setItem('vntg_cart', JSON.stringify(cart));
    }, [cart, authUser]);

    const getToken = () => localStorage.getItem('vntg_token');

    // Lee usuario desde localStorage (evita depender de authUser en efectos de sync)
    const getStoredUser = () => {
        try {
            const stored = localStorage.getItem('vntg_user');
            return stored && stored !== "undefined" ? JSON.parse(stored) : null;
        } catch { return null; }
    };

    // Sincronizar al servidor
    const syncCartToServer = useCallback(async (itemsToSync) => {
        const currentUser = getStoredUser();
        if (!currentUser || !itemsToSync) return;
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_URL}/api/cart/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    userId: currentUser.id,
                    items: itemsToSync.map(i => ({ product_id: i.id, quantity: i.cantidad }))
                })
            });
        } catch {}
    }, []);

    // Al iniciar sesión: limpiar carrito local y traer el del servidor
    useEffect(() => {
        if (!authUser) {
            setServerCartReady(false);
            return;
        }

        setServerCartReady(false);
        localStorage.removeItem('vntg_cart');

        const fetchServerCart = async () => {
            if (!authToken) return;
            try {
                const res = await fetch(`${API_URL}/api/cart/${authUser.id}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (!res.ok) return;
                const serverItems = await res.json();
                setCart(serverItems.map(si => ({
                    id: si.product_id,
                    title: si.title,
                    price: si.price,
                    stock: si.stock,
                    images: si.images,
                    cantidad: si.quantity,
                })));
            } catch {
                setCart([]);
            } finally {
                setServerCartReady(true);
            }
        };

        fetchServerCart();
    }, [authUser]);

    // Sincronizar carrito al servidor cuando cambie (solo si el carrito del servidor ya se cargó)
    useEffect(() => {
        if (!authUser || !serverCartReady) return;
        const timer = setTimeout(() => syncCartToServer(cart), 300);
        return () => clearTimeout(timer);
    }, [cart, syncCartToServer, authUser, serverCartReady]);

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
    const cartTotal = cart.reduce((total, item) => total + (calculateDiscountedPrice(item.price, item.discount_percentage) * item.cantidad), 0);

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
                        discount_percentage: product.discount_percentage || 0
                    };
                })
            );
            let changed = false;
            setCart(prev =>
                prev.map(item => {
                    const updated = updates.find(u => u && u.id === item.id);
                    if (updated && (updated.price !== item.price || updated.stock !== item.stock || updated.discount_percentage !== item.discount_percentage)) {
                        changed = true;
                        return { ...item, price: updated.price, stock: updated.stock, discount_percentage: updated.discount_percentage };
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

    const value = useMemo(() => ({
        cart, addToCart, removeFromCart, updateQuantity, clearCart,
        cartTotal, shippingType, setShippingType, finalTotal, getShippingCost,
        FREE_SHIPPING_THRESHOLD, COSTO_NORMAL, COSTO_PRIO, cartCount: cart.length, refreshCartPrices,
        syncCartToServer
    }), [cart, shippingType, shippingConfig, addToast]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);