import React, { useState } from 'react';
// Corregido: El import debe ser de lucide-react
import { MessageCircle, X, Send, Bot, Zap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Chatbot({ isSidebarOpen }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Bienvenido al Hub, piloto. ¿Buscás una pieza histórica o asistencia técnica con un envío?", isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { text: data.reply || "Avería en boxes: " + data.error, isBot: true }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "Error de conexión con boxes. Intenta de nuevo.", isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        /* Se desplaza a la izquierda si cualquier sidebar (Carrito o Filtros) está abierto */
        <div className={`fixed bottom-6 transition-all duration-500 z-[200] ${isSidebarOpen ? 'right-[20px] md:right-[470px]' : 'right-6'
            }`}>

            {/* Ventana de Chat con Estética de Competición */}
            <div
                className={`absolute bottom-20 right-0 mb-2 w-80 sm:w-96 bg-white dark:bg-brand-dark border-2 border-zinc-900 dark:border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'
                    }`}
            >
                {/* Header Estilo Pit Wall */}
                <div className="bg-zinc-900 p-6 flex justify-between items-center text-white border-b-4 border-brand-orange">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="bg-brand-orange p-2 rounded-full animate-pulse">
                                <Zap size={18} className="text-white" fill="currentColor" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-black italic uppercase tracking-tighter text-sm">Povolin Support</h3>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">VNTG Hub</span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform bg-white/10 p-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Historial de Chat */}
                <div className="h-80 overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950/50 custom-scrollbar flex flex-col">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.isBot ? '' : 'flex-row-reverse'}`}>
                            {msg.isBot && (
                                <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center shrink-0 border border-brand-orange">
                                    <Bot size={14} className="text-brand-orange" />
                                </div>
                            )}
                            <div className={`p-4 text-[10px] font-black italic uppercase leading-relaxed shadow-sm ${msg.isBot
                                ? 'bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border-l-4 border-brand-orange'
                                : 'bg-brand-orange text-white'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center shrink-0 border border-brand-orange">
                                <Bot size={14} className="text-brand-orange animate-pulse" />
                            </div>
                            <div className="p-4 text-[10px] font-black italic uppercase text-zinc-500">
                                Procesando telemetría...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input de Mensaje */}
                <div className="p-4 bg-white dark:bg-brand-dark border-t dark:border-white/5 flex gap-2">
                    <input
                        type="text"
                        placeholder="Escribir al equipo..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-none px-4 py-3 text-[10px] font-black uppercase italic focus:outline-none dark:text-white"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className={`bg-brand-orange text-white px-4 transition-opacity ${isLoading ? 'opacity-50' : 'hover:bg-orange-600'}`}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

            {/* BOTÓN "ENGINE START" CIRCULAR */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 ${isOpen ? 'bg-zinc-900 rotate-180' : 'bg-brand-orange hover:bg-zinc-900'
                    }`}
            >
                {/* Anillo de tacómetro decorativo */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 group-hover:rotate-180 transition-transform duration-[2000ms]"></div>

                {isOpen ? (
                    <X size={28} className="text-white relative z-10" />
                ) : (
                    <MessageCircle size={28} className="text-white relative z-10" fill="currentColor" />
                )}
            </button>
        </div>
    );
}