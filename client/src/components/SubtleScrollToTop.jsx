import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function SubtleScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 500) {
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
            behavior: 'smooth'
        });
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-4 xs:bottom-8 left-1/2 -translate-x-1/2 z-[80] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700  px-2 xs:px-4 py-2 sm:px-6 rounded-2xl flex items-center gap-2 transition-all duration-500 hover:scale-105 active:scale-95 group shadow-lg"
        >
            <ChevronUp size={16} className="text-zinc-500 group-hover:text-brand-orange transition-colors" />
            <span className="text-[10px] font-black uppercase italic tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Volver arriba</span>
        </button>
    );
}
