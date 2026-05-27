import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShieldCheck, MapPin, ArrowLeft, Star, Plus, Home, Briefcase } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Checkout() {
    const { cart, finalTotal, shippingType, getShippingCost, clearCart, refreshCartPrices } = useCart();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);

    const [shipping, setShipping] = useState({
        nombre: '', direccion: '', ciudad: '', provincia: '', codigoPostal: '', telefono: ''
    });

    const [usePoints, setUsePoints] = useState(false);

    const [userName, setUserName] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('vntg_user');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setUserName(parsed.name || '');

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

    useEffect(() => {
        const token = localStorage.getItem('vntg_token');
        if (!token) return;

        const storedUser = localStorage.getItem('vntg_user');
        const name = storedUser ? JSON.parse(storedUser).name || '' : '';

        fetch(`${API_URL}/api/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setAddresses(list);

                const defaultAddr = list.find(a => a.is_default) || list[0];
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id);
                    setShipping({
                        nombre: name,
                        direccion: defaultAddr.address || '',
                        ciudad: defaultAddr.city || '',
                        provincia: defaultAddr.province || '',
                        codigoPostal: defaultAddr.zip_code || '',
                        telefono: defaultAddr.phone || ''
                    });
                    setShowManualForm(false);
                }
            })
            .catch(console.error);
    }, []);

    const applyAddress = (addr) => {
        setShipping({
            nombre: userName,
            direccion: addr.address || '',
            ciudad: addr.city || '',
            provincia: addr.province || '',
            codigoPostal: addr.zip_code || '',
            telefono: addr.phone || ''
        });
        setSelectedAddressId(addr.id);
        setShowManualForm(false);
    };

    const handleUseManual = () => {
        setSelectedAddressId(null);
        setShowManualForm(true);
    };

    const puntosDisponibles = user?.points || 0;
    const valorPorPunto = 10;
    const descuentoMaximo = puntosDisponibles * valorPorPunto;

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
                    usePoints
                })
            });

            const data = await res.json();

            if (res.ok && data.init_point) {
                clearCart();

                if (usePoints && puntosDisponibles > 0) {
                    const puntosGastados = Math.ceil(descuentoAplicado / valorPorPunto);
                    const updatedUser = { ...user, points: puntosDisponibles - puntosGastados };
                    localStorage.setItem('vntg_user', JSON.stringify(updatedUser));
                }

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

    const TagIcon = (tag) => {
        const key = (tag || '').toLowerCase();
        if (key.includes('casa')) return Home;
        if (key.includes('oficina')) return Briefcase;
        if (key.includes('trabajo')) return Briefcase;
        return MapPin;
    };

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen pt-24 xs:pt-32 pb-12 xs:pb-20 px-3 xs:px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 xs:gap-12">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 mb-6 text-xs font-bold uppercase italic"><ArrowLeft size={16} /> Volver</button>
                    <h1 className="text-2xl max-[400px]:text-xl font-black italic uppercase tracking-tighter mb-2">{esRetiro ? 'Retiro' : 'Envío'}</h1>

                    {!esRetiro && addresses.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-4 flex items-center gap-2">
                                <MapPin size={14} className="text-brand-orange" /> Tus Direcciones Guardadas
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {addresses.map(addr => {
                                    const Icon = TagIcon(addr.tag);
                                    const isSelected = selectedAddressId === addr.id;
                                    return (
                                        <button
                                            key={addr.id}
                                            type="button"
                                            onClick={() => applyAddress(addr)}
                                            className={`text-left p-4 rounded-2xl border-2 transition-all ${
                                                isSelected
                                                    ? 'border-brand-orange bg-brand-orange/5 shadow-md'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-brand-card hover:border-zinc-400 dark:hover:border-zinc-500'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon size={16} className="text-brand-orange" />
                                                <span className="text-sm font-black italic uppercase">{addr.tag || 'Dirección'}</span>
                                                {addr.is_default && (
                                                    <span className="bg-brand-orange text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase ml-auto">Default</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{addr.address}</p>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{addr.city}, {addr.province} - {addr.zip_code}</p>
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={handleUseManual}
                                    className={`text-left p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 min-h-[120px] ${
                                        showManualForm
                                            ? 'border-brand-orange bg-brand-orange/5'
                                            : 'border-zinc-300 dark:border-zinc-600 hover:border-brand-orange text-zinc-400 hover:text-brand-orange'
                                    }`}
                                >
                                    <Plus size={24} />
                                    <span className="text-xs font-black uppercase italic">Otra Dirección</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {!esRetiro && addresses.length === 0 && (
                        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-600 text-center">
                            <p className="text-xs font-bold italic text-zinc-500">Completá los datos de envío abajo. Podés guardar direcciones desde tu <button onClick={() => navigate('/mi-cuenta')} className="text-brand-orange hover:underline">perfil</button>.</p>
                        </div>
                    )}

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
