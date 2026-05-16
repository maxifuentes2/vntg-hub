import React, { useState, useEffect } from 'react';
// Corregido: El import debe ser de lucide-react
import { MessageCircle, X, Send, Bot, Zap, Headset } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Chatbot({ isSidebarOpen }) {
    const [isOpen, setIsOpen] = useState(false);
    // 1. Inicializar mensajes desde localStorage
    const getStorageKey = () => {
        const userStr = localStorage.getItem('vntg_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return `vntg_chat_${user.id}`;
            } catch(e) {}
        }
        return 'vntg_chat_guest';
    };

    const getInitialMessages = () => {
        const key = getStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Si pasaron más de 7 días de inactividad, limpiar
                if (Date.now() - data.lastActivity > 7 * 24 * 60 * 60 * 1000) {
                    localStorage.removeItem(key);
                } else {
                    return data.messages;
                }
            } catch(e) {}
        }
        return [{ text: "Bienvenido al Hub, piloto. ¿Buscás una pieza histórica o asistencia técnica con un envío?", isBot: true }];
    };

    const [messages, setMessages] = useState(getInitialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Reducir el contador de enfriamiento cada segundo
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    // 2. Guardar mensajes en localStorage cada vez que cambian
    useEffect(() => {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify({
            messages,
            lastActivity: Date.now()
        }));
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        
        // 3. Preparar el historial para enviarlo a Gemini (formato que espera la API)
        // Omitimos el mensaje inicial de bienvenida y recortamos a los últimos 6 mensajes (3 pares)
        // Esto optimiza el uso de tokens y previene el límite de "Too Many Requests" por tamaño de contexto
        const historyForGemini = messages.slice(1).slice(-6).map(m => ({
            role: m.isBot ? "model" : "user",
            parts: [{ text: m.text }]
        }));

        let userId = null;
        let userEmail = null;
        try {
            const userStr = localStorage.getItem('vntg_user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                userId = userObj.id;
                userEmail = userObj.email;
            }
        } catch (e) {}

        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg, history: historyForGemini, userId, userEmail })
            });
            const data = await res.json();
            
            // 4. Agregar la respuesta del bot
            setMessages(prev => [...prev, { text: data.reply || "Error del sistema: " + data.error, isBot: true }]);
            
            // 5. Si el bot indica que el chat terminó, limpiamos para la próxima vez
            if (data.finished) {
                // Al poner setTimeout permitimos que el usuario vea el mensaje final antes de que se borre si recarga
                setTimeout(() => {
                    localStorage.removeItem(getStorageKey());
                }, 2000);
            }
        } catch (error) {
            setMessages(prev => [...prev, { text: "Error de conexión con el sistema. Intenta de nuevo.", isBot: true }]);
        } finally {
            setIsLoading(false);
            setCooldown(4); // 4 segundos de enfriamiento para no saturar la API de Gemini (15 RPM limite)
        }
    };

    return (
        /* Se desplaza a la izquierda si cualquier sidebar (Carrito o Filtros) está abierto */
        <div className={`fixed bottom-6 transition-all duration-500 z-[90] ${isSidebarOpen ? 'right-[20px] md:right-[470px]' : 'right-3 sm:right-6'
            }`}>

            {/* Ventana de Chat con Estética de Competición */}
            <div
                className={`absolute bottom-24 right-0 mb-2 w-[calc(100vw-1.5rem)] sm:w-80 md:w-96 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 origin-bottom-right rounded-[2.5rem] overflow-hidden ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'
                    }`}
            >
                {/* Header Estilo Pit Wall */}
                <div className="bg-zinc-900/90 pl-6 pr-8 pt-8 pb-6 flex justify-between items-center text-white border-b-2 border-brand-orange/30">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                <Headset size={20} className="text-brand-orange" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-black italic uppercase tracking-tighter text-sm">Povolin Support</h3>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">VNTG Hub</span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                {/* Historial de Chat */}
                <div className="h-80 overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950/50 custom-scrollbar flex flex-col">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.isBot ? '' : 'flex-row-reverse'}`}>
                            {msg.isBot && (
                                <div className="w-8 h-8 bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10 rounded-lg shadow-sm">
                                    <Headset size={14} className="text-brand-orange" />
                                </div>
                            )}
                            <div className={`p-4 text-xs font-bold italic leading-relaxed shadow-sm rounded-2xl ${msg.isBot
                                ? 'bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white border-l-4 border-brand-orange'
                                : 'bg-brand-orange text-white'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10 rounded-lg shadow-sm">
                                <Headset size={14} className="text-brand-orange animate-pulse" />
                            </div>
                            <div className="p-4 text-xs font-bold italic text-zinc-500">
                                Procesando telemetría...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input de Mensaje */}
                <div className="p-4 bg-white dark:bg-brand-dark border-t dark:border-white/5 flex gap-2">
                    <input
                        type="text"
                        placeholder={cooldown > 0 ? `Enfriando motor... (${cooldown}s)` : "Escribir al equipo..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !cooldown && handleSend()}
                        disabled={cooldown > 0 || isLoading}
                        className="flex-1 bg-zinc-100 dark:bg-zinc-900/50 border-none px-4 py-3 text-xs font-bold italic focus:outline-none dark:text-white disabled:opacity-50 rounded-xl"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || cooldown > 0}
                        className={`bg-brand-orange text-white px-4 rounded-xl transition-all shadow-lg active:scale-95 ${(isLoading || cooldown > 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}`}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

            {/* BOTÓN "ENGINE START" CIRCULAR */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 backdrop-blur-3xl border border-white/20 ${
                    isOpen 
                    ? 'bg-zinc-900/90 rotate-180 border-brand-orange/50' 
                    : 'bg-brand-orange/90 hover:bg-zinc-900 hover:scale-110 shadow-orange-500/20'
                }`}
            >
                {isOpen ? (
                    <X size={28} className="text-white relative z-10" />
                ) : (
                    <div className="relative z-10 flex items-center justify-center">
                        <Headset size={28} className="text-white sm:size-[28px] size-[20px]" />
                    </div>
                )}
            </button>
        </div>
    );
}