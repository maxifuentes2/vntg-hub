import { createContext, useState, useContext } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    // 'cart', 'wishlist', 'category' o null
    const [activeSidebar, setActiveSidebar] = useState(null); 

    const openCart = () => setActiveSidebar('cart');
    const openWishList = () => setActiveSidebar('wishlist');
    const openCategory = () => setActiveSidebar('category'); // <-- Agregado
    const closeAll = () => setActiveSidebar(null);

    return (
        <SidebarContext.Provider value={{ 
            isCartOpen: activeSidebar === 'cart',
            isWishListOpen: activeSidebar === 'wishlist',
            isCategoryOpen: activeSidebar === 'category', // <-- Agregado
            openCart,
            openWishList,
            openCategory, // <-- Agregado
            closeAll
        }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => useContext(SidebarContext);