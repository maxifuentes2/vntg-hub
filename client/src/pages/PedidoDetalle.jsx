import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Truck, CheckCircle2, Home, MapPin, Loader2, ExternalLink } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
                    navigate('/perfil'); // Redirigir si intenta ver el pedido de otro
                } else {
                    setPedido(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id, navigate]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark"><Loader2 className="animate-spin text-brand-orange" size={40} /></div>;
    if (!pedido) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark font-black italic uppercase tracking-widest text-zinc-500">Orden no encontrada</div>;

    const infoEnvio = pedido.shipping_info ? JSON.parse(pedido.shipping_info) : {};
    
    // Lógica del mapa de estados
    const estados = [
        { key: 'approved', label: 'Aprobado', icon: CheckCircle2 },
        { key: 'preparing', label: 'En Preparación', icon: Package },
        { key: 'shipped', label: 'Enviado', icon: Truck },
        { key: 'delivered', label: 'Entregado', icon: Home }
    ];
    
    const currentIndex = estados.findIndex(e => e.key === pedido.status);

    return (
        <div className="bg-zinc-50 dark:bg-brand-dark min-h-screen pt-32 pb-20 px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[800px] mx-auto">
                <button onClick={() => navigate('/perfil')} className="flex items-center gap-2 text-zinc-400 hover:text-brand-orange mb-8 font-black text-[10px] uppercase tracking-[0.3em] transition-colors">
                    <ChevronLeft size={18} /> Volver a mi cuenta
                </button>
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Orden #{pedido.id.slice(0,8)}</h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Fecha de compra: {new Date(pedido.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} (Hora ARG)</p>
                </div>

                {/* MAPA DE ESTADO (TIMELINE) */}
                {/* NOTA: Se cambió p-8 por px-8 pt-8 pb-12 para dar más espacio inferior a las etiquetas */}
                <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 px-4 sm:px-8 pt-4 sm:pt-8 pb-10 sm:pb-14 rounded-xl shadow-xl mb-8">
                    <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-brand-orange mb-8">Estado del Envío</h2>
                    
                    <div className="relative flex justify-between items-center">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 dark:bg-white/5 z-0"></div>
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-orange z-0 transition-all duration-1000" 
                            style={{ width: `${(Math.max(currentIndex, 0) / (estados.length - 1)) * 100}%` }}
                        ></div>

                        {estados.map((estado, idx) => {
                            const isCompleted = idx <= currentIndex;
                            const isCurrent = idx === currentIndex;
                            const Icon = estado.icon;
                            
                            return (
                                <div key={estado.key} className="relative z-10 flex flex-col items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${isCompleted ? 'bg-brand-orange border-brand-dark text-white' : 'bg-zinc-200 dark:bg-[#1a1a1a] border-zinc-50 dark:border-brand-dark text-zinc-400'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase italic tracking-wider absolute -bottom-8 whitespace-nowrap ${isCurrent ? 'text-brand-orange' : (isCompleted ? 'text-zinc-900 dark:text-white' : 'text-zinc-400')}`}>
                                        {estado.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* SECCIÓN DE TRACKING */}
                    {pedido.trackingNumber && (
                        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Código de Seguimiento</p>
                                <p className="text-lg font-bold italic text-brand-orange">{pedido.trackingNumber}</p>
                            </div>
                            <a href="https://www.correoargentino.com.ar/formularios/e-commerce" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 text-xs font-black uppercase italic hover:bg-brand-orange transition-colors">
                                Rastrear <ExternalLink size={14} />
                            </a>
                        </div>
                    )}
                </div>
                {/* DETALLES DE COMPRA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ARTÍCULOS */}
                    <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 p-4 sm:p-8 rounded-xl shadow-xl">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2"><Package size={14} className="text-brand-orange"/> Productos</h2>
                        <div className="space-y-4">
                            {pedido.items?.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-zinc-50 dark:bg-black rounded-lg p-2 flex items-center justify-center border border-white/5">
                                        <img src={item.images} alt={item.title} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <Link to={`/producto/${item.product_id}`} className="text-sm font-bold uppercase italic hover:text-brand-orange transition-colors line-clamp-1">{item.title}</Link>
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

                    {/* DIRECCIÓN */}
                    <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 p-4 sm:p-8 rounded-xl shadow-xl h-fit">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2"><MapPin size={14} className="text-brand-orange"/> Envío</h2>
                        <div className="space-y-3">
                            <p className="text-sm font-bold"><span className="text-zinc-500">Nombre:</span> {infoEnvio.nombre} {infoEnvio.apellido}</p>
                            <p className="text-sm font-bold"><span className="text-zinc-500">Dirección:</span> {infoEnvio.direccion}, {infoEnvio.ciudad}</p>
                            <p className="text-sm font-bold"><span className="text-zinc-500">Provincia:</span> {infoEnvio.provincia} ({infoEnvio.codigoPostal})</p>
                            <p className="text-sm font-bold"><span className="text-zinc-500">DNI:</span> {infoEnvio.dni}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}