import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const [wishlistItems, setWishlistItems] = useState(() => {
        try {
            const saved = localStorage.getItem('vntg_wishlist');
            // Verificamos que lo que haya en localStorage sea realmente un array
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Error leyendo localStorage de Wishlist:", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('vntg_wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToWishlist = (product) => {
        console.log("Intentando agregar a wishlist:", product.title); // Para debugear en tu consola
        
        setWishlistItems((prevItems) => {
            // Comparamos convirtiendo a String por las dudas (ej: 220 vs "220")
            const yaExiste = prevItems.some(item => String(item.id) === String(product.id));
            
            if (yaExiste) {
                console.log("El producto ya estaba en la lista.");
                return prevItems; 
            }
            
            console.log("Producto agregado exitosamente.");
            return [...prevItems, product];
        });
    };

    const removeFromWishlist = (id) => {
        setWishlistItems((prevItems) => prevItems.filter(item => String(item.id) !== String(id)));
    };

    const wishlistCount = wishlistItems.length;

    return (
        <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, wishlistCount }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    return useContext(WishlistContext);
}