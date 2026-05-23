import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    ArrowLeft,
    Trash2,
    XCircle,
    Home,
    Shield,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SupportPanel() {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, replied, finished
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

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
                setMessages(messages.map(m => 
                    m.id === selectedMsg.id 
                    ? { ...m, status: 'replied', respuesta: replyText } 
                    : m
                ));
                setSelectedMsg({ ...selectedMsg, status: 'replied', respuesta: replyText });
                setReplyText('');
                addToast({ title: selectedMsg.nombre }, 'Respuesta enviada correctamente', 'success');
            } else {
                addToast({}, 'Error al enviar respuesta', 'error');
            }
        } catch (error) {
            addToast({}, 'Error de conexión al enviar respuesta', 'error');
            console.error("Error replying:", error);
        } finally {
            setSendingReply(false);
        }
    };

    const handleFinishChat = async (msgId) => {
        try {
            const token = localStorage.getItem('vntg_token');
            const res = await fetch(`${API_URL}/api/support/messages/${msgId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'finished' })
            });
            if (res.ok) {
                setMessages(messages.map(m => m.id === msgId ? { ...m, status: 'finished' } : m));
                if (selectedMsg?.id === msgId) setSelectedMsg({ ...selectedMsg, status: 'finished' });
                addToast({}, 'Chat marcado como terminado', 'success');
            }
        } catch (error) {
            addToast({}, 'Error al finalizar chat', 'error');
        }
    };

    const handleDeleteMessage = (msgId) => {
        setConfirmDelete({ isOpen: true, id: msgId });
    };

    const executeDeleteMessage = async () => {
        const msgId = confirmDelete.id;
        if (!msgId) return;
        try {
            const token = localStorage.getItem('vntg_token');
            const res = await fetch(`${API_URL}/api/support/messages/${msgId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessages(messages.filter(m => m.id !== msgId));
                if (selectedMsg?.id === msgId) setSelectedMsg(null);
                setConfirmDelete({ isOpen: false, id: null });
                addToast({}, 'Mensaje eliminado correctamente', 'success');
            }
        } catch (error) {
            setConfirmDelete({ isOpen: false, id: null });
            addToast({}, 'Error al eliminar mensaje', 'error');
        }
    };

    const filteredMessages = messages.filter(m => {
        const matchesFilter = filter === 'all' || m.status === filter;
        const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             m.mensaje.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const currentUser = JSON.parse(localStorage.getItem('vntg_user') || 'null');

    return (
        <div className="bg-zinc-50 dark:bg-brand-dark min-h-screen pt-24 xs:pt-32 pb-12 xs:pb-20 px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* ─── SIDEBAR IZQUIERDO ─── */}
                    <aside className="w-56 shrink-0 max-[400px]:w-full max-[400px]:overflow-x-auto">
                        <div className="sticky top-28 flex flex-col max-[400px]:flex-row bg-zinc-50 dark:bg-brand-card rounded-xl p-1 gap-1 shadow-sm">
                            <Link
                                to="/"
                                className="flex items-center gap-2 px-2 xs:px-4 py-2 xs:py-3 text-[11px] xs:text-sm font-black uppercase italic rounded-lg transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-white max-[400px]:shrink-0"
                            >
                                <Home size={14} /> Volver
                            </Link>
                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-1 mt-1 max-[400px]:border-t-0 max-[400px]:pt-0 max-[400px]:mt-0">
                                <button
                                    className="flex items-center gap-2 px-2 xs:px-4 py-2 xs:py-3 text-[11px] xs:text-sm font-black uppercase italic rounded-lg transition-all bg-brand-blue text-white w-full text-left mt-1 max-[400px]:w-auto max-[400px]:mt-0 max-[400px]:shrink-0"
                                >
                                    <MessageSquare size={14} /> Soporte
                                </button>
                            </div>
                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-1 mt-1 max-[400px]:border-t-0 max-[400px]:pt-0 max-[400px]:mt-0 max-[400px]:shrink-0">
                                <button
                                    onClick={() => {
                                        if (currentUser?.role === 'admin') {
                                            navigate('/admin');
                                        } else {
                                            addToast({}, 'No tienes permisos para acceder al panel de administración', 'error');
                                        }
                                    }}
                                    className="flex items-center gap-2 px-2 xs:px-4 py-2 xs:py-3 text-[11px] xs:text-sm font-black uppercase italic rounded-lg transition-all w-full text-left max-[400px]:w-auto text-zinc-500 hover:text-zinc-900 dark:hover:text-white mt-1 max-[400px]:mt-0 max-[400px]:shrink-0"
                                >
                                    <Shield size={14} /> Admin
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* ─── CONTENEDOR PRINCIPAL ─── */}
                    <main className="flex-1 min-w-0">

                        {/* HEADER */}
                        <div className="flex flex-wrap justify-between items-center mb-8 gap-4 border-b border-zinc-200 dark:border-white/5 pb-6">
                            <div>
                                <h1 className="text-2xl xs:text-3xl lg:text-4xl font-black italic text-zinc-900 dark:text-white uppercase tracking-tighter">Panel de Soporte</h1>
                                <p className="text-brand-blue text-[10px] font-bold uppercase tracking-widest mt-1">Atención al Cliente Hub</p>
                            </div>
                            <div className="flex items-center gap-2 xs:gap-3">
                                <div className="hidden xs:flex items-center gap-2 bg-zinc-50 dark:bg-brand-card px-4 py-2 rounded-xl shadow-sm">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <p className="text-[9px] font-black uppercase text-zinc-500">Sistema Operativo</p>
                                </div>
                                <button onClick={fetchMessages} className="p-3 bg-zinc-50 dark:bg-brand-card rounded-2xl text-brand-orange hover:rotate-180 transition-all duration-500 shadow-sm">
                                    <RefreshCw size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Lista de Mensajes */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Filtros y Búsqueda */}
                                <div className="bg-zinc-50 dark:bg-brand-card p-4 rounded-xl shadow-sm space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="BUSCAR MENSAJES..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-3 pl-12 font-bold italic text-xs uppercase outline-none focus:border-brand-blue transition-all rounded-xl"
                                        />
                                    </div>
                                    <div className="flex gap-1 xs:gap-2">
                                        {['all', 'pending', 'replied', 'finished'].map(f => (
                                            <button 
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`flex-1 py-2 text-[8px] xs:text-[10px] font-black uppercase italic border transition-all rounded-lg ${filter === f ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-transparent border-zinc-200 dark:border-zinc-600 text-zinc-500 hover:border-brand-blue'}`}
                                            >
                                                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'replied' ? 'Respondidos' : 'Terminados'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[300px] lg:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loading ? (
                                        [1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />)
                                    ) : filteredMessages.length > 0 ? (
                                        filteredMessages.map(msg => (
                                            <div 
                                                key={msg.id} 
                                                onClick={() => setSelectedMsg(msg)}
                                                className={`p-5 bg-zinc-50 dark:bg-brand-card border rounded-2xl cursor-pointer transition-all group relative overflow-hidden shadow-sm hover:shadow-md ${msg.status === 'finished' ? 'opacity-60 hover:opacity-100' : ''} ${selectedMsg?.id === msg.id ? 'border-brand-blue ring-1 ring-brand-blue/30' : 'border-zinc-200 dark:border-zinc-600 hover:border-brand-blue/50'}`}
                                            >
                                                {msg.status === 'pending' ? (
                                                    <div className="absolute top-0 right-0 w-2 h-full bg-brand-orange"></div>
                                                ) : msg.status === 'finished' ? (
                                                    <div className="absolute top-0 right-0 w-2 h-full bg-zinc-400"></div>
                                                ) : null}
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-[10px] font-black text-brand-blue uppercase italic">{msg.email}</p>
                                                    <p className="text-[9px] font-bold text-zinc-500">{new Date(msg.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <h3 className="font-black italic uppercase text-sm mb-1 truncate">{msg.nombre}</h3>
                                                <p className="text-xs text-zinc-500 line-clamp-2 italic">{msg.mensaje}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 bg-zinc-50 dark:bg-brand-card border border-dashed border-zinc-200 dark:border-zinc-600 rounded-xl">
                                            <MessageSquare size={40} className="mx-auto text-zinc-300 mb-4" />
                                            <p className="text-xs font-bold text-zinc-500 uppercase italic">No hay mensajes que coincidan</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detalle y Respuesta */}
                            <div className="lg:col-span-7">
                                {selectedMsg ? (
                                    <div className="bg-zinc-50 dark:bg-brand-card rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                                        {/* Cabecera Detalle */}
                                        <div className="p-4 xs:p-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1">Consulta #{selectedMsg.id}</p>
                                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedMsg.nombre}</h2>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {selectedMsg.status !== 'finished' && (
                                                        <button
                                                            onClick={() => handleFinishChat(selectedMsg.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase italic rounded-lg bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500 hover:text-white transition-all border border-zinc-500/20"
                                                            title="Marcar como terminado"
                                                        >
                                                            <XCircle size={14} /> Terminar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteMessage(selectedMsg.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase italic rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                        title="Eliminar mensaje"
                                                    >
                                                        <Trash2 size={14} /> Eliminar
                                                    </button>
                                                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase italic ${selectedMsg.status === 'pending' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : selectedMsg.status === 'replied' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'}`}>
                                                        {selectedMsg.status === 'pending' ? 'Pendiente' : selectedMsg.status === 'replied' ? 'Respondido' : 'Terminado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contenido */}
                                        <div className="p-4 xs:p-8 flex-grow space-y-8 overflow-y-auto">
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

                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 border-l-4 border-brand-blue relative rounded-r-2xl">
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
                                            <div className="p-4 xs:p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                                <form onSubmit={handleSendReply} className="space-y-4">
                                                    <p className="text-[10px] font-black uppercase text-zinc-500 italic">Escribir Respuesta</p>
                                                    <textarea 
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        rows="5"
                                                        placeholder="Hola! Gracias por contactarnos..."
                                                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-5 text-sm font-medium outline-none focus:border-brand-blue transition-all resize-none rounded-2xl"
                                                    ></textarea>
                                                    <button 
                                                        disabled={sendingReply || !replyText.trim()}
                                                        className="w-full bg-brand-blue text-white py-4 font-black uppercase italic tracking-widest flex items-center justify-center gap-3 hover:bg-brand-orange transition-all disabled:opacity-50 rounded-2xl shadow-lg active:scale-95"
                                                    >
                                                        {sendingReply ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Enviar Respuesta</>}
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-zinc-50 dark:bg-brand-card border border-dashed border-zinc-200 dark:border-zinc-600 rounded-2xl text-center p-12">
                                        <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6">
                                            <MessageSquare size={48} className="text-brand-blue" />
                                        </div>
                                        <h2 className="text-2xl font-black italic uppercase mb-2">Selecciona un mensaje</h2>
                                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest max-w-xs">Elige una consulta de la lista para leerla y responderla.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>

                {confirmDelete.isOpen && (
                    <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-center items-start p-4 pt-24 md:pt-40 overflow-y-auto">
                        <div className="bg-white dark:bg-zinc-950 border border-brand-orange/30 p-4 sm:p-8 md:p-10 max-w-md w-full shadow-2xl relative overflow-hidden rounded-3xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50"></div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-brand-orange/10 p-4 rounded-full mb-6">
                                    <AlertTriangle className="text-brand-orange" size={40} />
                                </div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 dark:text-white">¿Eliminar Mensaje?</h3>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic leading-relaxed mb-8">
                                    Estás a punto de eliminar este mensaje permanentemente.
                                    <span className="block mt-3 text-zinc-600 dark:text-zinc-400">
                                        <strong className="text-red-500 not-italic">Esta acción no se puede deshacer.</strong>
                                    </span>
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => setConfirmDelete({ isOpen: false, id: null })}
                                        className="px-6 py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all border border-transparent rounded-xl"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={executeDeleteMessage}
                                        className="px-6 py-4 bg-brand-orange text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-900 transition-all shadow-lg active:scale-95 rounded-xl"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
