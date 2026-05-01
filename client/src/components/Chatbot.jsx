import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            
            {/* VENTANA DEL CHATBOT - Ahora es absoluta para no ocupar espacio cuando se oculta */}
            <div 
                className={`absolute bottom-20 right-0 mb-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 origin-bottom-right ${
                    isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
                }`}
            >
                {/* Header */}
                <div className="bg-brand-blue p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Bot size={24} className="text-brand-orange" />
                        <div>
                            <h3 className="font-black italic uppercase tracking-tighter leading-none text-lg">VNTG Bot</h3>
                            <span className="text-[10px] text-blue-200 font-bold tracking-widest uppercase flex items-center gap-1 mt-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> En línea
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="text-blue-200 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Mensajes falsos) */}
                <div className="h-72 p-4 bg-gray-50/50 dark:bg-zinc-950/50 overflow-y-auto flex flex-col gap-3">
                    <div className="bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 p-3 rounded-2xl rounded-tl-sm w-11/12 text-sm font-medium">
                        ¡Hola! 👋 Bienvenido a VNTG Hub. ¿Estás buscando alguna franquicia en especial o necesitas ayuda con una figura?
                    </div>
                </div>

                {/* Footer (Input falso) */}
                <div className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Escribe tu mensaje..." 
                        disabled
                        className="flex-1 bg-gray-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:outline-none dark:text-white cursor-not-allowed opacity-70"
                    />
                    <button 
                        disabled
                        className="bg-brand-orange text-white p-2.5 rounded-xl opacity-70 cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* BOTÓN FLOTANTE BURBUJA */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-brand-blue hover:bg-brand-orange text-white p-4 rounded-full shadow-xl shadow-blue-500/30 hover:shadow-orange-500/30 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center relative"
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
}