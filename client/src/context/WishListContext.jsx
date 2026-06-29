// IMPORTACIONES
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from './ToastContext'; 
import { useAuth } from './AuthContext';

const WishListContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function WishListProvider({ children }) {
    const { addToast } = useToast();
    const { user, token } = useAuth();
    
    const [wishListItems, setWishListItems] = useState([]);

    useEffect(() => {
        if (user && token) {
            fetch(`${API_URL}/api/wishlist/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setWishListItems(Array.isArray(data) ? data : []))
                .catch(err => console.error("Error cargando wishlist:", err));
        } else {
            setWishListItems([]);
        }
    }, [user, token]);

    const addToWishList = useCallback(async (product) => {
        if (!user || !token) {
            addToast(null, 'Debes iniciar sesión para guardar favoritos', 'error');
            return;
        }

        const yaExiste = wishListItems.some(item => String(item.id) === String(product.id));
        
        if (yaExiste) {
            addToast(product, 'Ya está en tu lista de deseos', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id, productId: product.id })
            });

            if (response.ok) {
                setWishListItems((prevItems) => [...prevItems, product]);
                addToast(product, product.stock === 0 ? 'Te avisaremos al reponer stock' : '¡Añadido a favoritos!', 'success');
            } else if (response.status === 401) {
                addToast(null, 'Tu sesión expiró. Por favor, vuelve a iniciar sesión.', 'error');
            } else {
                addToast(null, 'Hubo un error al guardar el producto', 'error');
            }
        } catch (error) {
            console.error("Error al guardar en wishlist:", error);
            addToast(null, 'Error de conexión con el servidor', 'error');
        }
    }, [wishListItems, addToast, user, token]);

    const removeFromWishList = useCallback(async (id) => {
        const productoEliminado = wishListItems.find(item => String(item.id) === String(id));

        if (user && token) {
            try {
                await fetch(`${API_URL}/api/wishlist/${user.id}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            } catch (e) { console.error(e); }
        }
        
        setWishListItems((prevItems) => prevItems.filter(item => String(item.id) !== String(id)));
        
        if (productoEliminado) {
            addToast(productoEliminado, 'Eliminado de favoritos', 'info');
        }
    }, [wishListItems, addToast, user, token]);

    const clearWishList = useCallback(async () => {
        if (user && token) {
            try {
                await fetch(`${API_URL}/api/wishlist/${user.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            } catch (e) { console.error(e); }
        }
        setWishListItems([]);
    }, [user, token]);

    const clearWishListState = useCallback(() => {
        setWishListItems([]);
    }, []);

    const wishListCount = wishListItems.length;

    const value = useMemo(() => ({
        wishListItems, addToWishList, removeFromWishList, clearWishList, clearWishListState, wishListCount
    }), [wishListItems, addToWishList, removeFromWishList, clearWishList, clearWishListState]);

    return (
        <WishListContext.Provider value={value}>
            {children}
        </WishListContext.Provider>
    );
}

export function useWishList() {
    return useContext(WishListContext);
}