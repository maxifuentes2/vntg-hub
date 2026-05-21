import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext'; 

const WishListContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function WishListProvider({ children }) {
    const { addToast } = useToast();
    
    const [wishListItems, setWishListItems] = useState([]);

    // Obtener usuario activo
    const getActiveUser = () => JSON.parse(localStorage.getItem('vntg_user'));

    const getToken = () => localStorage.getItem('vntg_token');

    useEffect(() => {
        const user = getActiveUser();
        const token = getToken();
        if (user && token) {
            fetch(`${API_URL}/api/wishlist/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setWishListItems(Array.isArray(data) ? data : []))
                .catch(err => console.error("Error cargando wishlist:", err));
        }
    }, []);

    const addToWishList = async (product) => {
        const user = getActiveUser();
        if (!user) {
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ userId: user.id, productId: product.id })
            });

            if (response.ok) {
                setWishListItems((prevItems) => [...prevItems, product]);
                addToast(product, product.stock === 0 ? 'Te avisaremos al reponer stock' : '¡Añadido a favoritos!', 'success');
            }
        } catch (error) {
            console.error("Error al guardar en wishlist:", error);
        }
    };

    const removeFromWishList = async (id) => {
        const user = getActiveUser();
        const token = getToken();
        if (user && token) {
            try {
                await fetch(`${API_URL}/api/wishlist/${user.id}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            } catch (e) { console.error(e); }
        }
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