import { createContext, useContext, useState, useEffect } from 'react';

const WishListContext = createContext();

export function WishListProvider({ children }) {
    const [wishListItems, setWishListItems] = useState(() => {
        try {
            const saved = localStorage.getItem('vntg_wishlist');
            // Verificamos que lo que haya en localStorage sea realmente un array
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Error leyendo localStorage de WishList:", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('vntg_wishlist', JSON.stringify(wishListItems));
    }, [wishListItems]);

    const addToWishList = (product) => {
        console.log("Intentando agregar a wishlist:", product.title); // Para debugear en tu consola
        
        setWishListItems((prevItems) => {
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