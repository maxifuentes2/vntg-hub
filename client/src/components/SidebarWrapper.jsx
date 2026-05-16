import React from 'react';
import { X } from 'lucide-react';

export default function SidebarWrapper({ isOpen, onClose, title, icon: Icon, children, side = 'right' }) {
    // Definimos hacia dónde se esconde según el lado
    const translateClass = side === 'right' 
        ? (isOpen ? 'translate-x-0' : 'translate-x-full') 
        : (isOpen ? 'translate-x-0' : '-translate-x-full');

    const sideClass = side === 'right' ? 'right-0 border-l' : 'left-0 border-r';

    return (
        <div className={`fixed inset-0 z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop con tu blur y opacidad */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            {/* Panel Lateral con Liquid Glass */}
            <aside className={`absolute top-0 ${sideClass} h-full w-full max-w-[350px] sm:max-w-md bg-white/70 dark:bg-brand-dark/40 backdrop-blur-2xl shadow-2xl transform transition-transform duration-500 ease-out border-white/20 dark:border-white/10 ${translateClass}`}>
                <div className="h-full flex flex-col">
                    {/* Cabecera Unificada */}
                    <div className="p-4 sm:p-8 flex justify-between items-center border-b border-white/20 dark:border-white/5">
                        <div className="flex flex-col">
                            {side === 'left' && <span className="text-brand-orange font-black uppercase tracking-[0.3em] text-[10px] italic mb-1">Menu Principal</span>}
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
                                {Icon && <Icon className="text-brand-orange" />} 
                                {title}
                            </h2>
                        </div>
                        <button onClick={onClose} className="hover:text-brand-orange transition-colors">
                            <X size={28} />
                        </button>
                    </div>

                    {/* Contenido con scroll */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {children}
                    </div>
                </div>
            </aside>
        </div>
    );
}