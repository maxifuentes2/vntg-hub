import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, Headset, Package, MessageSquare } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FAQ_OPTIONS = [
  { label: "Métodos de envío", question: "¿Cuáles son los métodos de envío disponibles?" },
  { label: "Medios de pago", question: "¿Qué medios de pago aceptan?" },
  { label: "Devoluciones", question: "¿Cuál es la política de devoluciones?" },
  { label: "Estado de mi orden", question: "Quiero consultar el estado de mi orden" },
  { label: "Buscar producto", question: "¿Qué productos tienen disponible?" },
];

const LINK_REGEX = /\[([^\]]+)\]\((\/[^)]+)\)/g;

function parseLinks(text) {
  const segments = [];
  let lastIndex = 0;
  let match;
  while ((match = LINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'link', text: match[1], path: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

const WELCOME_MSG = { text: "Bienvenido al Hub, piloto. ¿Buscás una pieza histórica o asistencia técnica con un envío?", isBot: true };

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showOrderLookup, setShowOrderLookup] = useState(false);
  const [orderLookupInput, setOrderLookupInput] = useState('');
  const [contactForm, setContactForm] = useState({ nombre: '', email: '', mensaje: '' });
  const messagesEndRef = useRef(null);
  const chatbotRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Limpiar cualquier chat persistido del localStorage al montar
  useEffect(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vntg_chat_')) {
        localStorage.removeItem(key);
      }
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSend = async (overrideMsg) => {
    const userMsg = overrideMsg || input;
    if (!userMsg.trim() || isLoading) return;

    const historyForGemini = messages.slice(1).slice(-6).map(m => ({
      role: m.isBot ? "model" : "user",
      parts: [{ text: m.text }]
    }));

    let userId = null;
    let userEmail = null;
    try {
      const userStr = localStorage.getItem('vntg_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        userId = u.id;
        userEmail = u.email;
      }
    } catch { /* ignore */ }

    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    if (!overrideMsg) setInput('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: historyForGemini, userId, userEmail }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();

      if (data.reply) {
        setMessages(prev => [...prev, { text: data.reply, isBot: true }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { text: "Error del sistema: " + data.error, isBot: true }]);
      }

      if (data.orderData) {
        const o = data.orderData;
        const statusMap = { pending: "⏳ Pendiente de pago", approved: "✅ Aprobado", preparing: "📦 Preparando", shipped: "🚚 En camino", delivered: "📬 Entregado" };
        const itemsText = o.items.map(item => `• ${item.title} x${item.quantity || 1}`).join('\n');
        setMessages(prev => [...prev, {
          text: `📋 Orden ${o.id}\nEstado: ${statusMap[o.status] || o.status}\nTotal: $${o.total}\nFecha: ${new Date(o.created_at).toLocaleDateString()}\n\nArtículos:\n${itemsText}`,
          isBot: true
        }]);
      }

      if (data.finished) {
        // Chat finalizado
      }
    } catch {
      setMessages(prev => [...prev, { text: "Error de conexión con el sistema. Intenta de nuevo.", isBot: true }]);
    } finally {
      setIsLoading(false);
      setCooldown(2);
    }
  };

  const handleMyOrders = async () => {
    const userStr = localStorage.getItem('vntg_user');
    if (!userStr) {
      setMessages(prev => [...prev, { text: "Necesitás iniciar sesión para ver tus órdenes. Iniciá sesión desde el menú principal.", isBot: true }]);
      setShowOrderLookup(false);
      return;
    }

    let userId;
    try { userId = JSON.parse(userStr).id; } catch { /* ignore */ }
    if (!userId) {
      setMessages(prev => [...prev, { text: "Necesitás iniciar sesión para ver tus órdenes.", isBot: true }]);
      setShowOrderLookup(false);
      return;
    }

    setMessages(prev => [...prev, { text: "Mostrando mis órdenes...", isBot: false }]);
    setShowOrderLookup(false);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/orders/${userId}`);
      const orders = await res.json();

      if (!Array.isArray(orders) || orders.length === 0) {
        setMessages(prev => [...prev, { text: "No tenés órdenes en tu cuenta todavía. Cuando realices tu primera compra, aparecerá acá. 🛒", isBot: true }]);
      } else {
        const statusMap = { pending: "⏳ Pendiente de pago", approved: "✅ Aprobado", preparing: "📦 Preparando", shipped: "🚚 En camino", delivered: "📬 Entregado" };
        const ordersText = orders.map((o, i) => {
          const date = new Date(o.created_at).toLocaleDateString();
          return `  ${i + 1}. ${o.id}  ${statusMap[o.status] || o.status}  ${date}  $${o.total}`;
        }).join('\n');

        setMessages(prev => [...prev, {
          text: `📋 **Tus órdenes recientes**\n\n${ordersText}\n\nPara ver detalles de una orden, decime su número de orden.`,
          isBot: true
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { text: "Error al obtener tus órdenes. Intenta de nuevo más tarde.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderLookup = async () => {
    const orderId = orderLookupInput.trim();
    if (!orderId) return;

    setMessages(prev => [...prev, { text: `Mi número de pedido es: ${orderId}`, isBot: false }]);
    setShowOrderLookup(false);
    setOrderLookupInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/orders/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { text: `No encontré ninguna orden con el número ${orderId}. Verificá el número e intentá de nuevo.`, isBot: true }]);
      } else {
        const statusMap = { pending: "⏳ Pendiente de pago", approved: "✅ Aprobado", preparing: "📦 Preparando", shipped: "🚚 En camino", delivered: "📬 Entregado" };
        const itemsText = data.items.map(item => `• ${item.title} x${item.quantity || 1}`).join('\n');
        setMessages(prev => [...prev, {
          text: `📋 Orden ${data.id}\nEstado: ${statusMap[data.status] || data.status}\nTotal: $${data.total}\nFecha: ${new Date(data.created_at).toLocaleDateString()}\n\nArtículos:\n${itemsText}`,
          isBot: true
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { text: "Error al consultar la orden. Intenta de nuevo más tarde.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.nombre.trim() || !contactForm.email.trim() || !contactForm.mensaje.trim()) return;

    setMessages(prev => [...prev, { text: `Enviando consulta de ${contactForm.nombre}...`, isBot: false }]);
    setShowContactForm(false);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        setMessages(prev => [...prev, {
          text: "📩 Consulta enviada con éxito. Un agente humano del equipo VNTG Hub te responderá a la brevedad a tu correo. Gracias por contactarnos.",
          isBot: true
        }]);
        setContactForm({ nombre: '', email: '', mensaje: '' });
      } else {
        setMessages(prev => [...prev, { text: "Hubo un error al enviar tu consulta. Intenta de nuevo.", isBot: true }]);
      }
    } catch {
      setMessages(prev => [...prev, { text: "Error de conexión. Intenta de nuevo.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg, index) => {
    if (msg.isBot) {
      const segments = parseLinks(msg.text);
      return (
        <div key={index} className="flex gap-3">
          <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0  rounded-lg shadow-sm">
            <Headset size={14} className="text-brand-orange" />
          </div>
          <div className="p-4 text-xs font-bold italic leading-relaxed shadow-sm rounded-2xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-l-4 border-brand-orange">
            {segments.map((seg, i) => {
              if (seg.type === 'link') {
                return (
                  <Link
                    key={i}
                    to={seg.path}
                    onClick={() => setIsOpen(false)}
                    className="text-brand-orange underline hover:text-orange-400 transition-colors"
                  >
                    {seg.text}
                  </Link>
                );
              }
              const lines = seg.content.split('\n');
              return lines.map((line, li) => (
                <span key={`${i}-${li}`}>
                  {line}
                  {li < lines.length - 1 && <br />}
                </span>
              ));
            })}
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="flex gap-3 flex-row-reverse">
        <div className="p-4 text-xs font-bold italic leading-relaxed shadow-sm rounded-2xl bg-brand-orange text-white">
          {msg.text}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={chatbotRef}
      className="fixed bottom-6 right-3 sm:right-6 z-[90]"
    >
      <div
        className={`absolute bottom-16 sm:bottom-24 right-0 mb-2 w-[calc(100vw-1.5rem)] xs:w-80 md:w-96 max-h-[65vh] xs:max-h-[500px] bg-white dark:bg-brand-dark  shadow-2xl transition-all duration-500 origin-bottom-right rounded-[2.5rem] overflow-hidden flex flex-col ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <div className="bg-white dark:bg-zinc-900/90 pl-6 pr-8 pt-8 pb-6 flex justify-between items-center text-zinc-900 dark:text-white border-b-2 border-brand-orange/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full">
                <Headset size={20} className="text-brand-orange" />
              </div>
              <div className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
            </div>
            <div>
              <h3 className="font-black italic uppercase tracking-tighter text-sm">Povolin Support</h3>
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">VNTG Hub</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full text-zinc-900 dark:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950/50 custom-scrollbar">
          {messages.map((msg, index) => renderMessage(msg, index))}

          {isOpen && messages.length === 1 && !isLoading && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
                Consultas rápidas
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {FAQ_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(opt.question)}
                    disabled={isLoading || cooldown > 0}
                    className="px-3 py-2 text-[10px] font-bold italic uppercase tracking-tighter bg-white dark:bg-zinc-800 border border-brand-orange/30 text-brand-orange rounded-full hover:bg-brand-orange hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isOpen && messages.length > 2 && !showContactForm && !showOrderLookup && !isLoading && (
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                onClick={() => setShowOrderLookup(true)}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold italic uppercase tracking-tighter bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-full hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all shadow-sm active:scale-95"
              >
                <Package size={12} />
                Consultar orden
              </button>
              <button
                onClick={() => setShowContactForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold italic uppercase tracking-tighter bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-full hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all shadow-sm active:scale-95"
              >
                <MessageSquare size={12} />
                Hablar con humano
              </button>
            </div>
          )}

          {showContactForm && (
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-brand-orange/30 shadow-sm">
              <h4 className="text-xs font-black italic uppercase tracking-tighter mb-3 text-zinc-800 dark:text-white">
                Contactar a un agente
              </h4>
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <input type="text" placeholder="Tu nombre" value={contactForm.nombre} onChange={(e) => setContactForm(p => ({ ...p, nombre: e.target.value }))} required className="w-full bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-bold italic rounded-xl focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-1 focus:ring-brand-orange" />
                <input type="email" placeholder="Tu email" value={contactForm.email} onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))} required className="w-full bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-bold italic rounded-xl focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-1 focus:ring-brand-orange" />
                <textarea placeholder="Describí tu consulta..." value={contactForm.mensaje} onChange={(e) => setContactForm(p => ({ ...p, mensaje: e.target.value }))} required rows={3} className="w-full bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-bold italic rounded-xl focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 resize-none focus:ring-1 focus:ring-brand-orange" />
                <div className="flex gap-2">
                  <button type="submit" disabled={isLoading} className="flex-1 bg-brand-orange text-white px-3 py-2 text-[10px] font-black italic uppercase tracking-tighter rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95">Enviar</button>
                  <button type="button" onClick={() => setShowContactForm(false)} className="px-3 py-2 text-[10px] font-bold italic text-zinc-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {showOrderLookup && (
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-brand-orange/30 shadow-sm">
              <h4 className="text-xs font-black italic uppercase tracking-tighter mb-3 text-zinc-800 dark:text-white">
                Consultar estado de orden
              </h4>
              <p className="text-[10px] text-zinc-500 mb-3">Ingresá el número de tu pedido (ej: AB123CD):</p>
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Ej: AB123CD" value={orderLookupInput}
                  onChange={(e) => setOrderLookupInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleOrderLookup()}
                  maxLength={7}
                  className="flex-1 uppercase bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-bold italic rounded-xl focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-1 focus:ring-brand-orange"
                  autoFocus
                />
                <button onClick={handleOrderLookup} disabled={isLoading} className="bg-brand-orange text-white px-3 py-2 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95">
                  <Send size={14} />
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={handleMyOrders} disabled={isLoading} className="flex-1 px-3 py-2 text-[10px] font-bold italic uppercase tracking-tighter bg-zinc-100 dark:bg-zinc-800 border border-brand-orange/30 text-brand-orange rounded-full hover:bg-brand-orange hover:text-white transition-all disabled:opacity-50 text-center active:scale-95">
                  No sé mi número de orden
                </button>
                <button onClick={() => setShowOrderLookup(false)} className="px-3 py-2 text-[10px] font-bold italic text-zinc-500 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95">Cancelar</button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0  rounded-lg shadow-sm">
                <Headset size={14} className="text-brand-orange animate-pulse" />
              </div>
              <div className="p-4 text-xs font-bold italic text-zinc-500">
                Procesando telemetría...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-brand-dark border-t dark:border-white/5 flex gap-2">
          <input
            type="text"
            placeholder={cooldown > 0 ? `Enfriando motor... (${cooldown}s)` : "Escribir al equipo..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !cooldown && handleSend()}
            disabled={cooldown > 0 || isLoading}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-base font-bold italic focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 disabled:opacity-50 rounded-xl focus:ring-1 focus:ring-brand-orange"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || cooldown > 0}
            className={`bg-brand-orange text-white px-4 rounded-xl transition-all shadow-lg active:scale-95 ${(isLoading || cooldown > 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90  ${isOpen
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
