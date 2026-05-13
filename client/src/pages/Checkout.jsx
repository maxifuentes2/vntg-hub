import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShieldCheck, MapPin, Truck, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Checkout() {
    const { cart, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [shipping, setShipping] = useState({
        nombre: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
        telefono: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('vntg_user');
        if (!storedUser) {
            navigate('/login'); 
        } else {
            setUser(JSON.parse(storedUser));
        }
        if (cart.length === 0) navigate('/');
    }, [cart, navigate]);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, cart, shipping })
            });
            const data = await res.json();

            if (res.ok && data.init_point) {
                clearCart(); 
                // CAMBIO: Abrir pasarela en nueva pestaña
                window.open(data.init_point, '_blank'); 
                // Opcional: Navegar a una página de confirmación en la pestaña original
                navigate('/');
            } else {
                setError(data.error || "Error al procesar. Verifica tu stock.");
            }
        } catch (err) {
            setError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    if (!user || cart.length === 0) return null;

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen pt-32 pb-20 px-4 transition-colors font-sans">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-brand-orange transition-colors mb-6 text-xs font-bold uppercase italic tracking-widest">
                        <ArrowLeft size={16} /> Volver
                    </button>
                    
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Envío</h1>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-8 italic tracking-[0.3em]">Detalles de entrega</p>
                    
                    {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic">{error}</div>}

                    <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                        <input type="text" placeholder="NOMBRE COMPLETO" value={shipping.nombre} onChange={e => setShipping({...shipping, nombre: e.target.value})} required className="w-full bg-zinc-50 dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold italic focus:border-brand-orange outline-none" />
                        <div className="flex gap-4">
                            <input type="text" placeholder="DIRECCIÓN" value={shipping.direccion} onChange={e => setShipping({...shipping, direccion: e.target.value})} required className="w-2/3 bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                            <input type="text" placeholder="CP" value={shipping.codigoPostal} onChange={e => setShipping({...shipping, codigoPostal: e.target.value})} required className="w-1/3 bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                        </div>
                        <div className="flex gap-4">
                            <input type="text" placeholder="CIUDAD" value={shipping.ciudad} onChange={e => setShipping({...shipping, ciudad: e.target.value})} required className="w-1/2 bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                            <input type="text" placeholder="PROVINCIA" value={shipping.provincia} onChange={e => setShipping({...shipping, provincia: e.target.value})} required className="w-1/2 bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                        </div>
                        <input type="tel" placeholder="TELÉFONO" value={shipping.telefono} onChange={e => setShipping({...shipping, telefono: e.target.value})} required className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 p-4 font-bold focus:border-brand-orange outline-none" />
                    </form>
                </div>

                {/* COLUMNA DERECHA: RESUMEN */}
                <div className="bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-8 h-fit shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-blue transform rotate-45 translate-x-8 -translate-y-8"></div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <MapPin size={20} className="text-brand-orange" /> Resumen
                    </h2>
                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-sm font-bold italic border-b border-zinc-200 dark:border-white/5 pb-2">
                                <span>{item.cantidad}x {item.title}</span>
                                <span>${(item.price * item.cantidad).toLocaleString('es-AR')}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-zinc-200 dark:border-white/5 pt-6 space-y-3">
                        <div className="flex justify-between text-2xl font-black italic pt-4">
                            <span>Total</span>
                            <span>${cartTotal.toLocaleString('es-AR')}</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-6 mb-4 flex items-center gap-2 text-zinc-500">
                        <Truck size={14} className="text-brand-blue"/> Tendrás 1 hora para realizar el pago
                    </p>
                    <button type="submit" form="checkout-form" disabled={loading} className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                        {loading ? 'Procesando...' : 'Pagar con Mercado Pago'} <ShieldCheck size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}