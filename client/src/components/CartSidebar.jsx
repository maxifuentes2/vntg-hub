import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CartSidebar({ isOpen, onClose }) {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const subtotal = cart.reduce((acc, p) => acc + (p.price * p.cantidad), 0);
    
    // ESTADO PARA EL TIPO DE ENTREGA (Visual, listo para el backend)
    const [tipoEnvio, setTipoEnvio] = useState('normal'); 

    const handleEmptyCart = async () => {
        const storedUser = localStorage.getItem('vntg_user');
        
        if (storedUser) {
            const user = JSON.parse(storedUser);
            try {
                await fetch(`${API_URL}/api/orders/cancel-pending`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });
            } catch (err) {
                console.error("Error al sincronizar con el servidor:", err);
            }
        }
        clearCart();
    };

    return (
        <div className={`fixed inset-0 z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <aside className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-brand-dark shadow-2xl transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-8 flex justify-between items-center border-b border-zinc-200 dark:border-white/5">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
                            <ShoppingBag className="text-brand-orange" size={24} /> Carrito
                        </h2>
                        <button onClick={onClose} className="hover:text-brand-orange transition-colors text-zinc-900 dark:text-white">
                            <X size={28} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {cart.length > 0 && (
                            <button 
                                onClick={handleEmptyCart}
                                className="text-[10px] font-black uppercase italic text-zinc-500 hover:text-red-500 transition-colors mb-4 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Vaciar Carrito
                            </button>
                        )}
                        {cart.length > 0 ? (
                            cart.map((item) => (
                                <div key={item.id} className="bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-4 flex gap-4 group">
                                    <img src={item.images} className="w-20 h-20 object-cover bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10" alt={item.title} />
                                    <div className="flex-grow">
                                        <h3 className="text-xs font-black uppercase italic text-zinc-900 dark:text-white line-clamp-1">{item.title}</h3>
                                        <p className="text-brand-orange font-black italic text-sm mb-3">${item.price.toLocaleString('es-AR')}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 px-2 py-1">
                                                <button onClick={() => updateQuantity(item.id, item.cantidad - 1)}><Minus size={14} /></button>
                                                <span className="text-xs font-black">{item.cantidad}</span>
                                                <button onClick={() => updateQuantity(item.id, item.cantidad + 1)}><Plus size={14} /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-zinc-400 font-bold uppercase italic text-xs">El carrito está vacío</div>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="p-6 bg-zinc-50 dark:bg-black/20 border-t border-zinc-200 dark:border-white/5">
                            
                            <div className="mb-6 space-y-3">
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Método de Entrega</span>
                                <div className="flex flex-col gap-2">
                                    
                                    {/* Opción 1: Envío Normal */}
                                    <button
                                        onClick={() => setTipoEnvio('normal')}
                                        className={`p-3 border transition-all text-left flex flex-col justify-center ${
                                            tipoEnvio === 'normal' 
                                            ? 'border-brand-orange bg-brand-orange/5' 
                                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <span className={`text-xs font-black uppercase italic ${tipoEnvio === 'normal' ? 'text-brand-orange' : 'text-zinc-900 dark:text-white'}`}>Envío Normal</span>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 mt-1">Estándar a domicilio</span>
                                    </button>

                                    {/* Opción 2: Envío Prioritario (AQUÍ AGREGAMOS EL 5%) */}
                                    <button
                                        onClick={() => setTipoEnvio('prioritario')}
                                        className={`p-3 border transition-all text-left flex flex-col justify-center ${
                                            tipoEnvio === 'prioritario' 
                                            ? 'border-brand-orange bg-brand-orange/5' 
                                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <span className={`text-xs font-black uppercase italic ${tipoEnvio === 'prioritario' ? 'text-brand-orange' : 'text-zinc-900 dark:text-white'}`}>Envío Prioritario</span>
                                        {/* Texto actualizado con el color naranja si está seleccionado para resaltarlo */}
                                        <span className={`text-[9px] font-bold uppercase mt-1 ${tipoEnvio === 'prioritario' ? 'text-brand-orange' : 'text-zinc-500'}`}>
                                            Despacho express (+5% al finalizar)
                                        </span>
                                    </button>

                                    {/* Opción 3: Retirar en Sucursal */}
                                    <button
                                        onClick={() => setTipoEnvio('retiro')}
                                        className={`p-3 border transition-all text-left flex flex-col justify-center ${
                                            tipoEnvio === 'retiro' 
                                            ? 'border-brand-orange bg-brand-orange/5' 
                                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <span className={`text-xs font-black uppercase italic ${tipoEnvio === 'retiro' ? 'text-brand-orange' : 'text-zinc-900 dark:text-white'}`}>Retirar en Sucursal</span>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 mt-1">Gratis en nuestro local</span>
                                    </button>

                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-6">
                                <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Total Estimado</span>
                                <span className="text-3xl font-black italic text-zinc-900 dark:text-white">${subtotal.toLocaleString('es-AR')}</span>
                            </div>
                            
                            <Link
                                to="/checkout"
                                onClick={onClose}
                                className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-orange/20"
                            >
                                Finalizar Pedido <ArrowRight size={20} />
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}