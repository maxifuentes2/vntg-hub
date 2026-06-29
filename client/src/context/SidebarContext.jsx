// IMPORTACIONES
import { createContext, useState, useContext, useCallback, useMemo } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [activeSidebar, setActiveSidebar] = useState(null);

    const openCart = useCallback(() => setActiveSidebar('cart'), []);
    const openWishList = useCallback(() => setActiveSidebar('wishlist'), []);
    const openCategory = useCallback(() => setActiveSidebar('category'), []);
    const closeAll = useCallback(() => setActiveSidebar(null), []);

    const value = useMemo(() => ({
        isCartOpen: activeSidebar === 'cart',
        isWishListOpen: activeSidebar === 'wishlist',
        isCategoryOpen: activeSidebar === 'category',
        openCart,
        openWishList,
        openCategory,
        closeAll
    }), [activeSidebar, openCart, openWishList, openCategory, closeAll]);

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => useContext(SidebarContext);