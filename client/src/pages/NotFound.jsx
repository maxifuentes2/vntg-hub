import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="bg-brand-dark min-h-screen flex items-center justify-center p-4 font-sans">
            <div className="text-center">
                <span className="text-brand-orange font-black uppercase tracking-[0.5em] text-xs">Error 404</span>
                <h1 className="text-[12rem] font-black italic uppercase tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-brand-blue to-brand-dark border-b-8 border-brand-orange mb-8">
                    OUT
                </h1>
                <h2 className="text-3xl font-black italic uppercase mb-10">Pista fuera de límites</h2>
                <Link to="/" className="inline-flex items-center gap-3 bg-white text-brand-dark px-10 py-4 font-black uppercase italic hover:bg-brand-orange hover:text-white transition-all">
                    <Home size={20} /> Volver al Inicio
                </Link>
            </div>
        </div>
    );
}