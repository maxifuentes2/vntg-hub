import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext'; 

const WishListContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function WishListProvider({ children }) {
    const { addToast } = useToast();
    const [wishListItems, setWishListItems] = useState([]);

    const user = JSON.parse(localStorage.getItem('vntg_user'));

    useEffect(() => {
        if (user) {
            fetch(`${API_URL}/api/wishlist/${user.id}`)
                .then(res => res.json())
                .then(data => setWishListItems(Array.isArray(data) ? data : []))
                .catch(err => console.error(err));
        } else {
            setWishListItems([]);
        }
    }, [user?.id]);

    const addToWishList = async (product) => {
        if (!user) {
            addToast(null, 'Inicia sesión para guardar favoritos', 'error');
            return;
        }
        if (wishListItems.some(item => String(item.id) === String(product.id))) {
            addToast(product, 'Ya está en tu lista de deseos', 'error');
            return;
        }

        try {
            await fetch(`${API_URL}/api/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, productId: product.id })
            });
            setWishListItems(prev => [...prev, product]);
            addToast(product, product.stock === 0 ? 'Te avisaremos al reponer stock' : '¡Añadido a favoritos!', 'success');
        } catch (e) { console.error(e); }
    };

    const removeFromWishList = async (id) => {
        if (!user) return;
        try {
            await fetch(`${API_URL}/api/wishlist/${user.id}/${id}`, { method: 'DELETE' });
            setWishListItems(prev => prev.filter(item => String(item.id) !== String(id)));
        } catch (e) { console.error(e); }
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