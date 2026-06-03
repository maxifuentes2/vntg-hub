import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShieldCheck, MapPin, ArrowLeft, Star, Plus, House, Briefcase, Copy, CircleCheck, Loader, Bitcoin, Clock, AlertTriangle, Pencil, X } from 'lucide-react';
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
    const [timeLeft, setTimeLeft] = useState(null);
    const [expired, setExpired] = useState(false);
    const timerRef = useRef(null);

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const [shipping, setShipping] = useState({
        nombre: '', direccion: '', ciudad: '', provincia: '', codigoPostal: '', telefono: '', dni: ''
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
            telefono: parsed.phone || '',
            dni: parsed.dni || ''
        });

        if (cart.length === 0 && !checkoutSent) navigate('/');

        refreshCartPrices(API_URL);
    }, [cart.length, navigate, checkoutSent]);

    useEffect(() => {
        const token = localStorage.getItem('vntg_token');
        if (!token) return;

        // Traer datos frescos del usuario (incluyendo puntos actualizados)
        fetch(`${API_URL}/api/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : null)
            .then(freshUser => {
                if (freshUser) {
                    setUser(freshUser);
                    localStorage.setItem('vntg_user', JSON.stringify(freshUser));
                }
            })
            .catch(console.error);

        const storedUser = localStorage.getItem('vntg_user');
        const name = storedUser ? JSON.parse(storedUser).name || '' : '';
        const userData = storedUser ? JSON.parse(storedUser) : null;

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
                        telefono: defaultAddr.phone || '',
                        dni: userData?.dni || ''
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

    useEffect(() => {
        if (cryptoModal?.expires_at && cryptoModal.status !== 'approved') {
            const expires = new Date(cryptoModal.expires_at).getTime();
            const tick = () => {
                const now = Date.now();
                const diff = Math.max(0, Math.floor((expires - now) / 1000));
                setTimeLeft(diff);
                if (diff <= 0) {
                    setExpired(true);
                    clearInterval(timerRef.current);
                }
            };
            tick();
            timerRef.current = setInterval(tick, 1000);
            return () => clearInterval(timerRef.current);
        } else {
            setTimeLeft(null);
            setExpired(false);
        }
    }, [cryptoModal?.expires_at, cryptoModal?.status]);

    const applyAddress = (addr) => {
        setShipping({
            nombre: userName,
            direccion: addr.address || '',
            ciudad: addr.city || '',
            provincia: addr.province || '',
            codigoPostal: addr.zip_code || '',
            telefono: addr.phone || '',
            dni: shipping.dni || ''
        });
        setSelectedAddressId(addr.id);
        setShowManualForm(false);
    };

    const handleUseManual = () => {
        setSelectedAddressId(null);
        setShowManualForm(true);
    };

    const handleEditAddress = (addr, e) => {
        e.stopPropagation();
        setEditingAddress({ ...addr });
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('vntg_token');
            const res = await fetch(`${API_URL}/api/addresses/${editingAddress.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editingAddress),
            });
            if (res.ok) {
                const updated = await res.json();
                setAddresses(prev => prev.map(a => a.id === updated.id ? updated : a));
                if (selectedAddressId === updated.id) {
                    setShipping(prev => ({
                        ...prev,
                        direccion: updated.address || '',
                        ciudad: updated.city || '',
                        provincia: updated.province || '',
                        codigoPostal: updated.zip_code || '',
                        telefono: updated.phone || '',
                    }));
                }
                setEditingAddress(null);
                addToast({}, 'Dirección actualizada', 'success');
            } else {
                addToast({}, 'Error al actualizar dirección', 'error');
            }
        } catch {
            addToast({}, 'Error al actualizar dirección', 'error');
        }
    };

    const puntosDisponibles = user?.points || 0;
    const valorPorPunto = 10;
    const descuentoMaximo = puntosDisponibles * valorPorPunto;

    const puntosNecesarios = Math.ceil(finalTotal / valorPorPunto);
    const puntosMaximos = Math.min(puntosDisponibles, puntosNecesarios);
    const puntosARestar = usePoints ? puntosMaximos : 0;
    const descuentoAplicado = puntosARestar * valorPorPunto;
    const totalAbonar = Math.max(0, finalTotal - descuentoAplicado);

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
            } catch (e) { console.error("Crypto poll error:", e) }
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
                    puntosAUsar: puntosARestar,
                    payCurrency: cryptoCurrency,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            const data = await res.json();

            if (res.ok) {
                if (puntosARestar > 0) {
                    const updatedUser = { ...user, points: Math.max(0, puntosDisponibles - puntosARestar) };
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
        clearInterval(timerRef.current);
        setCryptoModal(null);
        setTimeLeft(null);
        setExpired(false);
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
                                        <div
                                            key={addr.id}
                                            className={`relative text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-brand-orange bg-brand-orange/5 shadow-md'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-brand-card hover:border-zinc-400 dark:hover:border-zinc-500'
                                            }`}
                                            onClick={() => applyAddress(addr)}
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
                                            <button
                                                type="button"
                                                onClick={(e) => handleEditAddress(addr, e)}
                                                className="absolute bottom-2 right-2 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500 hover:text-brand-orange hover:bg-brand-orange/10 transition-all"
                                                title="Editar dirección"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={handleUseManual}
                                    className={`text-left p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 min-h-[120px] ${
                                        showManualForm && !selectedAddressId
                                            ? 'border-brand-orange bg-brand-orange/5'
                                            : 'border-zinc-300 dark:border-zinc-600 hover:border-brand-orange text-zinc-400 hover:text-brand-orange'
                                    }`}
                                >
                                    <Plus size={24} />
                                    <span className="text-xs font-black uppercase italic">Otra Dirección</span>
                                </button>
                            </div>

                            {/* Resumen de dirección seleccionada */}
                            {selectedAddressId && !showManualForm && (() => {
                                const sel = addresses.find(a => a.id === selectedAddressId);
                                if (!sel) return null;
                                return (
                                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-400 mb-1">Dirección de envío</p>
                                        <p className="text-sm font-bold">{sel.address}</p>
                                        <p className="text-xs text-zinc-500">{sel.city}, {sel.province} - {sel.zip_code}</p>
                                        <p className="text-xs text-zinc-500">{sel.phone}</p>
                                    </div>
                                );
                            })()}
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
                        <div className="grid grid-cols-3 max-[360px]:grid-cols-1 gap-2 sm:gap-3">
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
                        {!esRetiro && (addresses.length === 0 || showManualForm || !selectedAddressId) && (
                            <div className="space-y-4">
                                <div className="flex max-[360px]:flex-col gap-4">
                                    <input type="text" placeholder="DIRECCIÓN" value={shipping.direccion} onChange={e => setShipping({ ...shipping, direccion: e.target.value })} required className="w-2/3 max-[360px]:w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                    <input type="text" placeholder="CP" value={shipping.codigoPostal} onChange={e => setShipping({ ...shipping, codigoPostal: e.target.value })} required className="w-1/3 max-[360px]:w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                </div>
                                <div className="flex max-[360px]:flex-col gap-4">
                                    <input type="text" placeholder="CIUDAD" value={shipping.ciudad} onChange={e => setShipping({ ...shipping, ciudad: e.target.value })} required className="w-1/2 max-[360px]:w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                    <input type="text" placeholder="PROVINCIA" value={shipping.provincia} onChange={e => setShipping({ ...shipping, provincia: e.target.value })} required className="w-1/2 max-[360px]:w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                </div>
                            </div>
                        )}
                        <input
                            type="tel"
                            placeholder="TELÉFONO"
                            value={shipping.telefono}
                            onChange={e => setShipping({ ...shipping, telefono: e.target.value })}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner"
                        />
                        <input
                            type="text"
                            placeholder="DNI / CUIT (facturación)"
                            value={shipping.dni}
                            onChange={e => setShipping({ ...shipping, dni: e.target.value })}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold focus:border-brand-orange outline-none rounded-xl shadow-inner"
                        />

                        {puntosDisponibles > 0 && (
                            <div className="mt-6 p-5 bg-brand-orange/10 border border-brand-orange/30 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-brand-orange text-white p-2 rounded-full">
                                        <Star size={20} className="fill-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black italic uppercase text-sm">Puntos VNTG</h3>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
                                            Tenés <span className="font-bold text-brand-orange">{puntosDisponibles.toLocaleString('es-AR')} pts</span> ({formatPrice(descuentoMaximo)} de descuento)
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer gap-3">
                                    <input
                                        type="checkbox"
                                        checked={usePoints}
                                        onChange={(e) => setUsePoints(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                                    <span className="text-xs font-bold italic text-zinc-600 dark:text-zinc-400">
                                        {usePoints
                                            ? `Canjeando ${puntosARestar} pts (${formatPrice(descuentoAplicado)})`
                                            : `Canjear hasta ${puntosMaximos} pts (${formatPrice(descuentoMaximo)})`
                                        }
                                    </span>
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
                                                    <p className="text-green-600 dark:text-green-400 font-bold">
                                                        Podés pagar con {usable.map((m, i) => (
                                                            <span key={m.coin}>{i > 0 && <span>, </span>}{m.coin === best.coin ? <span className="underline">{m.coin.toUpperCase()}</span> : m.coin.toUpperCase()}</span>
                                                        ))}
                                                    </p>
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
                                    <div className="grid grid-cols-3 max-[360px]:grid-cols-2 gap-2">
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
                                                <p className="text-3xl max-[360px]:text-xl font-black italic text-brand-orange break-all">{parseFloat(cryptoModal.pay_amount).toFixed(6)} <span className="text-sm uppercase">{cryptoModal.pay_currency}</span></p>
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
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${cryptoModal.pay_address}`} alt="QR" className="max-w-full h-auto" />
                                            </div>

                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-700">
                                                {expired ? (
                                                    <div className="flex items-center gap-3 text-xs text-red-500">
                                                        <AlertTriangle className="shrink-0" size={14} />
                                                        <span className="font-bold italic">Tiempo expirado. Cancelá y volvé a intentar.</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                            <Loader className="animate-spin shrink-0" size={14} />
                                                            <span className="font-medium italic">Esperando el pago... Esto puede tomar unos minutos</span>
                                                        </div>
                                                        {timeLeft !== null && (
                                                            <div className={`flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest ${timeLeft <= 120 ? 'text-red-500' : 'text-zinc-500'}`}>
                                                                <Clock size={14} />
                                                                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={closeCryptoModal} className="w-full py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all rounded-2xl">
                                                    Cancelar
                                                </button>
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

                        {puntosARestar > 0 && (
                            <div className="flex justify-between text-xs font-black uppercase text-green-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <span>Puntos VNTG: -{puntosARestar} pts</span>
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

            {/* MODAL EDITAR DIRECCIÓN */}
            {editingAddress && (
                <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-center items-start p-4 pt-24 md:pt-32 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-8 max-w-md w-full shadow-2xl relative rounded-3xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange via-brand-orange to-transparent opacity-50"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black italic uppercase">Editar Dirección</h3>
                            <button onClick={() => setEditingAddress(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAddress} className="space-y-4">
                            <input type="text" placeholder="ETIQUETA (Casa, Trabajo...)" value={editingAddress.tag || ''} onChange={e => setEditingAddress({ ...editingAddress, tag: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold italic text-sm focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                            <input type="text" placeholder="DIRECCIÓN" value={editingAddress.address || ''} onChange={e => setEditingAddress({ ...editingAddress, address: e.target.value })} required className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold italic text-sm focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                            <div className="flex max-[360px]:flex-col gap-4">
                                <input type="text" placeholder="CIUDAD" value={editingAddress.city || ''} onChange={e => setEditingAddress({ ...editingAddress, city: e.target.value })} required className="w-1/2 max-[360px]:w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold italic text-sm focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                <input type="text" placeholder="PROVINCIA" value={editingAddress.province || ''} onChange={e => setEditingAddress({ ...editingAddress, province: e.target.value })} required className="w-1/2 max-[360px]:w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold italic text-sm focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                            </div>
                            <div className="flex max-[360px]:flex-col gap-4">
                                <input type="text" placeholder="CP" value={editingAddress.zip_code || ''} onChange={e => setEditingAddress({ ...editingAddress, zip_code: e.target.value })} required className="w-1/3 max-[360px]:w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold italic text-sm focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                                <input type="tel" placeholder="TELÉFONO" value={editingAddress.phone || ''} onChange={e => setEditingAddress({ ...editingAddress, phone: e.target.value })} required className="w-2/3 max-[360px]:w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-4 max-[360px]:p-3 font-bold italic text-sm focus:border-brand-orange outline-none rounded-xl shadow-inner" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingAddress(null)} className="flex-1 py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all rounded-2xl">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 bg-brand-orange text-white font-black uppercase italic text-xs tracking-widest hover:bg-orange-600 transition-all rounded-2xl shadow-lg active:scale-95">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
