import { Link } from 'react-router-dom';
import * as Lucide from 'lucide-react';

export default function Footer() {
    // Mantenemos Mail y MapPin de Lucide ya que suelen cargar bien para información
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
                            className="bg-zinc-200 dark:bg-white/5 p-3 hover:bg-brand-orange hover:text-white transition-all text-zinc-600 dark:text-zinc-300 rounded-lg flex items-center justify-center"
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
                            className="bg-zinc-200 dark:bg-white/5 p-3 hover:bg-brand-blue hover:text-white transition-all text-zinc-600 dark:text-zinc-300 rounded-lg flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
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