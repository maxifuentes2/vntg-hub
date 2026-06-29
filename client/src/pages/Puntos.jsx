// IMPORTACIONES
import { Star, ShoppingCart, Gift, TrendingUp, ShieldCheck } from 'lucide-react';

export default function Puntos() {
    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen text-zinc-900 dark:text-white font-sans transition-colors duration-300">
            {/* HERO HEADER */}
            <header className="py-24 bg-white dark:bg-brand-dark border-b border-brand-orange/30 text-center px-4">
                <Star className="text-brand-orange mx-auto mb-6" size={60} />
                <h1 className="text-3xl max-[400px]:text-2xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">Puntos VNTG</h1>
                <p className="text-brand-blue font-black uppercase tracking-[0.5em] text-xs md:text-sm">Sumá y ahorrá en cada compra</p>
            </header>

            <div className="max-w-[1200px] mx-auto px-6 py-20 space-y-16">
                <div className="bg-zinc-50 dark:bg-[#111111] p-5 sm:p-10 md:p-16 shadow-2xl rounded-3xl">
                    <p className="text-lg md:text-xl font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed mb-12">
                        En <span className="font-black italic text-brand-blue uppercase">VNTG HUB</span>, cada compra te acerca a tu próximo coleccionable. Acumulá puntos y canjealos por descuentos reales.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-brand-card p-5 sm:p-8 group hover:border-brand-blue rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <ShoppingCart className="text-brand-blue mb-6" size={40} />
                            <h3 className="text-2xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">1. Comprá</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                                Cada vez que realizás una compra en nuestra tienda, acumulás puntos automáticamente sobre el total de tu pedido.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-brand-card p-5 sm:p-8 group hover:border-brand-orange rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <Star className="text-brand-orange mb-6" size={40} />
                            <h3 className="text-2xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">2. Acumulá</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                                Tus puntos se acreditan automáticamente cuando tu pedido pasa a estado "aprobado". Consultá tu saldo en cualquier momento desde tu perfil.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-brand-card p-5 sm:p-8 group hover:border-green-500 rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <Gift className="text-green-500 mb-6" size={40} />
                            <h3 className="text-2xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">3. Canjeá</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                                <span className="font-black text-zinc-900 dark:text-white">1 PTS = $10 ARS de descuento.</span> Usá tus puntos al momento de pagar para obtener un descuento directo sobre el total de tu compra.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-brand-card p-5 sm:p-8 group hover:border-purple-500 rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <TrendingUp className="text-purple-500 mb-6" size={40} />
                            <h3 className="text-2xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">Beneficios Exclusivos</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                                Los puntos no tienen fecha de vencimiento. Además, los miembros frecuentes acceden a promos especiales y multiplicadores de puntos en fechas seleccionadas.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-brand-blue text-white p-5 sm:p-8 md:p-12 border-l-[10px] border-brand-orange shadow-2xl flex flex-col md:flex-row items-center gap-8 rounded-2xl">
                    <ShieldCheck size={60} className="shrink-0 text-brand-orange" />
                    <div>
                        <h3 className="text-2xl font-black italic uppercase mb-2">Sin límites</h3>
                        <p className="font-medium text-lg">
                            No hay monto mínimo de canje. Usá tus puntos cuando quieras, en lo que quieras. Mientras más comprás, más ahorrás.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
