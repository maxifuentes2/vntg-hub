import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('vntg_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('vntg_cart', JSON.stringify(cart));
    }, [cart]);

    // 1. AÑADIR AL CARRITO (Validando Stock)
    const addToCart = async (product, userId = 1) => {
        try {
            // Buscamos si ya está en el carrito local para comparar cantidades
            const existingInCart = cart.find(item => item.id === product.id);
            const currentQty = existingInCart ? existingInCart.cantidad : 0;

            // Validamos contra el stock total del producto antes de llamar al backend
            if (currentQty >= product.stock) {
                alert(`Lo sentimos, solo hay ${product.stock} unidades disponibles de este tesoro.`);
                return;
            }

            const res = await fetch('http://localhost:5000/api/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, userId })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
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

        } catch (error) {
            console.error("Error al añadir al carrito:", error);
        }
    };

    // 2. ACTUALIZAR CANTIDAD (Clampeado entre 1 y el Stock Real)
    const updateQuantity = (productId, amount) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.id === productId) {
                const newQty = item.cantidad + amount;
                
                // Si intenta subir más del stock, lo frenamos
                if (newQty > item.stock) {
                    alert("Has alcanzado el límite de stock disponible para este artículo.");
                    return item; 
                }

                // Aseguramos que sea al menos 1 y máximo el stock
                return { ...item, cantidad: Math.max(1, Math.min(newQty, item.stock)) };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const clearCart = () => setCart([]);
    const cartCount = cart.reduce((total, item) => total + item.cantidad, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.cantidad), 0);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart,
            cartCount,
            cartTotal 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);