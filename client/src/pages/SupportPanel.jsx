import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Mail, 
    MessageSquare, 
    Clock, 
    CircleCheck, 
    Search, 
    ChevronRight,
    ChevronDown,
    Loader,
    Trash2,
    House,
    Shield,
    RefreshCw,
    TriangleAlert
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SupportPanel() {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, in_progress, finished
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, ids: null });
    const [selectedMsgs, setSelectedMsgs] = useState(new Set());

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('vntg_user'));
        if (!user || (user.role !== 'admin' && user.role !== 'support')) {
            navigate('/');
            return;
        }
        fetchMessages();
        const interval = setInterval(fetchMessages, 30000);
        return () => clearInterval(interval);
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

    const handleUpdateMessageStatus = async (msgId, newStatus) => {
        try {
            const token = localStorage.getItem('vntg_token');
            const res = await fetch(`${API_URL}/api/support/messages/${msgId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setMessages(messages.map(m => m.id === msgId ? { ...m, status: newStatus } : m));
                if (selectedMsg?.id === msgId) setSelectedMsg(prev => ({ ...prev, status: newStatus }));
                addToast({}, 'Estado de mensaje actualizado', 'success');
            } else {
                addToast({}, 'Error al actualizar estado', 'error');
            }
        } catch (error) {
            console.error("Error updating status:", error);
            addToast({}, 'Error de conexión', 'error');
        }
    };

    const handleDeleteMessage = (msgId) => {
        setConfirmDelete({ isOpen: true, id: msgId, ids: null });
    };

    const executeDeleteMessage = async () => {
        const { id, ids } = confirmDelete;
        const token = localStorage.getItem('vntg_token');
        
        try {
            if (ids && ids.length > 0) {
                // Bulk delete
                const res = await fetch(`${API_URL}/api/support/messages/bulk-delete`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ids })
                });
                if (res.ok) {
                    setMessages(messages.filter(m => !ids.includes(m.id)));
                    if (selectedMsg && ids.includes(selectedMsg.id)) setSelectedMsg(null);
                    setSelectedMsgs(new Set());
                    addToast({}, 'Mensajes eliminados correctamente', 'success');
                } else {
                    addToast({}, 'Error al eliminar mensajes', 'error');
                }
            } else if (id) {
                // Single delete
                const res = await fetch(`${API_URL}/api/support/messages/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setMessages(messages.filter(m => m.id !== id));
                    if (selectedMsg?.id === id) setSelectedMsg(null);
                    setSelectedMsgs(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                    addToast({}, 'Mensaje eliminado correctamente', 'success');
                } else {
                    addToast({}, 'Error al eliminar mensaje', 'error');
                }
            }
        } catch (error) {
            console.error("Error deleting:", error);
            addToast({}, 'Error de conexión', 'error');
        } finally {
            setConfirmDelete({ isOpen: false, id: null, ids: null });
        }
    };

    const toggleMessageSelection = (msgId) => {
        setSelectedMsgs(prev => {
            const next = new Set(prev);
            if (next.has(msgId)) {
                next.delete(msgId);
            } else {
                next.add(msgId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedMsgs.size === filteredMessages.length && filteredMessages.length > 0) {
            setSelectedMsgs(new Set());
        } else {
            setSelectedMsgs(new Set(filteredMessages.map(m => m.id)));
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

    const threadMessages = selectedMsg
        ? messages.filter(m =>
            m.id === selectedMsg.thread_id ||
            m.thread_id === selectedMsg.id ||
            (selectedMsg.thread_id && m.thread_id === selectedMsg.thread_id) ||
            (selectedMsg.thread_id && m.id === selectedMsg.thread_id)
          ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        : [];

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
                                <House size={14} /> Volver
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
                                        {['all', 'pending', 'in_progress', 'finished'].map(f => (
                                            <button 
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`flex-1 py-2 text-[8px] xs:text-[10px] font-black uppercase italic border transition-all rounded-lg ${filter === f ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-transparent border-zinc-200 dark:border-zinc-600 text-zinc-500 hover:border-brand-blue'}`}
                                            >
                                                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'in_progress' ? 'En Progreso' : 'Finalizados'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Selección Múltiple Cabecera */}
                                {filteredMessages.length > 0 && (
                                    <div className="bg-zinc-50 dark:bg-brand-card p-4 rounded-xl shadow-sm flex items-center justify-between gap-4 border border-zinc-200 dark:border-zinc-800">
                                        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase italic tracking-wider text-zinc-500">
                                            <input
                                                type="checkbox"
                                                checked={selectedMsgs.size === filteredMessages.length && filteredMessages.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 accent-brand-blue cursor-pointer"
                                            />
                                            Seleccionar todos
                                        </label>
                                        {selectedMsgs.size > 0 && (
                                            <button
                                                onClick={() => {
                                                    setConfirmDelete({
                                                        isOpen: true,
                                                        id: null,
                                                        ids: Array.from(selectedMsgs)
                                                    });
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase italic tracking-widest rounded-xl border border-red-500/20 shadow-md"
                                            >
                                                <Trash2 size={14} /> Eliminar ({selectedMsgs.size})
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-4 max-h-[300px] lg:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loading ? (
                                        [1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />)
                                    ) : filteredMessages.length > 0 ? (
                                        filteredMessages.map(msg => {
                                            const isSelected = selectedMsgs.has(msg.id);
                                            return (
                                                <div 
                                                    key={msg.id} 
                                                    onClick={() => setSelectedMsg(msg)}
                                                    className={`p-5 bg-zinc-50 dark:bg-brand-card border rounded-2xl cursor-pointer transition-all group relative overflow-hidden shadow-sm hover:shadow-md ${msg.status === 'finished' ? 'opacity-60 hover:opacity-100' : ''} ${selectedMsg?.id === msg.id ? 'border-brand-blue ring-1 ring-brand-blue/30' : 'border-zinc-200 dark:border-zinc-600 hover:border-brand-blue/50'} flex gap-3`}
                                                >
                                                    {msg.status === 'pending' ? (
                                                        <div className="absolute top-0 right-0 w-2 h-full bg-yellow-500"></div>
                                                    ) : msg.status === 'in_progress' ? (
                                                        <div className="absolute top-0 right-0 w-2 h-full bg-brand-blue"></div>
                                                    ) : msg.status === 'finished' ? (
                                                        <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
                                                    ) : null}

                                                    {/* Checkbox para Selección Múltiple */}
                                                    <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleMessageSelection(msg.id)}
                                                            className="w-4 h-4 accent-brand-blue cursor-pointer"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="text-[10px] font-black text-brand-blue uppercase italic truncate mr-2">{msg.email}</p>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {msg.source === 'email' && (
                                                                    <span className="px-1.5 py-0.5 text-[8px] font-black uppercase italic rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-500">Email</span>
                                                                )}
                                                                <p className="text-[9px] font-bold text-zinc-500">{new Date(msg.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <h3 className="font-black italic uppercase text-sm mb-1 truncate">{msg.nombre}</h3>
                                                        <p className="text-xs text-zinc-500 line-clamp-2 italic">{msg.mensaje}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-20 bg-zinc-50 dark:bg-brand-card border border-dashed border-zinc-200 dark:border-zinc-600 rounded-xl">
                                            <MessageSquare size={40} className="mx-auto text-zinc-300 mb-4" />
                                            <p className="text-xs font-bold text-zinc-500 uppercase italic">No hay mensajes que coincidan</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detalle y Redirección de Respuesta */}
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
                                                    {/* Selector de Estado */}
                                                    <select
                                                        value={selectedMsg.status}
                                                        onChange={(e) => handleUpdateMessageStatus(selectedMsg.id, e.target.value)}
                                                        className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 px-3 text-[10px] font-black uppercase italic text-zinc-900 dark:text-white outline-none focus:border-brand-blue cursor-pointer transition-all"
                                                    >
                                                        <option value="pending">Pendiente</option>
                                                        <option value="in_progress">En Progreso</option>
                                                        <option value="finished">Finalizado</option>
                                                    </select>

                                                    <button
                                                        onClick={() => handleDeleteMessage(selectedMsg.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase italic rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                        title="Eliminar mensaje"
                                                    >
                                                        <Trash2 size={14} /> Eliminar
                                                    </button>
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

                                            {threadMessages.length > 0 && (
                                                <div className="space-y-3 border-l-2 border-zinc-200 dark:border-zinc-700 ml-4 pl-6">
                                                    {threadMessages.map(tm => (
                                                        <div key={tm.id} className={`relative ${tm.id === selectedMsg.id ? 'ring-2 ring-brand-blue/30 rounded-xl' : ''}`}>
                                                            <div className="absolute -left-8 top-4 w-3 h-0.5 bg-zinc-300 dark:bg-zinc-600"></div>
                                                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-[9px] font-black uppercase italic text-zinc-500">{tm.nombre} ({tm.email})</p>
                                                                    {tm.source === 'email' && <span className="px-1 py-0.5 text-[7px] font-black uppercase rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-500">Email</span>}
                                                                    <span className="text-[8px] text-zinc-400 ml-auto">{new Date(tm.created_at).toLocaleString()}</span>
                                                                </div>
                                                                <p className="text-xs font-medium leading-relaxed">{tm.mensaje}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 border-l-4 border-brand-blue relative rounded-r-2xl">
                                                <MessageSquare size={40} className="absolute top-4 right-4 text-brand-blue/5" />
                                                <p className="text-[10px] font-black uppercase text-brand-blue mb-2">Mensaje del Cliente</p>
                                                <p className="text-sm font-medium leading-relaxed dark:text-zinc-200">{selectedMsg.mensaje}</p>
                                            </div>
                                        </div>

                                        {/* Botón para Responder por Correo */}
                                        <div className="p-4 xs:p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                            <a 
                                                href={`mailto:${selectedMsg.email}?subject=Re: Consulta VNTG Hub`}
                                                className="w-full bg-brand-blue text-white py-4 font-black uppercase italic tracking-widest flex items-center justify-center gap-3 hover:bg-brand-orange transition-all rounded-2xl shadow-lg active:scale-95 text-center text-xs"
                                            >
                                                <Mail size={18} /> Responder por Correo
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-zinc-50 dark:bg-brand-card border border-dashed border-zinc-200 dark:border-zinc-600 rounded-2xl text-center p-12">
                                        <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6">
                                            <MessageSquare size={48} className="text-brand-blue" />
                                        </div>
                                        <h2 className="text-2xl font-black italic uppercase mb-2">Selecciona un mensaje</h2>
                                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest max-w-xs">Elige una consulta de la lista para gestionarla.</p>
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
                                    <TriangleAlert className="text-brand-orange" size={40} />
                                </div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 dark:text-white">
                                    {confirmDelete.ids && confirmDelete.ids.length > 0 ? '¿Eliminar Mensajes?' : '¿Eliminar Mensaje?'}
                                </h3>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic leading-relaxed mb-8">
                                    {confirmDelete.ids && confirmDelete.ids.length > 0 
                                        ? `Estás a punto de eliminar ${confirmDelete.ids.length} mensajes permanentemente.` 
                                        : 'Estás a punto de eliminar este mensaje permanentemente.'}
                                    <span className="block mt-3 text-zinc-600 dark:text-zinc-400">
                                        <strong className="text-red-500 not-italic">Esta acción no se puede deshacer.</strong>
                                    </span>
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => setConfirmDelete({ isOpen: false, id: null, ids: null })}
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
