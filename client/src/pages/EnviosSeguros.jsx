import { Package, Truck, Shield, Clock } from 'lucide-react';

export default function EnviosSeguros() {
    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen text-zinc-900 dark:text-white font-sans transition-colors duration-300">
            {/* HERO HEADER */}
            <header className="py-24 bg-zinc-100 dark:bg-[#111111] border-b-[6px] border-brand-orange text-center px-4">
                <Package className="text-brand-blue mx-auto mb-6" size={60} />
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">Envíos Seguros</h1>
                <p className="text-brand-orange font-black uppercase tracking-[0.5em] text-xs md:text-sm">Logística de Élite</p>
            </header>

            <div className="max-w-[1200px] mx-auto px-6 py-20">
                <div className="bg-zinc-50 dark:bg-[#111111] p-5 sm:p-10 md:p-16 border border-zinc-200 dark:border-white/5 shadow-2xl space-y-12">
                    <p className="text-xl md:text-2xl font-black italic uppercase text-zinc-800 dark:text-zinc-200 border-l-4 border-brand-orange pl-6">
                        Como coleccionistas, sabemos que la caja importa tanto como la figura. Cuidamos tu tesoro desde nuestro almacén hasta tus manos.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-[#1a1a1a] p-5 sm:p-8 border border-zinc-200 dark:border-white/5 group hover:border-brand-orange transition-colors flex flex-col items-start">
                            <Shield size={36} className="text-brand-orange mb-6" />
                            <h3 className="text-xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">Embalaje Grado Coleccionista</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm leading-relaxed">
                                Utilizamos cajas de cartón corrugado de doble pared, plástico de burbujas premium y esquineros protectores para evitar cualquier daño durante el tránsito. Tus cómics se envían en sobres rígidos.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-[#1a1a1a] p-5 sm:p-8 border border-zinc-200 dark:border-white/5 group hover:border-brand-blue transition-colors flex flex-col items-start">
                            <Truck size={36} className="text-brand-blue mb-6" />
                            <h3 className="text-xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">Métodos de Envío</h3>
                            <ul className="text-zinc-600 dark:text-zinc-400 font-medium text-sm space-y-3 w-full">
                                <li className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2"><span className="font-black italic text-zinc-900 dark:text-white">Estándar</span> 3-5 días hábiles</li>
                                <li className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2"><span className="font-black italic text-zinc-900 dark:text-white">Express</span> 24-48 hs</li>
                                <li className="flex justify-between"><span className="font-black italic text-zinc-900 dark:text-white">Retiro</span> En Sucursal</li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-[#1a1a1a] p-5 sm:p-8 border border-zinc-200 dark:border-white/5 group hover:border-green-500 transition-colors flex flex-col items-start">
                            <Clock size={36} className="text-green-500 mb-6" />
                            <h3 className="text-xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">Tiempos de Proceso</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm leading-relaxed">
                                Todos los pedidos se procesan y despachan en un plazo máximo de 24 horas hábiles tras la confirmación del pago.
                            </p>
                        </div>
                    </div>

                    <div className="bg-zinc-900 dark:bg-white text-white dark:text-brand-dark p-5 sm:p-8 border-l-[8px] border-brand-blue flex flex-col justify-center items-center text-center">
                        <p className="text-2xl md:text-3xl font-black italic uppercase mb-2">100% Asegurados</p>
                        <p className="font-bold tracking-widest text-xs md:text-sm uppercase text-zinc-400 dark:text-zinc-600">Si el paquete se pierde o llega dañado, nosotros nos hacemos cargo.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}