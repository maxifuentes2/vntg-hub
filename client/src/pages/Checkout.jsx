import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShieldCheck, MapPin, ArrowLeft, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Checkout() {
    const { cart, finalTotal, shippingType, getShippingCost, clearCart, refreshCartPrices } = useCart();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [shipping, setShipping] = useState({
        nombre: '', direccion: '', ciudad: '', provincia: '', codigoPostal: '', telefono: ''
    });

    // --- ESTADO PARA PUNTOS ---
    const [usePoints, setUsePoints] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('vntg_user');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        setShipping({
            nombre: parsed.name || '',
            direccion: parsed.address || '',
            ciudad: parsed.city || '',
            provincia: parsed.province || '',
            codigoPostal: parsed.zip_code || '',
            telefono: parsed.phone || ''
        });

        if (cart.length === 0) navigate('/');

        refreshCartPrices(API_URL);
    }, [cart.length, navigate]);

    // --- CÁLCULOS VISUALES PARA LOS PUNTOS ---
    const puntosDisponibles = user?.points || 0;
    const valorPorPunto = 10; // Sincronizado con el backend (1 punto = $10)
    const descuentoMaximo = puntosDisponibles * valorPorPunto;
    
    // El descuento no puede ser mayor al total final
    const descuentoAplicado = usePoints ? Math.min(descuentoMaximo, finalTotal) : 0;
    const totalAbonar = finalTotal - descuentoAplicado;

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('vntg_token');
            const res = await fetch(`${API_URL}/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    user,
                    cart,
                    shipping,
                    shippingType,
                    total: finalTotal,
                    usePoints // <-- Enviamos la decisión del usuario al backend
                })
            });

            const data = await res.json();

            if (res.ok && data.init_point) {
                clearCart();
                
                // Actualizamos los puntos en localStorage para que la vista Mi Cuenta esté sincronizada
                if (usePoints && puntosDisponibles > 0) {
                    const puntosGastados = Math.ceil(descuentoAplicado / valorPorPunto);
                    const updatedUser = { ...user, points: puntosDisponibles - puntosGastados };
                    localStorage.setItem('vntg_user', JSON.stringify(updatedUser));
                }

                // Si el total fue $0, el backend devuelve data.totalCero = true y nos manda a /pedido/:id
                if (data.totalCero) {
                    navigate(data.init_point.replace('https://vntg-hub.vercel.app', ''));
                } else {
                    window.location.href = data.init_point;
                }
            } else {
                setError(data.error || "Error al procesar el pago");
                setLoading(false);
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
            setLoading(false);
        }
    };

    if (!user || cart.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-brand-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-orange"></div>
            </div>
        );
    }

    const esRetiro = shippingType === 'retiro';
    const costoEnvio = getShippingCost();

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen pt-24 xs:pt-32 pb-12 xs:pb-20 px-3 xs:px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 xs:gap-12">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 mb-6 text-xs font-bold uppercase italic"><ArrowLeft size={16} /> Volver</button>
                    <h1 className="text-2xl max-[400px]:text-xl font-black italic uppercase tracking-tighter mb-2">{esRetiro ? 'Retiro' : 'Envío'}</h1>

                    <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                        <input
                            type="text"
                            placeholder="NOMBRE COMPLETO"
                            value={shipping.nombre}
                            onChange={e => setShipping({ ...shipping, nombre: e.target.value })}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 font-bold italic focus:border-brand-orange outline-none capitalize rounded-xl shadow-inner"
                        />
                        {!esRetiro && (
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <input type="text" placeholder="DIRECCIÓN" value={shipping.direccion} onChange={e => setShipping({ ...shipping, direccion: e.target.value })} required className="w-2/3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                    <input type="text" placeholder="CP" value={shipping.codigoPostal} onChange={e => setShipping({ ...shipping, codigoPostal: e.target.value })} required className="w-1/3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                </div>
                                <div className="flex gap-4">
                                    <input type="text" placeholder="CIUDAD" value={shipping.ciudad} onChange={e => setShipping({ ...shipping, ciudad: e.target.value })} required className="w-1/2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                    <input type="text" placeholder="PROVINCIA" value={shipping.provincia} onChange={e => setShipping({ ...shipping, provincia: e.target.value })} required className="w-1/2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                </div>
                            </div>
                        )}
                        <input
                            type="tel"
                            placeholder="TELÉFONO"
                            value={shipping.telefono}
                            onChange={e => setShipping({ ...shipping, telefono: e.target.value })}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner"
                        />
                        
                        {/* --- SECCIÓN DE PUNTOS EN EL FORMULARIO --- */}
                        {puntosDisponibles > 0 && (
                            <div className="mt-6 p-5 bg-brand-orange/10 border border-brand-orange/30 rounded-xl flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-brand-orange text-white p-2 rounded-full">
                                        <Star size={20} className="fill-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black italic uppercase text-sm">Aplicar Puntos VNTG</h3>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
                                            Tienes {puntosDisponibles} pts equivalentes a <span className="font-bold text-brand-orange">${descuentoMaximo.toLocaleString('es-AR')}</span>
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={usePoints}
                                        onChange={(e) => setUsePoints(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-orange"></div>
                                </label>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-8 bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50 rounded-2xl shadow-xl shadow-brand-orange/20 active:scale-95"
                        >
                            {loading ? 'Procesando...' : (totalAbonar <= 0 ? 'Confirmar Pedido Gratis' : 'Pagar con Mercado Pago')} <ShieldCheck size={20} />
                        </button>
                    </form>

                    {error && <p className="mt-4 text-red-500 font-bold italic uppercase text-xs text-center">{error}</p>}
                </div>

                <div className="bg-zinc-50 dark:bg-brand-card p-4 sm:p-10 h-fit sticky top-32 rounded-3xl shadow-lg border border-transparent dark:border-zinc-800">
                    <h2 className="text-xl font-black italic uppercase tracking-tight mb-8 flex items-center gap-3">
                        <MapPin size={20} className="text-brand-orange" /> Resumen
                    </h2>
                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-sm font-bold italic border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                <span>{item.cantidad}x {item.title}</span>
                                <span>${(item.price * item.cantidad).toLocaleString('es-AR')}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-xs font-black uppercase text-zinc-500 pt-2">
                            <span>Envío ({shippingType})</span>
                            <span className={costoEnvio === 0 ? "text-emerald-500" : "text-zinc-900 dark:text-white"}>
                                {costoEnvio === 0 ? "¡GRATIS!" : `+$${costoEnvio.toLocaleString('es-AR')}`}
                            </span>
                        </div>

                        {/* --- DESCUENTO EN EL RESUMEN VISUAL --- */}
                        {usePoints && descuentoAplicado > 0 && (
                            <div className="flex justify-between text-xs font-black uppercase text-green-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <span>Puntos VNTG aplicados</span>
                                <span>-${descuentoAplicado.toLocaleString('es-AR')}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 flex justify-between items-center text-2xl font-black italic">
                        <span>Total</span>
                        <span className="text-brand-orange">${totalAbonar.toLocaleString('es-AR')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}