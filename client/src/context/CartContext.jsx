import { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from './ToastContext'; // <-- LINK A NOTIFICACIONES

const CartContext = createContext();
const WishListContext = createContext();

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
            FREE_SHIPPING_THRESHOLD 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export function WishListProvider({ children }) {
    const { addToast } = useToast(); // <-- LINK A NOTIFICACIONES
    const [wishListItems, setWishListItems] = useState(() => {
        const saved = localStorage.getItem('vntg_wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('vntg_wishlist', JSON.stringify(wishListItems));
    }, [wishListItems]);

    const addToWishList = (product) => {
        setWishListItems((prevItems) => {
            if (prevItems.some(item => String(item.id) === String(product.id))) {
                addToast(product, 'Ya está en favoritos', 'error');
                return prevItems; 
            }
            addToast(product, '¡Añadido a favoritos!', 'success');
            return [...prevItems, product];
        });
    };

    const removeFromWishList = (id) => {
        setWishListItems((prevItems) => prevItems.filter(item => String(item.id) !== String(id)));
    };

    const wishListCount = wishListItems.length;

    return (
        <WishListContext.Provider value={{ wishListItems, addToWishList, removeFromWishList, wishListCount }}>
            {children}
        </WishListContext.Provider>
    );
}

export function useWishList() {
    return useContext(WishListContext);
}

export const useCart = () => useContext(CartContext);