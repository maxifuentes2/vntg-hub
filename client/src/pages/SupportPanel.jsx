import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Mail, 
    MessageSquare, 
    Clock, 
    CheckCircle2, 
    Send, 
    Search, 
    Filter,
    ChevronRight,
    Loader2,
    ArrowLeft
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SupportPanel() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, replied
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('vntg_user'));
        if (!user || (user.role !== 'admin' && user.role !== 'support')) {
            navigate('/');
            return;
        }
        fetchMessages();
    }, [navigate]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('vntg_token');
            const res = await fetch(`${API_URL}/api/support/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(data);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedMsg) return;

        setSendingReply(true);
        try {
            const token = localStorage.getItem('vntg_token');
            const res = await fetch(`${API_URL}/api/support/reply/${selectedMsg.id}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ respuesta: replyText })
            });

            if (res.ok) {
                // Actualizar estado local
                setMessages(messages.map(m => 
                    m.id === selectedMsg.id 
                    ? { ...m, status: 'replied', respuesta: replyText } 
                    : m
                ));
                setSelectedMsg({ ...selectedMsg, status: 'replied', respuesta: replyText });
                setReplyText('');
                alert("Respuesta enviada correctamente");
            } else {
                alert("Error al enviar respuesta");
            }
        } catch (error) {
            console.error("Error replying:", error);
        } finally {
            setSendingReply(false);
        }
    };

    const filteredMessages = messages.filter(m => {
        const matchesFilter = filter === 'all' || m.status === filter;
        const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             m.mensaje.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="bg-zinc-50 dark:bg-brand-dark min-h-screen pt-32 pb-20 px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-2">Panel de Soporte</h1>
                        <p className="text-brand-blue font-black uppercase tracking-[0.3em] text-[10px] italic">Atención al Cliente Hub</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-2 border border-white/20 dark:border-white/5 rounded-xl shadow-xl">
                        <div className="flex flex-col items-end px-4">
                            <p className="text-[9px] font-black uppercase text-zinc-500">Estado del Sistema</p>
                            <p className="text-xs font-bold text-green-500 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Operativo</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Lista de Mensajes */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Filtros y Búsqueda */}
                        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 p-4 rounded-xl shadow-lg space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="BUSCAR MENSAJES..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-3 pl-12 font-bold italic text-xs uppercase outline-none focus:border-brand-blue transition-all rounded-xl shadow-inner"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'pending', 'replied'].map(f => (
                                    <button 
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase italic border transition-all rounded-lg ${filter === f ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-blue-500/20' : 'bg-transparent border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-brand-blue'}`}
                                    >
                                        {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Respondidos'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-200 dark:bg-white/5 animate-pulse rounded-xl" />)
                            ) : filteredMessages.length > 0 ? (
                                filteredMessages.map(msg => (
                                    <div 
                                        key={msg.id} 
                                        onClick={() => setSelectedMsg(msg)}
                                        className={`p-5 bg-white/40 dark:bg-black/20 backdrop-blur-md border rounded-2xl cursor-pointer transition-all group relative overflow-hidden shadow-sm ${selectedMsg?.id === msg.id ? 'border-brand-blue shadow-blue-500/10 scale-[1.02]' : 'border-white/10 dark:border-white/5 hover:border-brand-blue/50'}`}
                                    >
                                        {msg.status === 'pending' && (
                                            <div className="absolute top-0 right-0 w-2 h-full bg-brand-orange"></div>
                                        )}
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] font-black text-brand-blue uppercase italic">{msg.email}</p>
                                            <p className="text-[9px] font-bold text-zinc-500">{new Date(msg.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <h3 className="font-black italic uppercase text-sm mb-1 truncate">{msg.nombre}</h3>
                                        <p className="text-xs text-zinc-500 line-clamp-2 italic">{msg.mensaje}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-[#111] border border-dashed border-zinc-200 dark:border-white/5 rounded-xl">
                                    <MessageSquare size={40} className="mx-auto text-zinc-300 mb-4" />
                                    <p className="text-xs font-bold text-zinc-500 uppercase italic">No hay mensajes que coincidan</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detalle y Respuesta */}
                    <div className="lg:col-span-7">
                        {selectedMsg ? (
                            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full min-h-[600px]">
                                {/* Cabecera Detalle */}
                                <div className="p-8 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1">Consulta #{selectedMsg.id}</p>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedMsg.nombre}</h2>
                                    </div>
                                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase italic ${selectedMsg.status === 'pending' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                        {selectedMsg.status === 'pending' ? 'Pendiente' : 'Respondido'}
                                    </div>
                                </div>

                                {/* Contenido */}
                                <div className="p-8 flex-grow space-y-8 overflow-y-auto">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-zinc-400">
                                            <Mail size={16} />
                                            <p className="text-sm font-bold italic">{selectedMsg.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-zinc-400">
                                            <Clock size={16} />
                                            <p className="text-sm font-bold italic">{new Date(selectedMsg.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-50 dark:bg-[#1a1a1a] p-6 border-l-4 border-brand-blue relative rounded-r-2xl shadow-inner">
                                        <MessageSquare size={40} className="absolute top-4 right-4 text-brand-blue/5" />
                                        <p className="text-[10px] font-black uppercase text-brand-blue mb-2">Mensaje del Cliente</p>
                                        <p className="text-sm font-medium leading-relaxed dark:text-zinc-200">{selectedMsg.mensaje}</p>
                                    </div>

                                    {selectedMsg.status === 'replied' && (
                                        <div className="bg-green-500/5 dark:bg-green-500/5 p-6 border-l-4 border-green-500 rounded-r-2xl shadow-inner">
                                            <p className="text-[10px] font-black uppercase text-green-500 mb-2">Nuestra Respuesta</p>
                                            <p className="text-sm font-medium leading-relaxed dark:text-zinc-200 italic">"{selectedMsg.respuesta}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Formulario de Respuesta */}
                                {selectedMsg.status === 'pending' && (
                                    <div className="p-8 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5">
                                        <form onSubmit={handleSendReply} className="space-y-4">
                                            <p className="text-[10px] font-black uppercase text-zinc-500 italic">Escribir Respuesta</p>
                                            <textarea 
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                rows="5"
                                                placeholder="Hola! Gracias por contactarnos..."
                                                className="w-full bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-5 text-sm font-medium outline-none focus:border-brand-blue transition-all resize-none rounded-2xl shadow-inner"
                                            ></textarea>
                                            <button 
                                                disabled={sendingReply || !replyText.trim()}
                                                className="w-full bg-brand-blue text-white py-4 font-black uppercase italic tracking-widest flex items-center justify-center gap-3 hover:bg-brand-orange transition-all disabled:opacity-50 rounded-2xl shadow-lg active:scale-95"
                                            >
                                                {sendingReply ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Enviar Respuesta por n8n</>}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-2xl border border-dashed border-white/20 dark:border-white/5 rounded-2xl text-center p-12">
                                <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6">
                                    <MessageSquare size={48} className="text-brand-blue" />
                                </div>
                                <h2 className="text-2xl font-black italic uppercase mb-2">Selecciona un mensaje</h2>
                                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest max-w-xs">Elige una consulta de la lista para leerla y responderla.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
