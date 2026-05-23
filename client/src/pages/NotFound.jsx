import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden font-sans transition-colors duration-300">
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
                <h1 className="text-6xl max-[400px]:text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-zinc-900 dark:text-white border-b-[6px] border-brand-orange mb-6 inline-block">
                    ERROR 404
                </h1>
                <h2 className="text-lg max-[400px]:text-base md:text-2xl font-black italic uppercase mb-8 text-zinc-800 dark:text-zinc-200">
                    Página no encontrada.
                </h2>
                <Link to="/" className="inline-flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-6 xs:px-10 py-3 xs:py-5 font-black uppercase italic hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white transition-all shadow-xl rounded-2xl active:scale-95">
                    <Home size={20} /> Volver al Inicio
                </Link>
            </div>
        </div>
    );
}