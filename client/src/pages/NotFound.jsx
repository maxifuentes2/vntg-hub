import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans transition-colors duration-300">
            <div className="absolute inset-0 w-full h-full">
                <img
                    src="/wallpaper.webp"
                    className="w-full h-full object-cover opacity-20 scale-110 dark:opacity-10"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
                    }}
                    alt=""
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/80 dark:from-brand-dark/80 via-transparent to-transparent"></div>
            <div className="relative z-10 text-center px-4">
                <h1 className="text-6xl max-[400px]:text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-zinc-900 dark:text-white border-b-[6px] border-brand-orange mb-6 inline-block glitch-404">
                    ERROR 404
                </h1>
                <h2 className="text-lg max-[400px]:text-base md:text-2xl font-black italic uppercase mb-8 text-zinc-800 dark:text-zinc-200 flicker-sub">
                    Página no encontrada.
                </h2>
                <Link to="/" className="inline-flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-6 xs:px-10 py-3 xs:py-5 font-black uppercase italic hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white transition-all shadow-xl rounded-2xl active:scale-95">
                    <Home size={20} /> Volver al Inicio
                </Link>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes glitch-404 {
                    0%, 85%, 100% { transform: translate(0) skewX(0); opacity: 1; text-shadow: none; }
                    86% { transform: translate(-3px, 1px) skewX(2deg); opacity: 0.85; text-shadow: 2px 0 #ff5a00, -2px 0 #0056b3; }
                    87% { transform: translate(3px, -1px) skewX(-2deg); opacity: 0.9; text-shadow: -2px 0 #ff5a00, 2px 0 #0056b3; }
                    88% { transform: translate(-1px, 1px) skewX(1deg); opacity: 0.95; text-shadow: 1px 0 #ff5a00; }
                    89% { transform: translate(0); opacity: 1; text-shadow: none; }
                    92% { transform: scale(1.01); opacity: 0.7; }
                    93% { transform: scale(1); opacity: 1; }
                }
                .glitch-404 {
                    animation: glitch-404 6s ease-in-out infinite;
                }
                @keyframes flicker-sub {
                    0%, 100% { opacity: 1; }
                    92% { opacity: 0.3; }
                    94% { opacity: 1; }
                    96% { opacity: 0.2; }
                    98% { opacity: 1; }
                }
                .flicker-sub {
                    animation: flicker-sub 8s ease-in-out infinite;
                }
            ` }} />
        </div>
    );
}