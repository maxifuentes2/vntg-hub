import { Link } from 'react-router-dom';
import * as Lucide from 'lucide-react';

export default function Footer() {
    // Mantenemos Mail y MapPin de Lucide ya que suelen cargar bien para información
    const Mail = Lucide.Mail;
    const MapPin = Lucide.MapPin;

    return (
        <footer className="bg-white dark:bg-brand-dark pt-20 pb-28 border-t border-zinc-100 dark:border-zinc-800 transition-all duration-300 relative overflow-hidden">
            {/* Sutil gradiente superior para separar */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-orange to-transparent"></div>
            <div className="max-w-[1700px] mx-auto px-4 xs:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 xs:gap-12">
                
                {/* Logo y descripción */}
                <div className="col-span-1 md:col-span-2">
                    <img 
                        src="/logo-texto-transparente.webp" 
                        alt="VNTG HUB" 
                        className="h-12 mb-6 object-contain" 
                    />
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm italic font-medium leading-relaxed">
                        La plataforma definitiva para el coleccionista de élite. 
                        Autenticidad, exclusividad y velocidad en cada entrega.
                    </p>
                    
                    {/* REDES SOCIALES CON SVG DIRECTO */}
                    <div className="flex gap-4 mt-8">
                        {/* INSTAGRAM */}
                        <a 
                            href="https://www.instagram.com/gaspo0.0" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-zinc-100 dark:bg-zinc-800 p-3 hover:bg-brand-orange hover:text-white hover:scale-110 transition-all text-zinc-600 dark:text-zinc-300 rounded-xl flex items-center justify-center shadow-sm active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                            </svg>
                        </a>

                        {/* X (TWITTER) */}
                        <a 
                            href="https://x.com/LoboLocura33" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-zinc-100 dark:bg-zinc-800 p-3 hover:bg-brand-blue hover:text-white hover:scale-110 transition-all text-zinc-600 dark:text-zinc-300 rounded-xl flex items-center justify-center shadow-sm active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                            </svg>
                        </a>

                        {/* WHATSAPP */}
                        <a 
                            href="https://wa.me/5492611234567" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-zinc-100 dark:bg-zinc-800 p-3 hover:bg-green-500 hover:text-white hover:scale-110 transition-all text-zinc-600 dark:text-zinc-300 rounded-xl flex items-center justify-center shadow-sm active:scale-95"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.411 0 .01 5.403.007 12.04c0 2.123.543 4.197 1.57 6.068l-1.67 6.095 6.236-1.636a11.79 11.79 0 005.904 1.564h.005c6.637 0 12.039-5.404 12.042-12.041a11.8 11.8 0 00-3.535-8.529z"/>
                            </svg>
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
                            { name: 'Tutoriales', path: '/tutoriales' },
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
            <div className="max-w-[1700px] mx-auto px-4 xs:px-6 mt-12 xs:mt-20 pt-8 border-t border-zinc-300 dark:border-zinc-600 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] font-black uppercase italic text-zinc-400 tracking-widest">
                    VNTG-HUB © 2026 MENDOZA, ARGENTINA
                </p>
                <div className="flex gap-4 text-[10px] font-black uppercase italic text-zinc-400">
                    <span className="flex items-center gap-1">
                        {MapPin && <MapPin size={10} />} Mendoza
                    </span>
                    <span className="flex items-center gap-1">
                        {Mail && <Mail size={10} />} soportehubvntg@gmail.com
                    </span>
                </div>
            </div>
        </footer>
    );
}