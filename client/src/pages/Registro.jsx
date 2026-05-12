import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Registro() {
    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen flex items-center justify-center px-4 font-sans py-20 transition-colors">
            <div className="max-w-md w-full bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-12 text-center relative shadow-2xl">
                <div className="absolute top-0 left-0 w-24 h-24 bg-brand-blue transform -rotate-45 -translate-x-12 -translate-y-12"></div>
                <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Registro</h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-10 italic tracking-[0.3em]">Join the squadron</p>
                <form className="space-y-4 text-left" onSubmit={(e) => e.preventDefault()}>
                    <input type="text" placeholder="NOMBRE COMPLETO" className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold uppercase italic focus:border-brand-orange outline-none" required />
                    <input type="email" placeholder="EMAIL" className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold uppercase italic focus:border-brand-orange outline-none" required />
                    <input type="password" placeholder="PASSWORD" className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold uppercase italic focus:border-brand-orange outline-none" required />
                    <div className="flex items-start gap-3 pt-2">
                        <input type="checkbox" id="terms" className="mt-1 accent-brand-orange" required />
                        <label htmlFor="terms" className="text-[10px] text-zinc-500 font-bold uppercase italic leading-tight">
                            Acepto los <Link to="/terminos" className="text-brand-blue hover:underline">Términos</Link> y <Link to="/privacidad" className="text-brand-blue hover:underline">Privacidad</Link>.
                        </label>
                    </div>
                    <button type="submit" className="w-full bg-brand-orange text-white py-4 font-black uppercase italic tracking-widest hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark transition-all mt-4 flex items-center justify-center gap-2">
                        Crear Cuenta <ShieldCheck size={18} />
                    </button>
                </form>
                <p className="mt-10 text-[11px] font-bold uppercase italic text-zinc-500">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-brand-blue hover:text-zinc-900 dark:hover:text-white transition-colors">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}