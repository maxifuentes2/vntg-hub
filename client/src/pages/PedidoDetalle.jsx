import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Truck, CircleCheck, House, MapPin, Loader, ExternalLink, Clock, Store, CreditCard, Bitcoin, Copy, X, AlertTriangle, XCircle } from 'lucide-react';
import { slugify } from '../utils/slugify';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const estadosEnvio = [
    { key: 'pending', label: 'Pendiente', icon: Clock, bg: 'bg-yellow-500' },
    { key: 'approved', label: 'Aprobado', icon: CircleCheck, bg: 'bg-green-500' },
    { key: 'preparing', label: 'En Preparación', icon: Package, bg: 'bg-brand-orange' },
    { key: 'shipped', label: 'Enviado', icon: Truck, bg: 'bg-blue-500' },
    { key: 'delivered', label: 'Entregado', icon: House, bg: 'bg-purple-500' },
    { key: 'cancelled', label: 'Cancelado', icon: XCircle, bg: 'bg-red-500' },
];

const estadosRetiro = [
    { key: 'pending', label: 'Pendiente', icon: Clock, bg: 'bg-yellow-500' },
    { key: 'approved', label: 'Aprobado', icon: CircleCheck, bg: 'bg-green-500' },
    { key: 'preparing', label: 'En Preparación', icon: Package, bg: 'bg-brand-orange' },
    { key: 'ready', label: 'Listo para Retirar', icon: Store, bg: 'bg-teal-500' },
    { key: 'cancelled', label: 'Cancelado', icon: XCircle, bg: 'bg-red-500' },
];

export default function PedidoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const { formatPrice, tasaUSD } = useCurrency();
    const [retrying, setRetrying] = useState(false);
    const [cryptoRetry, setCryptoRetry] = useState(null);
    const [retryingCrypto, setRetryingCrypto] = useState(false);
    const [copied, setCopied] = useState(false);
    const [cryptoCurrency, setCryptoCurrency] = useState('usdttrc20');
    const [showCryptoModal, setShowCryptoModal] = useState(false);
    const [minAmounts, setMinAmounts] = useState([]);
    const [timeLeft, setTimeLeft] = useState(null);
    const [expired, setExpired] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('vntg_user'));
        if (!user) {
            navigate('/login');
            return;
        }

        const token = localStorage.getItem('vntg_token');
        fetch(`${API_URL}/api/orders/detail/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("No encontrado");
                return res.json();
            })
            .then(data => {
                if (data.user_id !== user.id) {
                    navigate('/perfil');
                } else {
                    setPedido(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id, navigate]);

    useEffect(() => {
        if (pedido && pedido.id) {
            document.title = `VNTG HUB - Orden #${pedido.id.slice(0, 8)}`;
        }
    }, [pedido]);

    useEffect(() => {
        fetch(`${API_URL}/api/crypto/min-amounts`)
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.mins) setMinAmounts(data.mins); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (cryptoRetry?.expires_at) {
            const expires = new Date(cryptoRetry.expires_at).getTime();
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
    }, [cryptoRetry?.expires_at]);

    useEffect(() => {
        if (!pedido || pedido.status !== 'pending') return;
        const token = localStorage.getItem('vntg_token');
        const interval = setInterval(() => {
            fetch(`${API_URL}/api/orders/detail/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => { if (data && data.status !== 'pending') setPedido(data); })
                .catch(() => {});
        }, 5000);
        return () => clearInterval(interval);
    }, [pedido, id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark"><Loader className="animate-spin text-brand-orange" size={40} /></div>;
    if (!pedido) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark font-black italic uppercase tracking-widest text-zinc-500">Orden no encontrada</div>;

    const infoEnvio = pedido.shipping_info ? JSON.parse(pedido.shipping_info) : {};
    const esRetiro = infoEnvio.shippingType === 'retiro';
    const estados = esRetiro ? estadosRetiro : estadosEnvio;
    const currentIndex = estados.findIndex(e => e.key === pedido.status);
    const progressWidth = currentIndex < 0 ? 0 : (currentIndex / (estados.length - 1)) * 100;

    const handleRetryPayment = async () => {
        setRetrying(true);
        const token = localStorage.getItem('vntg_token');
        try {
            const res = await fetch(`${API_URL}/api/orders/${pedido.id}/retry-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.init_point) {
                window.location.href = data.init_point;
            } else {
                alert(data.error || "Error al generar el pago");
                setRetrying(false);
            }
        } catch {
            alert("Error de conexión");
            setRetrying(false);
        }
    };

    const handleRetryCrypto = async () => {
        setRetryingCrypto(true);
        const token = localStorage.getItem('vntg_token');
        try {
            const res = await fetch(`${API_URL}/api/orders/${pedido.id}/retry-crypto-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ payCurrency: cryptoCurrency }),
            });
            const data = await res.json();
            if (res.ok && data.crypto) {
            setCryptoRetry(data.crypto);
            setRetryingCrypto(false);
            const interval = handleCryptoRetryPoll(pedido.id);
            setCryptoRetry(prev => ({ ...prev, pollInterval: interval }));
        } else {
                alert(data.error || "Error al generar pago crypto");
                setRetryingCrypto(false);
            }
        } catch {
            alert("Error de conexión");
            setRetryingCrypto(false);
        }
    };

    const handleCryptoRetryPoll = (orderId) => {
        const token = localStorage.getItem('vntg_token');
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/api/crypto/payment/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.status === 'approved') {
                    clearInterval(interval);
                    setCryptoRetry(null);
                    setShowCryptoModal(false);
                    window.location.reload();
                }
            } catch {}
        }, 5000);
        return interval;
    };

    const handleCopyAddress = (address) => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-zinc-50 dark:bg-brand-dark min-h-screen pt-32 pb-20 px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[800px] mx-auto">
                <button onClick={() => navigate('/perfil')} className="flex items-center gap-2 text-zinc-400 hover:text-brand-orange mb-8 font-black text-[10px] uppercase tracking-[0.3em] transition-colors">
                    <ChevronLeft size={18} /> Volver a mi cuenta
                </button>
                <div className="mb-12">
                    <h1 className="text-2xl max-[400px]:text-xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Orden #{pedido.id.slice(0,8)}</h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Fecha de compra: {new Date(pedido.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })} (Hora ARG)</p>
                </div>

                {/* MAPA DE ESTADO (TIMELINE) */}
                <div className="relative overflow-hidden rounded-3xl shadow-lg mb-8  bg-zinc-50 dark:bg-brand-card">
                    <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-10 sm:pb-14">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] mb-8 flex items-center gap-2 text-brand-orange">
                            {esRetiro ? <Store size={16} /> : <Truck size={16} />}
                            {esRetiro ? 'Estado del Retiro' : 'Estado del Envío'}
                        </h2>

                        {pedido.status === 'pending' && !pedido.payment_id ? (
                            <div>
                                <div className="flex items-center gap-4 p-6 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl">
                                    <Clock size={24} className="text-brand-orange shrink-0 animate-pulse" />
                                    <div>
                                        <p className="text-sm font-black italic uppercase text-brand-orange">Esperando confirmación de pago</p>
                                        <p className="text-xs text-zinc-500 mt-1">El estado se actualizará automáticamente cuando se confirme la transacción.</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowCryptoModal(true)}
                                        className="w-full flex items-center justify-center gap-2 bg-brand-orange text-white px-6 py-4 rounded-2xl text-sm font-black uppercase italic hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                                    >
                                        <Bitcoin size={20} />
                                        Reintentar Pago Crypto
                                    </button>
                                    <button
                                        onClick={handleRetryPayment}
                                        disabled={retrying}
                                        className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white px-6 py-4 rounded-2xl text-sm font-black uppercase italic hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                                    >
                                        {retrying ? <Loader className="animate-spin" size={20} /> : <CreditCard size={20} />}
                                        {retrying ? "Generando link..." : "Reintentar Pago con Mercado Pago"}
                                    </button>
                                </div>
                            </div>
                        ) : pedido.status === 'cancelled' ? (
                            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <XCircle size={24} className="text-red-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-black italic uppercase text-red-500">Pago rechazado</p>
                                        <p className="text-xs text-zinc-500 mt-1">El pago no pudo procesarse. Podés intentar de nuevo con otro método.</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowCryptoModal(true)}
                                        className="w-full flex items-center justify-center gap-2 bg-brand-orange text-white px-6 py-4 rounded-2xl text-sm font-black uppercase italic hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                                    >
                                        <Bitcoin size={20} />
                                        Reintentar Pago Crypto
                                    </button>
                                    <button
                                        onClick={handleRetryPayment}
                                        disabled={retrying}
                                        className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white px-6 py-4 rounded-2xl text-sm font-black uppercase italic hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                                    >
                                        {retrying ? <Loader className="animate-spin" size={20} /> : <CreditCard size={20} />}
                                        {retrying ? "Generando link..." : "Reintentar Pago con Mercado Pago"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative flex max-[360px]:flex-col max-[360px]:gap-3 justify-between items-center">
                                <div className="absolute left-0 max-[360px]:hidden top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 dark:bg-zinc-700 z-0 rounded-full"></div>
                                <div
                                    className="absolute left-0 max-[360px]:hidden top-1/2 -translate-y-1/2 h-1 z-0 bg-brand-orange rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressWidth}%` }}
                                ></div>

                                {estados.map((estado, idx) => {
                                    const isCompleted = idx <= currentIndex;
                                    const isCurrent = idx === currentIndex;
                                    const Icon = estado.icon;

                                    return (
                                        <div key={estado.key} className="relative z-10 flex flex-col max-[360px]:flex-row items-center gap-3 max-[360px]:gap-4">
                                            <div className={`w-8 xs:w-12 h-8 xs:h-12 rounded-full flex items-center justify-center border-2 xs:border-4 transition-all duration-500 ${isCompleted ? `${estado.bg} border-white dark:border-brand-dark text-white shadow-lg scale-110` : 'bg-zinc-200 dark:bg-brand-card border-zinc-50 dark:border-brand-dark text-zinc-400'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase italic tracking-wider absolute -bottom-6 xs:-bottom-8 max-[360px]:static max-[360px]:text-left whitespace-nowrap max-[360px]:whitespace-normal ${isCurrent ? 'text-brand-orange' : (isCompleted ? 'text-zinc-900 dark:text-white' : 'text-zinc-400')}`}>
                                                {estado.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* SECCIÓN DE TRACKING */}
                        {pedido.trackingNumber && !esRetiro && (
                            <div className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Código de Seguimiento</p>
                                    <p className="text-lg font-bold italic text-brand-orange">{pedido.trackingNumber}</p>
                                </div>
                                <a href="https://www.correoargentino.com.ar/formularios/e-commerce" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 text-xs font-black uppercase italic hover:bg-brand-orange transition-all rounded-lg shadow-lg active:scale-95">
                                    Rastrear <ExternalLink size={14} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* DETALLES DE COMPRA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ARTÍCULOS */}
                    <div className="bg-zinc-50 dark:bg-brand-card  p-4 sm:p-8 rounded-2xl shadow-sm">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2"><Package size={14} className="text-brand-orange"/> Productos</h2>
                        <div className="space-y-4">
                            {pedido.items?.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-zinc-50 dark:bg-black rounded-lg p-2 flex items-center justify-center border border-white/5">
                                        <img src={item.images} alt={item.title} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <Link to={`/producto/${slugify(item.title)}`} className="text-sm font-bold uppercase italic hover:text-brand-orange transition-colors line-clamp-1">{item.title}</Link>
                                        <p className="text-xs text-zinc-500 font-bold mt-1">{item.quantity} x {formatPrice(item.price)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Pagado</span>
                            <span className="text-2xl font-black italic text-brand-orange">{formatPrice(pedido.total)}</span>
                        </div>
                    </div>

                    {/* DIRECCIÓN / RETIRO */}
                    <div className="bg-zinc-50 dark:bg-brand-card  p-4 sm:p-8 rounded-2xl shadow-sm h-fit">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] mb-6 flex items-center gap-2 text-zinc-500">
                            {esRetiro ? <Store size={14} className="text-brand-orange" /> : <MapPin size={14} className="text-brand-orange" />}
                            {esRetiro ? 'Retiro en Local' : 'Envío'}
                        </h2>
                        {esRetiro ? (
                            <div className="space-y-3">
                                <div className="bg-brand-orange/5 border border-brand-orange/20 p-4 rounded-xl">
                                    <Store size={20} className="text-brand-orange mb-2" />
                                    <p className="text-sm font-bold">Pasá a retirar tu pedido por nuestro local cuando recibas la notificación de que está listo.</p>
                                </div>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Nombre:</span> {infoEnvio.nombre}</p>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Teléfono:</span> {infoEnvio.telefono}</p>
                                {infoEnvio.dni && <p className="text-sm font-bold"><span className="text-zinc-500">DNI/CUIT:</span> {infoEnvio.dni}</p>}

                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm font-bold"><span className="text-zinc-500">Nombre:</span> {infoEnvio.nombre} {infoEnvio.apellido}</p>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Dirección:</span> {infoEnvio.direccion}, {infoEnvio.ciudad}</p>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Provincia:</span> {infoEnvio.provincia} ({infoEnvio.codigoPostal})</p>
                                <p className="text-sm font-bold"><span className="text-zinc-500">Teléfono:</span> {infoEnvio.telefono}</p>
                                {infoEnvio.dni && <p className="text-sm font-bold"><span className="text-zinc-500">DNI/CUIT:</span> {infoEnvio.dni}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL CRYPTO */}
            {showCryptoModal && (
                <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-center items-start p-4 pt-24 md:pt-32 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-brand-orange/20 p-4 sm:p-8 max-w-lg w-full shadow-2xl relative rounded-3xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange via-brand-orange to-transparent opacity-50"></div>
                        <button onClick={() => { if (cryptoRetry?.pollInterval) clearInterval(cryptoRetry.pollInterval); setShowCryptoModal(false); setCryptoRetry(null); setRetryingCrypto(false); }} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors z-10">
                            <X size={20} />
                        </button>

                        {!cryptoRetry ? (
                            <>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Pagar con Crypto</h3>
                                <p className="text-xs text-zinc-500 font-medium mb-3">Seleccioná la moneda para el pago</p>
                                {minAmounts.length > 0 && pedido && (() => {
                                    const totalUSD = Number(pedido.total) / (tasaUSD || 1200);
                                    const best = [...minAmounts].sort((a, b) => a.min - b.min)[0];
                                    const usable = minAmounts.filter(m => totalUSD >= m.min);
                                    return (
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-[10px] mb-4">
                                            <p className="font-black uppercase text-yellow-600 dark:text-yellow-400 mb-1">⚠ Mínimo por red</p>
                                            <p className="text-zinc-500">Los pagos crypto requieren un monto mínimo por transacción según la red.</p>
                                            <div className="mt-2 space-y-1">
                                                <p className="text-zinc-500">Tu pedido: <span className="font-bold text-zinc-700 dark:text-zinc-300">~USD {totalUSD.toFixed(2)}</span></p>
                                                {usable.length > 0 ? (
                                                    <p className="text-green-600 dark:text-green-400 font-bold">Podés pagar con {usable.map((m, i) => <span key={m.coin}>{i > 0 && ', '}{m.coin === best.coin ? <span className="underline">{m.coin.toUpperCase()}</span> : m.coin.toUpperCase()}</span>)}</p>
                                                ) : (
                                                    <p className="text-yellow-600 dark:text-yellow-400 font-bold">El mínimo más bajo es <span className="underline">{best.coin.toUpperCase()}</span> (USD {best.min})</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="grid grid-cols-3 max-[360px]:grid-cols-2 gap-2 mb-6">
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
                                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${cryptoCurrency === c.id ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'}`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleRetryCrypto}
                                    disabled={retryingCrypto}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-orange text-white px-6 py-4 rounded-2xl text-sm font-black uppercase italic hover:bg-orange-600 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                                >
                                    {retryingCrypto ? <Loader className="animate-spin" size={20} /> : <Bitcoin size={20} />}
                                    {retryingCrypto ? "Generando pago..." : "Generar Pago"}
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Pagar con Crypto</h3>
                                <p className="text-xs text-zinc-500 font-medium mb-6">Enviá el monto exacto a la dirección de abajo</p>
                                <div className="space-y-4">
                                    <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-6 text-center">
                                        <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Monto a enviar</p>
                                        <p className="text-3xl max-[360px]:text-xl font-black italic text-brand-orange break-all">{parseFloat(cryptoRetry.pay_amount).toFixed(6)} <span className="text-sm uppercase">{cryptoRetry.pay_currency}</span></p>
                                        <p className="text-xs text-zinc-500 mt-1">USD {parseFloat(cryptoRetry.price_amount).toFixed(2)}</p>
                                        <p className="text-[10px] text-zinc-500">≈ ${(parseFloat(cryptoRetry.price_amount) * (cryptoRetry.tasa_ars || 1200)).toLocaleString('es-AR')} ARS</p>
                                        {cryptoRetry.total_ars && (
                                            <p className="text-[9px] text-zinc-400 mt-1">Total del pedido: ${Number(cryptoRetry.total_ars).toLocaleString('es-AR')} ARS <span className="text-yellow-500">(mínimo por red)</span></p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-zinc-500 mb-2">Dirección de depósito</p>
                                        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-2xl p-4">
                                            <code className="flex-1 text-xs font-mono break-all">{cryptoRetry.pay_address}</code>
                                            <button onClick={() => handleCopyAddress(cryptoRetry.pay_address)} className="shrink-0 p-2 bg-brand-orange text-white rounded-xl hover:bg-orange-600 transition-all active:scale-95">
                                                {copied ? <CircleCheck size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center rounded-2xl overflow-hidden">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${cryptoRetry.pay_address}`} alt="QR" className="max-w-full h-auto" />
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
                                    <button
                                        onClick={() => { if (cryptoRetry?.pollInterval) clearInterval(cryptoRetry.pollInterval); clearInterval(timerRef.current); setCryptoRetry(null); setRetryingCrypto(false); setTimeLeft(null); setExpired(false); }}
                                        className="w-full flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white px-6 py-4 rounded-2xl text-sm font-black uppercase italic hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all active:scale-95"
                                    >
                                        Elegir otra moneda
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
