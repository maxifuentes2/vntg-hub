// IMPORTACIONES
import { useEffect, useRef, useState } from 'react';

/**
 * useScrollReveal
 * Devuelve [ref, isVisible].
 * Cuando el elemento entra en el viewport, isVisible pasa a true (y se queda así).
 *
 * @param {number} threshold - Porcentaje del elemento que debe ser visible (0-1). Default 0.12.
 * @param {string} rootMargin - Margen del viewport. Default "0px 0px -60px 0px".
 */
export function useScrollReveal(threshold = 0.12, rootMargin = "0px 0px -60px 0px") {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el); // Una vez revelado, dejamos de observar
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return [ref, isVisible];
}
