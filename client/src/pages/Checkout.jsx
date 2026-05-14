import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShieldCheck, MapPin, ArrowLeft, Store } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Checkout() {
    const { cart, finalTotal, shippingType, getShippingCost, clearCart } = useCart();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shipping, setShipping] = useState({ nombre: '', direccion: '', ciudad: '', provincia: '', codigoPostal: '', telefono: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('vntg_user');
        if (!storedUser) navigate('/login');
        else {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setShipping({ nombre: parsed.name || '', direccion: parsed.address || '', ciudad: parsed.city || '', provincia: parsed.province || '', codigoPostal: parsed.zip_code || '', telefono: parsed.phone || '' });
        }
        if (cart.length === 0) navigate('/');
    }, [cart, navigate]);

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, cart, shipping, shippingType }) 
            });
            const data = await res.json();
            if (res.ok) {
                clearCart(); 
                window.open(data.init_point, '_blank'); 
                navigate('/mi-cuenta');
            } else setError(data.error);
        } catch { setError("Error de conexión"); }
        finally { setLoading(false); }
    };

    const esRetiro = shippingType === 'retiro';
    const costoEnvio = getShippingCost();

    if (!user || cart.length === 0) return null;

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen pt-32 pb-20 px-4 transition-colors font-sans">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 mb-6 text-xs font-bold uppercase italic"><ArrowLeft size={16} /> Volver</button>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{esRetiro ? 'Retiro' : 'Envío'}</h1>
                    <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                        <input type="text" placeholder="NOMBRE COMPLETO" value={shipping.nombre} onChange={e => setShipping({...shipping, nombre: e.target.value})} required className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-white/5 p-4 font-bold italic focus:border-brand-orange outline-none" />
                        {!esRetiro && (
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <input type="text" placeholder="DIRECCIÓN" value={shipping.direccion} onChange={e => setShipping({...shipping, direccion: e.target.value})} required className="w-2/3 bg-zinc-50 dark:bg-[#1a1a1a] border border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                                    <input type="text" placeholder="CP" value={shipping.codigoPostal} onChange={e => setShipping({...shipping, codigoPostal: e.target.value})} required className="w-1/3 bg-zinc-50 dark:bg-[#1a1a1a] border border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                                </div>
                                <div className="flex gap-4">
                                    <input type="text" placeholder="CIUDAD" value={shipping.ciudad} onChange={e => setShipping({...shipping, ciudad: e.target.value})} required className="w-1/2 bg-zinc-50 dark:bg-[#1a1a1a] border border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                                    <input type="text" placeholder="PROVINCIA" value={shipping.provincia} onChange={e => setShipping({...shipping, provincia: e.target.value})} required className="w-1/2 bg-zinc-50 dark:bg-[#1a1a1a] border border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                                </div>
                            </div>
                        )}
                        <input type="tel" placeholder="TELÉFONO" value={shipping.telefono} onChange={e => setShipping({...shipping, telefono: e.target.value})} required className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                        {esRetiro && (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 flex gap-4 items-center">
                                <Store className="text-emerald-500" size={24} />
                                <p className="text-[10px] font-bold uppercase italic text-zinc-500">Retira gratis en nuestra sucursal central tras la aprobación del pago.</p>
                            </div>
                        )}
                    </form>
                </div>

                <div className="bg-zinc-50 dark:bg-[#111111] border border-white/5 p-8 h-fit shadow-2xl relative">
                    <h2 className="text-2xl font-black italic uppercase mb-6 flex items-center gap-2"><MapPin size={20} className="text-brand-orange" /> Resumen</h2>
                    <div className="space-y-4 mb-6">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-sm font-bold italic border-b border-white/5 pb-2">
                                <span>{item.cantidad}x {item.title}</span>
                                <span>${(item.price * item.cantidad).toLocaleString('es-AR')}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-xs font-black uppercase text-zinc-500 pt-2">
                            <span>Envío ({shippingType})</span>
                            <span className={costoEnvio === 0 ? "text-emerald-500" : "text-white"}>
                                {costoEnvio === 0 ? "¡GRATIS!" : `+$${costoEnvio.toLocaleString('es-AR')}`}
                            </span>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-6 flex justify-between text-2xl font-black italic">
                        <span>Total</span>
                        <span className="text-brand-orange">${finalTotal.toLocaleString('es-AR')}</span>
                    </div>
                    <button type="submit" form="checkout-form" disabled={loading} className="w-full mt-8 bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3">
                        {loading ? 'Procesando...' : 'Pagar con Mercado Pago'} <ShieldCheck size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}