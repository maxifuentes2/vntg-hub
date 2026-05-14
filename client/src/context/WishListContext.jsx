import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext'; 

const WishListContext = createContext();

export function WishListProvider({ children }) {
    const { addToast } = useToast();
    
    const [wishListItems, setWishListItems] = useState(() => {
        try {
            const saved = localStorage.getItem('vntg_wishlist');
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
        const yaExiste = wishListItems.some(item => String(item.id) === String(product.id));
        
        if (yaExiste) {
            addToast(product, 'Ya está en tu lista de deseos', 'error');
            return;
        }

        addToast(product, '¡Añadido a favoritos!', 'success');
        setWishListItems((prevItems) => [...prevItems, product]);
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