import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Truck, CheckCircle2, Home, MapPin, Loader2, ExternalLink, Clock, Store, MessageCircle } from 'lucide-react';
import { slugify } from '../utils/slugify';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const estadosEnvio = [
    { key: 'pending', label: 'Pendiente', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500', line: 'bg-yellow-300' },
    { key: 'approved', label: 'Aprobado', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500', line: 'bg-green-400' },
    { key: 'preparing', label: 'En Preparación', icon: Package, color: 'text-brand-orange', bg: 'bg-brand-orange', line: 'bg-brand-orange' },
    { key: 'shipped', label: 'Enviado', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500', line: 'bg-blue-400' },
    { key: 'delivered', label: 'Entregado', icon: Home, color: 'text-purple-500', bg: 'bg-purple-500', line: 'bg-purple-400' },
];

const estadosRetiro = [
    { key: 'pending', label: 'Pendiente', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500', line: 'bg-yellow-300' },
    { key: 'approved', label: 'Aprobado', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500', line: 'bg-green-400' },
    { key: 'preparing', label: 'En Preparación', icon: Package, color: 'text-brand-orange', bg: 'bg-brand-orange', line: 'bg-brand-orange' },
    { key: 'ready', label: 'Listo para Retirar', icon: Store, color: 'text-cyan-500', bg: 'bg-cyan-500', line: 'bg-cyan-400' },
];

export default function PedidoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('vntg_user'));
        if (!user) {
            navigate('/login');
            return;
        }

        fetch(`${API_URL}/api/orders/detail/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("No encontrado");
                return res.json();
            })
            .then(data => {
                if (data.user_id !== user.id) {
                    navigate('/perfil');
                } else {
                    setPedido(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id, navigate]);

    useEffect(() => {
        if (pedido && pedido.id) {
            document.title = `VNTG HUB - Orden #${pedido.id.slice(0, 8)}`;
        }
    }, [pedido]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark"><Loader2 className="animate-spin text-brand-orange" size={40} /></div>;
    if (!pedido) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark font-black italic uppercase tracking-widest text-zinc-500">Orden no encontrada</div>;

    const infoEnvio = pedido.shipping_info ? JSON.parse(pedido.shipping_info) : {};
    const esRetiro = infoEnvio.shippingType === 'retiro';
    const estados = esRetiro ? estadosRetiro : estadosEnvio;
    const currentIndex = estados.findIndex(e => e.key === pedido.status);
    const progressWidth = currentIndex < 0 ? 0 : (currentIndex / (estados.length - 1)) * 100;

    return (
        <div className="bg-zinc-50 dark:bg-brand-dark min-h-screen pt-32 pb-20 px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[800px] mx-auto">
                <button onClick={() => navigate('/perfil')} className="flex items-center gap-2 text-zinc-400 hover:text-brand-orange mb-8 font-black text-[10px] uppercase tracking-[0.3em] transition-colors">
                    <ChevronLeft size={18} /> Volver a mi cuenta
                </button>
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Orden #{pedido.id.slice(0,8)}</h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Fecha de compra: {new Date(pedido.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })} (Hora ARG)</p>
                </div>

                {/* MAPA DE ESTADO (TIMELINE) */}
                <div className={`relative overflow-hidden rounded-3xl shadow-2xl mb-8 border ${esRetiro ? 'border-cyan-500/20' : 'border-white/20 dark:border-white/5'} ${esRetiro ? 'bg-gradient-to-br from-cyan-500/5 to-transparent' : 'bg-white/40 dark:bg-white/5 backdrop-blur-xl'}`}>
                    <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-10 sm:pb-14">
                        <h2 className={`text-xs font-black uppercase italic tracking-[0.3em] mb-8 flex items-center gap-2 ${esRetiro ? 'text-cyan-500' : 'text-brand-orange'}`}>
                            {esRetiro ? <Store size={16} /> : <Truck size={16} />}
                            {esRetiro ? 'Estado del Retiro' : 'Estado del Envío'}
                        </h2>

                        {currentIndex < 0 ? (
                            <div className="flex items-center gap-4 p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                                <Clock size={24} className="text-yellow-500 shrink-0 animate-pulse" />
                                <div>
                                    <p className="text-sm font-black italic uppercase text-yellow-500">Esperando confirmación de pago</p>
                                    <p className="text-xs text-zinc-500 mt-1">El estado se actualizará automáticamente cuando MercadoPago confirme la transacción.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative flex justify-between items-center">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 dark:bg-white/5 z-0 rounded-full"></div>
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 z-0 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressWidth}%` }}
                                >
                                    <div className="h-full w-full bg-gradient-to-r from-green-400 via-brand-orange to-blue-500 rounded-full"></div>
                                </div>

                                {estados.map((estado, idx) => {
                                    const isCompleted = idx <= currentIndex;
                                    const isCurrent = idx === currentIndex;
                                    const Icon = estado.icon;

                                    return (
                                        <div key={estado.key} className="relative z-10 flex flex-col items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isCompleted ? `${estado.bg} border-white dark:border-brand-dark text-white shadow-lg ${estado.bg.replace('bg-', 'shadow-')}/30 scale-110` : 'bg-zinc-200 dark:bg-[#1a1a1a] border-zinc-50 dark:border-brand-dark text-zinc-400'}`}>
                                                <Icon size={20} className={isCompleted ? 'animate-in' : ''} />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase italic tracking-wider absolute -bottom-8 whitespace-nowrap px-2 py-0.5 rounded-full ${isCurrent ? `${estado.color} bg-${estado.color.replace('text-', '')}/10 font-black` : (isCompleted ? 'text-zinc-900 dark:text-white' : 'text-zinc-400')}`}>
                                                {estado.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* SECCIÓN DE TRACKING */}
                        {pedido.trackingNumber && !esRetiro && (
                            <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Código de Seguimiento</p>
                                    <p className="text-lg font-bold italic text-brand-orange">{pedido.trackingNumber}</p>
                                </div>
                                <a href="https://www.correoargentino.com.ar/formularios/e-commerce" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 text-xs font-black uppercase italic hover:bg-brand-orange transition-all rounded-lg shadow-lg active:scale-95">
                                    Rastrear <ExternalLink size={14} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* DETALLES DE COMPRA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ARTÍCULOS */}
                    <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5 p-4 sm:p-8 rounded-2xl shadow-xl">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2"><Package size={14} className="text-brand-orange"/> Productos</h2>
                        <div className="space-y-4">
                            {pedido.items?.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-zinc-50 dark:bg-black rounded-lg p-2 flex items-center justify-center border border-white/5">
                                        <img src={item.images} alt={item.title} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <Link to={`/producto/${slugify(item.title)}`} className="text-sm font-bold uppercase italic hover:text-brand-orange transition-colors line-clamp-1">{item.title}</Link>
                                        <p className="text-xs text-zinc-500 font-bold mt-1">{item.quantity} x ${Number(item.price).toLocaleString('es-AR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/5 flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Pagado</span>
                            <span className="text-2xl font-black italic text-brand-orange">${Number(pedido.total).toLocaleString('es-AR')}</span>
                        </div>
                    </div>

                    {/* DIRECCIÓN / RETIRO */}
                    <div className={`bg-white/40 dark:bg-black/20 backdrop-blur-md border p-4 sm:p-8 rounded-2xl shadow-xl h-fit ${esRetiro ? 'border-cyan-500/20' : 'border-white/20 dark:border-white/5'}`}>
                        <h2 className={`text-xs font-black uppercase italic tracking-[0.3em] mb-6 flex items-center gap-2 ${esRetiro ? 'text-cyan-500' : 'text-zinc-500'}`}>
                            {esRetiro ? <Store size={14} className="text-cyan-500" /> : <MapPin size={14} className="text-brand-orange" />}
                            {esRetiro ? 'Retiro en Local' : 'Envío'}
                        </h2>
                        {esRetiro ? (
                            <div className="space-y-3">
                                <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-xl">
                                    <Store size={20} className="text-cyan-500 mb-2" />
                                    <p className="text-sm font-bold">Pasá a retirar tu pedido por nuestro local cuando recibas la notificación de que está listo.</p>
                                </div>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Nombre:</span> {infoEnvio.nombre}</p>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Teléfono:</span> {infoEnvio.telefono}</p>

                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm font-bold"><span className="text-zinc-500">Nombre:</span> {infoEnvio.nombre} {infoEnvio.apellido}</p>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Dirección:</span> {infoEnvio.direccion}, {infoEnvio.ciudad}</p>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Provincia:</span> {infoEnvio.provincia} ({infoEnvio.codigoPostal})</p>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Teléfono:</span> {infoEnvio.telefono}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
