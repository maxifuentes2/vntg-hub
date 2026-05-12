import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Se muestra después de bajar 300px
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Forzamos el comportamiento suave
        });
    };

    return (
        /* 'left-8' para la esquina izquierda */
        <div className="fixed bottom-8 left-8 z-[100]">
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="bg-brand-orange text-white p-4 rounded-full shadow-2xl hover:bg-brand-blue transition-all duration-300 active:scale-90 animate-in fade-in zoom-in"
                >
                    <ArrowUp size={24} strokeWidth={3} />
                </button>
            )}
        </div>
    );
}