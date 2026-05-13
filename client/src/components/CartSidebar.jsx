import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartSidebar({ isOpen, onClose }) {
    const { cart, removeFromCart, updateQuantity, processCheckout } = useCart();
    const subtotal = cart.reduce((acc, p) => acc + (p.price * p.cantidad), 0);

    return (
        <div className={`fixed inset-0 z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            {/* Contenido de la Sidebar */}
            <aside className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-brand-dark shadow-2xl transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-8 flex justify-between items-center border-b border-zinc-200 dark:border-white/5">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
                            <ShoppingBag className="text-brand-orange" size={24} /> Carrito
                        </h2>
                        <button onClick={onClose} className="hover:text-brand-orange transition-colors text-zinc-900 dark:text-white">
                            <X size={28} />
                        </button>
                    </div>

                    {/* Lista de productos */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {cart.length > 0 ? (
                            cart.map((item) => (
                                <div key={item.id} className="bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-4 flex gap-4 group">
                                    <img src={item.images} className="w-20 h-20 object-cover bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10" alt={item.title} />
                                    <div className="flex-grow">
                                        <h3 className="text-xs font-black uppercase italic text-zinc-900 dark:text-white line-clamp-1">{item.title}</h3>
                                        <p className="text-brand-orange font-black italic text-sm mb-3">${item.price.toLocaleString('es-AR')}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 px-2 py-1 text-zinc-900 dark:text-white">
                                                <button onClick={() => updateQuantity(item.id, item.cantidad - 1)}><Minus size={14}/></button>
                                                <span className="text-xs font-black">{item.cantidad}</span>
                                                <button onClick={() => updateQuantity(item.id, item.cantidad + 1)}><Plus size={14}/></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
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

                    {/* Footer */}
                    {cart.length > 0 && (
                        <div className="p-8 bg-zinc-50 dark:bg-black/20 border-t border-zinc-200 dark:border-white/5">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Total Estimado</span>
                                <span className="text-3xl font-black italic text-zinc-900 dark:text-white">${subtotal.toLocaleString('es-AR')}</span>
                            </div>
                            <button onClick={processCheckout} className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-orange/20">
                                Finalizar Pedido <ArrowRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}