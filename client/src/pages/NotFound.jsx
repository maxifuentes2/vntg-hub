import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-300">
            <div className="text-center">
                <h1 className="text-[5rem] max-[400px]:text-[4rem] md:text-[14rem] font-black italic uppercase tracking-tighter leading-none text-zinc-900 dark:text-white border-b-[8px] border-brand-orange mb-8 inline-block">
                    ERROR 404
                </h1>
                <h2 className="text-xl max-[400px]:text-lg md:text-4xl font-black italic uppercase mb-10 text-zinc-800 dark:text-zinc-200">
                    Página no encontrada.
                </h2>
                <Link to="/" className="inline-flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-6 xs:px-10 py-3 xs:py-5 font-black uppercase italic hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white transition-all shadow-xl">
                    <Home size={20} /> Volver al Inicio
                </Link>
            </div>
        </div>
    );
}