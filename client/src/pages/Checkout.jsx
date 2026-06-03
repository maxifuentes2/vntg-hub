import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShieldCheck, MapPin, ArrowLeft, Star, Plus, House, Briefcase, Copy, CircleCheck, Loader, ExternalLink, Bitcoin } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Checkout() {
    const { cart, finalTotal, shippingType, setShippingType, getShippingCost, COSTO_NORMAL, COSTO_PRIO, clearCart, refreshCartPrices, cartTotal, FREE_SHIPPING_THRESHOLD } = useCart();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { formatPrice, currency, tasaUSD } = useCurrency();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mp');
    const [cryptoModal, setCryptoModal] = useState(null);
    const [copied, setCopied] = useState(false);
    const [minAmounts, setMinAmounts] = useState([]);

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);

    const [shipping, setShipping] = useState({
        nombre: '', direccion: '', ciudad: '', provincia: '', codigoPostal: '', telefono: ''
    });

    const [usePoints, setUsePoints] = useState(false);
    const [checkoutSent, setCheckoutSent] = useState(false);
    const [cryptoCurrency, setCryptoCurrency] = useState('usdttrc20');

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

        if (cart.length === 0 && !checkoutSent) navigate('/');

        refreshCartPrices(API_URL);
    }, [cart.length, navigate, checkoutSent]);

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

    useEffect(() => {
        fetch(`${API_URL}/api/crypto/min-amounts`)
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.mins) setMinAmounts(data.mins); })
            .catch(() => {});
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

    const handleCryptoPoll = (orderId) => {
        const token = localStorage.getItem('vntg_token');
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/api/crypto/payment/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.status === 'approved') {
                    clearInterval(interval);
                    setCryptoModal(prev => ({ ...prev, status: 'approved' }));
                    setTimeout(() => navigate(`/pedido/${orderId}`), 2000);
                }
            } catch {}
        }, 10000);
        return interval;
    };

    const handleCopyAddress = (address) => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        addToast({}, 'Dirección copiada al portapapeles', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setCheckoutSent(true);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);

            const token = localStorage.getItem('vntg_token');
            const endpoint = paymentMethod === 'crypto' ? '/api/checkout-crypto' : '/api/checkout';
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    user,
                    cart,
                    shipping,
                    shippingType,
                    total: finalTotal,
                    usePoints,
                    payCurrency: cryptoCurrency,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            const data = await res.json();

            if (res.ok) {
                if (usePoints && puntosDisponibles > 0) {
                    const puntosGastados = Math.ceil(descuentoAplicado / valorPorPunto);
                    const updatedUser = { ...user, points: puntosDisponibles - puntosGastados };
                    localStorage.setItem('vntg_user', JSON.stringify(updatedUser));
                }
                if (data.totalCero) {
                    clearCart();
                    navigate(`/pedido/${data.orderId}`);
                } else if (paymentMethod === 'crypto' && data.cryptoPayment) {
                    clearCart();
                    setCryptoModal({ ...data.cryptoPayment, orderId: data.orderId, status: 'pending' });
                    const interval = handleCryptoPoll(data.orderId);
                    setCryptoModal(prev => ({ ...prev, pollInterval: interval }));
                } else if (data.init_point) {
                    clearCart();
                    window.location.href = data.init_point;
                } else {
                    setError(data.error || "Error al procesar el pago");
                    setLoading(false);
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

    const closeCryptoModal = () => {
        if (cryptoModal?.pollInterval) clearInterval(cryptoModal.pollInterval);
        setCryptoModal(null);
        setLoading(false);
        navigate('/');
    };

    if (!user) {
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
        if (key.includes('casa')) return House;
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

                    {/* SELECCIÓN DE TIPO DE ENVÍO */}
                    <div className="mb-6">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-3">Tipo de envío</h2>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {['retiro', 'normal', 'prioritario'].map((type) => {
                                const labels = { retiro: 'Retiro en Sucursal', normal: 'Correo Argentino Clásico', prioritario: 'Correo Argentino Expreso' };
                                const costMap = {
                                    retiro: 'GRATIS',
                                    normal: cartTotal >= FREE_SHIPPING_THRESHOLD ? 'GRATIS' : formatPrice(COSTO_NORMAL),
                                    prioritario: cartTotal >= FREE_SHIPPING_THRESHOLD ? 'GRATIS' : formatPrice(COSTO_PRIO),
                                };
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setShippingType(type)}
                                        className={`p-3 border transition-all text-left rounded-2xl ${shippingType === type ? 'border-brand-orange bg-brand-orange/5' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-brand-card hover:border-zinc-400 dark:hover:border-zinc-500'}`}
                                    >
                                        <span className={`text-[10px] font-black uppercase italic ${shippingType === type ? 'text-brand-orange' : ''}`}>{labels[type]}</span>
                                        <p className="text-xs font-bold mt-1">{costMap[type]}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

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
                                            Tienes {puntosDisponibles} pts equivalentes a <span className="font-bold text-brand-orange">{formatPrice(descuentoMaximo)}</span>
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

                        {/* MÉTODO DE PAGO */}
                        <div className="mt-6 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Método de pago</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setPaymentMethod('mp')} className={`p-4 rounded-2xl border-2 text-left transition-all ${paymentMethod === 'mp' ? 'border-brand-blue bg-brand-blue/5 shadow-md' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'}`}>
                                    <ShieldCheck size={20} className="text-brand-blue mb-1" />
                                    <p className="text-xs font-black uppercase italic">Mercado Pago</p>
                                    <p className="text-[9px] text-zinc-500 font-medium">Tarjeta (Credito/Debito/Dinero en cuentas)</p>
                                </button>
                                <button type="button" onClick={() => setPaymentMethod('crypto')} className={`p-4 rounded-2xl border-2 text-left transition-all ${paymentMethod === 'crypto' ? 'border-brand-orange bg-brand-orange/5 shadow-md' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'}`}>
                                    <Bitcoin size={20} className="text-brand-orange mb-1" />
                                    <p className="text-xs font-black uppercase italic">Crypto</p>
                                    <p className="text-[9px] text-zinc-500 font-medium">USDT, BTC, ETH, USDC</p>
                                </button>
                            </div>
                            {paymentMethod === 'crypto' && minAmounts.length > 0 && (
                                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-[10px]">
                                    <p className="font-black uppercase text-yellow-600 dark:text-yellow-400 mb-1">⚠ Mínimo por red</p>
                                    <p className="text-zinc-500">Los pagos crypto requieren un monto mínimo por transacción según la red. Si tu pedido es menor, el monto se ajustará al mínimo.</p>
                                    {(() => {
                                        const totalUSD = finalTotal / (tasaUSD || 1200);
                                        const best = [...minAmounts].sort((a, b) => a.min - b.min)[0];
                                        const usable = minAmounts.filter(m => totalUSD >= m.min);
                                        return (
                                            <div className="mt-2 space-y-1">
                                                <p className="text-zinc-500">Tu pedido: <span className="font-bold text-zinc-700 dark:text-zinc-300">~USD {totalUSD.toFixed(2)}</span></p>
                                                {usable.length > 0 ? (
                                                    <p className="text-green-600 dark:text-green-400 font-bold">Podés pagar con {usable.map(m => m.coin === best.coin ? <span key={m.coin} className="underline">{m.coin.toUpperCase()}</span> : m.coin.toUpperCase()).join(', ')}</p>
                                                ) : (
                                                    <p className="text-yellow-600 dark:text-yellow-400 font-bold">El mínimo más bajo es <span className="underline">{best.coin.toUpperCase()}</span> (USD {best.min})</p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                            {paymentMethod === 'crypto' && (
                                <div className="mt-3">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Moneda</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'usdttrc20', label: 'USDT TRC20' },
                                            { id: 'usdc', label: 'USDC' },
                                            { id: 'btc', label: 'BTC' },
                                            { id: 'eth', label: 'ETH' },
                                            { id: 'ltc', label: 'LTC' },
                                            { id: 'sol', label: 'SOL' },
                                        ].map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setCryptoCurrency(c.id)}
                                                className={`p-2 rounded-xl border text-[10px] font-bold transition-all text-center ${cryptoCurrency === c.id ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'}`}
                                            >
                                                {c.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50 rounded-2xl shadow-xl shadow-brand-orange/20 active:scale-95"
                        >
                            {loading ? 'Procesando...' : (totalAbonar <= 0 ? 'Confirmar Pedido Gratis' : (paymentMethod === 'crypto' ? 'Pagar con Crypto' : 'Pagar con Mercado Pago'))} {paymentMethod === 'crypto' ? <Bitcoin size={20} /> : <ShieldCheck size={20} />}
                        </button>
                    </form>

                    {error && <p className="mt-4 text-red-500 font-bold italic uppercase text-xs text-center">{error}</p>}

                    {/* MODAL CRYPTO */}
                    {cryptoModal && (
                        <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-center items-start p-4 pt-24 md:pt-32 overflow-y-auto">
                            <div className="bg-white dark:bg-zinc-950 border border-brand-orange/20 p-4 sm:p-8 max-w-lg w-full shadow-2xl relative rounded-3xl overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange via-brand-orange to-transparent opacity-50"></div>

                                {cryptoModal.status === 'approved' ? (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CircleCheck size={48} className="text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase mb-2">¡Pago Recibido!</h3>
                                        <p className="text-sm text-zinc-500 font-medium">Redirigiendo a tu pedido...</p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Pagar con Crypto</h3>
                                        <p className="text-xs text-zinc-500 font-medium mb-6">Enviá el monto exacto a la dirección de abajo</p>

                                        <div className="space-y-4">
                                            <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-6 text-center">
                                                <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Monto a enviar</p>
                                                <p className="text-3xl font-black italic text-brand-orange">{parseFloat(cryptoModal.pay_amount).toFixed(6)} <span className="text-sm uppercase">{cryptoModal.pay_currency}</span></p>
                                                <p className="text-xs text-zinc-500 mt-1">USD {parseFloat(cryptoModal.price_amount).toFixed(2)}</p>
                                                <p className="text-[10px] text-zinc-500">≈ ${(parseFloat(cryptoModal.price_amount) * (cryptoModal.tasa_ars || 1200)).toLocaleString('es-AR')} ARS</p>
                                                {cryptoModal.total_ars && (
                                                    <p className="text-[9px] text-zinc-400 mt-1">Total del pedido: ${Number(cryptoModal.total_ars).toLocaleString('es-AR')} ARS <span className="text-yellow-500">(mínimo por red)</span></p>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-black uppercase text-zinc-500 mb-2">Dirección de depósito</p>
                                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-2xl p-4">
                                                    <code className="flex-1 text-xs font-mono break-all">{cryptoModal.pay_address}</code>
                                                    <button onClick={() => handleCopyAddress(cryptoModal.pay_address)} className="shrink-0 p-2 bg-brand-orange text-white rounded-xl hover:bg-orange-600 transition-all active:scale-95">
                                                        {copied ? <CircleCheck size={16} /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center rounded-2xl overflow-hidden">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${cryptoModal.pay_address}`} alt="QR" />
                                            </div>

                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-700">
                                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                    <Loader className="animate-spin shrink-0" size={14} />
                                                    <span className="font-medium italic">Esperando el pago... Esto puede tomar unos minutos</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={closeCryptoModal} className="flex-1 py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all rounded-2xl">
                                                    Cancelar
                                                </button>
                                                <a href={`https://nowpayments.io/payment/${cryptoModal.payment_id}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-brand-blue text-white font-black uppercase italic text-xs tracking-widest hover:bg-brand-orange transition-all rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95">
                                                    Ver en explorer <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-zinc-50 dark:bg-brand-card p-4 sm:p-10 h-fit sticky top-32 rounded-3xl shadow-lg border border-transparent dark:border-zinc-800">
                    <h2 className="text-xl font-black italic uppercase tracking-tight mb-8 flex items-center gap-3">
                        <MapPin size={20} className="text-brand-orange" /> Resumen
                    </h2>
                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-sm font-bold italic border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                <span>{item.cantidad}x {item.title}</span>
                                <span>{formatPrice(item.price * item.cantidad)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-xs font-black uppercase text-zinc-500 pt-2">
                            <span>Envío ({shippingType})</span>
                            <span className={costoEnvio === 0 ? "text-emerald-500" : "text-zinc-900 dark:text-white"}>
                                {esRetiro ? "GRATIS" : costoEnvio === 0 ? "¡GRATIS!" : `+${formatPrice(costoEnvio)}`}
                            </span>
                        </div>

                        {usePoints && descuentoAplicado > 0 && (
                            <div className="flex justify-between text-xs font-black uppercase text-green-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <span>Puntos VNTG aplicados</span>
                                <span>-{formatPrice(descuentoAplicado)}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 flex justify-between items-center text-2xl font-black italic">
                        <span>Total</span>
                        <span className="text-brand-orange">{formatPrice(totalAbonar)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
