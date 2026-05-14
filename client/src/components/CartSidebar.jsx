import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartSidebar({ isOpen, onClose }) {
    const { cart, removeFromCart, updateQuantity, clearCart, shippingType, setShippingType, finalTotal, cartTotal, FREE_SHIPPING_THRESHOLD } = useCart();

    const progress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const faltante = FREE_SHIPPING_THRESHOLD - cartTotal;
    const tieneEnvioGratis = cartTotal >= FREE_SHIPPING_THRESHOLD;

    return (
        <div className={`fixed inset-0 z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <aside className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-brand-dark shadow-2xl transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-8 flex justify-between items-center border-b border-white/5">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3"><ShoppingBag className="text-brand-orange" /> Carrito</h2>
                        <button onClick={onClose} className="hover:text-brand-orange"><X size={28} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {/* BARRA DE PROGRESO ENVÍO GRATIS */}
                        {cart.length > 0 && (
                            <div className="mb-6 p-4 bg-zinc-50 dark:bg-white/5 border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-[9px] font-black uppercase italic tracking-widest ${tieneEnvioGratis ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                        {tieneEnvioGratis ? '¡Envío Gratis Desbloqueado!' : `Faltan $${faltante.toLocaleString('es-AR')} para envío gratis`}
                                    </span>
                                    <Truck size={14} className={tieneEnvioGratis ? 'text-emerald-500' : 'text-zinc-500'} />
                                </div>
                                <div className="h-1.5 w-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {cart.length > 0 ? cart.map((item) => (
                            <div key={item.id} className="bg-zinc-50 dark:bg-[#1a1a1a] border border-white/5 p-4 flex gap-4">
                                <img src={item.images} className="w-20 h-20 object-cover border border-white/10" alt="" />
                                <div className="flex-grow">
                                    <h3 className="text-xs font-black uppercase italic line-clamp-1">{item.title}</h3>
                                    <p className="text-brand-orange font-black italic text-sm mb-3">${item.price.toLocaleString('es-AR')}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-white/10 px-2 py-1">
                                            <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                                            <span className="text-xs font-black">{item.cantidad}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        )) : <div className="text-center py-20 text-zinc-400 font-bold uppercase italic text-xs tracking-widest">El carrito está vacío</div>}
                    </div>

                    {cart.length > 0 && (
                        <div className="p-6 bg-zinc-50 dark:bg-black/20 border-t border-white/5">
                            <div className="mb-6 space-y-3">
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Método de Entrega</span>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => setShippingType('retiro')} className={`p-3 border transition-all text-left ${shippingType === 'retiro' ? 'border-brand-orange bg-brand-orange/5' : 'border-white/10'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs font-black uppercase italic ${shippingType === 'retiro' ? 'text-brand-orange' : ''}`}>Retiro en Sucursal</span>
                                            <span className="text-[10px] font-black text-emerald-500">GRATIS</span>
                                        </div>
                                    </button>

                                    <button onClick={() => setShippingType('normal')} className={`p-3 border transition-all text-left ${shippingType === 'normal' ? 'border-brand-orange bg-brand-orange/5' : 'border-white/10'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs font-black uppercase italic ${shippingType === 'normal' ? 'text-brand-orange' : ''}`}>Correo Argentino Clásico</span>
                                            <span className={`text-[10px] font-black ${tieneEnvioGratis ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                {tieneEnvioGratis ? 'GRATIS' : '$9.426'}
                                            </span>
                                        </div>
                                    </button>

                                    <button onClick={() => setShippingType('prioritario')} className={`p-3 border transition-all text-left ${shippingType === 'prioritario' ? 'border-brand-orange bg-brand-orange/5' : 'border-white/10'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs font-black uppercase italic ${shippingType === 'prioritario' ? 'text-brand-orange' : ''}`}>Correo Argentino Expreso</span>
                                            <span className={`text-[10px] font-black ${tieneEnvioGratis ? 'text-emerald-500' : 'text-brand-orange'}`}>
                                                {tieneEnvioGratis ? 'GRATIS' : '$17.276'}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-6">
                                <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Total Final</span>
                                <span className="text-3xl font-black italic text-brand-orange">${finalTotal.toLocaleString('es-AR')}</span>
                            </div>
                            
                            <Link to="/checkout" onClick={onClose} className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-orange/20">
                                Finalizar Pedido <ArrowRight size={20} />
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}