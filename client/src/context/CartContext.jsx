import { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from './ToastContext'; // <-- LINK A NOTIFICACIONES

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { addToast } = useToast(); // <-- IMPORTAMOS LA FUNCIÓN
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('vntg_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [shippingType, setShippingType] = useState('normal');

    // CONFIGURACIÓN DE ENVÍOS (INTACTA)
    const FREE_SHIPPING_THRESHOLD = 200000;
    const COSTO_NORMAL = 9426.05;
    const COSTO_PRIO = 17276.99;

    useEffect(() => {
        localStorage.setItem('vntg_cart', JSON.stringify(cart));
    }, [cart]);

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
        } catch {
            // Error silencioso si falla la conexión
        }
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
            FREE_SHIPPING_THRESHOLD, cartCount: cart.length, refreshCartPrices
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);