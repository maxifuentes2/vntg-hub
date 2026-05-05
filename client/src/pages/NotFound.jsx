import { Link } from 'react-router-dom';
import { Home } from 'lucide-react'; 

export default function NotFound() {
    return (
        <div className="w-full transition-colors duration-300">
            <div 
                className="relative w-full min-h-screen bg-cover bg-center bg-fixed flex flex-col" 
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>

                <div className="relative z-10 flex-grow flex items-center justify-center p-4">
                    <div className="max-w-xl mx-auto text-center bg-white/10 dark:bg-zinc-900/30 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/20 dark:border-zinc-800/50 shadow-2xl">
                        
                        <span className="text-brand-orange font-black uppercase tracking-[0.3em] text-xs mb-4 block">
                            Error 404
                        </span>
                        
                        <h1 className="text-8xl md:text-9xl font-black text-brand-blue dark:text-white mb-2 tracking-tight drop-shadow-md italic uppercase">
                            4<span className="text-brand-orange">0</span>4
                        </h1>
                        
                        <h2 className="text-3xl font-black dark:text-white mt-1 mb-6 italic uppercase tracking-tighter">
                            ¡Tesoro no encontrado!
                        </h2>
                        
                        <p className="text-lg md:text-xl text-gray-700 dark:text-blue-100/90 mb-10 font-medium leading-relaxed italic">
                            Parece que la pieza de colección que estás buscando se perdió en otra dimensión o el enlace está roto.
                        </p>
                        
                        <Link 
                            to="/"
                            className="inline-flex items-center gap-3 bg-brand-blue text-white px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-brand-orange hover:shadow-orange-500/30 transition-all duration-300 active:scale-90 font-black uppercase tracking-widest text-sm"
                        >
                            <Home size={22} />
                            Volver al Inicio
                        </Link>

                    </div>
                </div>
            </div>
        </div>
    );
}