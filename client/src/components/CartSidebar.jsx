import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSidebar } from '../context/SidebarContext';
import SidebarWrapper from './SidebarWrapper';

export default function CartSidebar() {
    const { isCartOpen, closeAll } = useSidebar();
    const { cart, removeFromCart, updateQuantity, shippingType, setShippingType, finalTotal, cartTotal, FREE_SHIPPING_THRESHOLD } = useCart();

    const progress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const faltante = FREE_SHIPPING_THRESHOLD - cartTotal;
    const tieneEnvioGratis = cartTotal >= FREE_SHIPPING_THRESHOLD;

    return (
        <SidebarWrapper 
            isOpen={isCartOpen} 
            onClose={closeAll} 
            title="Carrito" 
            icon={ShoppingBag}
        >
            {/* BARRA DE PROGRESO */}
            {cart.length > 0 && (
                <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50  rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-[9px] font-black uppercase italic tracking-widest ${tieneEnvioGratis ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {tieneEnvioGratis ? '¡Envío Gratis Desbloqueado!' : `Faltan $${faltante.toLocaleString('es-AR')} para envío gratis`}
                        </span>
                        <Truck size={14} className={tieneEnvioGratis ? 'text-emerald-500' : 'text-zinc-500'} />
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200/50 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {cart.length > 0 ? cart.map((item) => (
                    <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50  p-4 flex gap-4 rounded-2xl shadow-sm group">
                        <img src={item.images} className="w-20 h-20 object-cover  rounded-xl shadow-sm" alt="" />
                        <div className="flex-grow">
                            <h3 className="text-xs font-black uppercase italic line-clamp-1">{item.title}</h3>
                            <p className="text-brand-orange font-black italic text-sm mb-3">${item.price.toLocaleString('es-AR')}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800  px-2 py-1 rounded-xl">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-brand-orange transition-colors"><Minus size={14} /></button>
                                    <span className="text-xs font-black">{item.cantidad}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-brand-orange transition-colors"><Plus size={14} /></button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 text-zinc-400 font-bold uppercase italic text-xs tracking-widest">El carrito está vacío</div>
                )}
            </div>

            {cart.length > 0 && (
                <div className="mt-8 space-y-6">
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Método de Entrega</span>
                        <div className="flex flex-col gap-2">
                            {['retiro', 'normal', 'prioritario'].map((type) => (
                                <button 
                                    key={type}
                                    onClick={() => setShippingType(type)} 
                                    className={`p-3 border transition-all text-left rounded-2xl ${shippingType === type ? 'border-brand-orange bg-brand-orange/5' : 'border-zinc-200 dark:border-white/10'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs font-black uppercase italic ${shippingType === type ? 'text-brand-orange' : ''}`}>
                                            {type === 'retiro' ? 'Retiro en Sucursal' : type === 'normal' ? 'Correo Argentino Clásico' : 'Correo Argentino Expreso'}
                                        </span>
                                        <span className="text-[10px] font-black text-emerald-500">
                                            {(type === 'retiro' || tieneEnvioGratis) ? 'GRATIS' : type === 'normal' ? '$9.426' : '$17.276'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Total Final</span>
                        <span className="text-3xl font-black italic text-brand-orange">${finalTotal.toLocaleString('es-AR')}</span>
                    </div>
                    
                    <Link to="/checkout" onClick={closeAll} className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-orange/20 rounded-2xl">
                        Finalizar Pedido <ArrowRight size={20} />
                    </Link>
                </div>
            )}
        </SidebarWrapper>
    );
}