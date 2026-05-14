import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTopOnNavigation = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Al usar 0, 0 sin 'smooth', el cambio es instantáneo, 
        // que es lo esperado al navegar a una página nueva.
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTopOnNavigation;