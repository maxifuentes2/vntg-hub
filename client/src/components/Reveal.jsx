// IMPORTACIONES
import { useScrollReveal } from '../hooks/useScrollReveal';

/**
 * Componente wrapper que aplica una animación de scroll reveal a sus hijos.
 *
 * Props:
 *   - variant: 'fade-up' | 'fade-left' | 'fade-right' | 'fade-in' | 'zoom-in'
 *   - delay:   número en ms (ej: 100, 200, 300). Default 0.
 *   - className: clases extra para el wrapper.
 *   - threshold / rootMargin: pasados al hook.
 */
export default function Reveal({
    children,
    variant = 'fade-up',
    delay = 0,
    className = '',
    threshold = 0.12,
    rootMargin = "0px 0px -60px 0px",
}) {
    const [ref, isVisible] = useScrollReveal(threshold, rootMargin);

    // Mapa de variantes → estado inicial (oculto) y estado final (visible)
    const variants = {
        'fade-up':    { hidden: 'translateY(40px)',  visible: 'translateY(0)' },
        'fade-down':  { hidden: 'translateY(-40px)', visible: 'translateY(0)' },
        'fade-left':  { hidden: 'translateX(60px)',  visible: 'translateX(0)' },
        'fade-right': { hidden: 'translateX(-60px)', visible: 'translateX(0)' },
        'fade-in':    { hidden: 'scale(1)',           visible: 'scale(1)' },
        'zoom-in':    { hidden: 'scale(0.88)',        visible: 'scale(1)' },
    };

    const v = variants[variant] || variants['fade-up'];

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? v.visible : v.hidden,
                transition: `opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}
