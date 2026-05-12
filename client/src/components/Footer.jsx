import { Link } from 'react-router-dom';
// Importamos todo el objeto de iconos para evitar errores de exportación de Vite
import * as Lucide from 'lucide-react';

export default function Footer() {
    // Extraemos los iconos del objeto Lucide de forma segura
    const Instagram = Lucide.Instagram;
    const Twitter = Lucide.Twitter;
    const Mail = Lucide.Mail;
    const MapPin = Lucide.MapPin;

    return (
        <footer className="bg-zinc-100 dark:bg-brand-dark pt-20 pb-8 border-t-4 border-brand-orange transition-colors duration-300">
            <div className="max-w-[1700px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                
                {/* Logo y descripción */}
                <div className="col-span-1 md:col-span-2">
                    <img 
                        src="/logo-texto-transparente.webp" 
                        alt="VNTG HUB" 
                        /* Eliminamos dark:invert para que el logo naranja no se vea amarillo */
                        className="h-12 mb-6 object-contain" 
                    />
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm italic font-medium leading-relaxed">
                        La plataforma definitiva para el coleccionista de élite. 
                        Autenticidad, exclusividad y velocidad en cada entrega.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <a href="#" className="bg-zinc-200 dark:bg-white/5 p-3 hover:bg-brand-orange hover:text-white transition-all text-zinc-600 dark:text-zinc-300 rounded-lg">
                            {Instagram && <Instagram size={20} />}
                        </a>
                        <a href="#" className="bg-zinc-200 dark:bg-white/5 p-3 hover:bg-brand-blue hover:text-white transition-all text-zinc-600 dark:text-zinc-300 rounded-lg">
                            {Twitter && <Twitter size={20} />}
                        </a>
                    </div>
                </div>
                
                {/* Enlaces de soporte */}
                <div>
                    <h3 className="text-brand-orange font-black uppercase italic tracking-widest text-[10px] mb-8">Información</h3>
                    <ul className="space-y-4 flex flex-col">
                        {[
                            { name: 'Guía de Autenticidad', path: '/guia-autenticidad' },
                            { name: 'Envíos Seguros', path: '/envios' },
                            { name: 'Contacto', path: '/contacto' }
                        ].map((link) => (
                            <Link 
                                key={link.name} 
                                to={link.path} 
                                className="text-zinc-900 dark:text-zinc-100 font-black uppercase italic text-xs hover:text-brand-orange transition-colors w-fit"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </ul>
                </div>

                {/* Enlaces legales */}
                <div>
                    <h3 className="text-brand-blue font-black uppercase italic tracking-widest text-[10px] mb-8">Legal</h3>
                    <ul className="space-y-4 flex flex-col">
                        {[
                            { name: 'Términos de Servicio', path: '/terminos' },
                            { name: 'Privacidad', path: '/privacidad' }
                        ].map((link) => (
                            <Link 
                                key={link.name} 
                                to={link.path} 
                                className="text-zinc-900 dark:text-zinc-100 font-black uppercase italic text-xs hover:text-brand-blue transition-colors w-fit"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </ul>
                </div>
            </div>
            
            {/* Copyright y Ubicación */}
            <div className="max-w-[1700px] mx-auto mt-20 pt-8 border-t dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] font-black uppercase italic text-zinc-400 tracking-widest">
                    VNTG-HUB © 2026 MENDOZA, ARGENTINA
                </p>
                <div className="flex gap-4 text-[10px] font-black uppercase italic text-zinc-400">
                    <span className="flex items-center gap-1">
                        {MapPin && <MapPin size={10} />} Mendoza
                    </span>
                    <span className="flex items-center gap-1">
                        {Mail && <Mail size={10} />} soporte@vntghub.com
                    </span>
                </div>
            </div>
        </footer>
    );
}