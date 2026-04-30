import { Link } from 'react-router-dom';

export default function Inicio() {
    return (
        <div className="w-full bg-white dark:bg-brand-dark transition-colors duration-300">
            
            {/* 1. SECCIÓN HERO (El banner azul principal) */}
            <section className="bg-brand-blue py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-md">
                        Encuentra tu próximo <span className="text-brand-orange">TESORO</span>
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium leading-relaxed">
                        Piezas únicas, cómics graduados y figuras de edición limitada con autenticidad garantizada.
                    </p>
                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        <Link to="/categorias/marvel" className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all hover:scale-105">
                            Explorar Marvel
                        </Link>
                        <Link to="/contacto" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/30 px-8 py-3 rounded-full font-bold transition-all">
                            Saber más
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. SECCIÓN DE OFERTAS */}
            <section className="max-w-7xl mx-auto px-4 py-20">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <span className="text-brand-orange font-black uppercase tracking-widest text-xs">Coleccionables</span>
                        <h2 className="text-3xl font-black dark:text-white mt-1">
                            🔥 Ofertas del Día
                        </h2>
                    </div>
                    <Link to="/ofertas" className="text-brand-orange hover:text-orange-600 font-bold text-sm transition-colors border-b-2 border-transparent hover:border-brand-orange">
                        Ver todas →
                    </Link>
                </div>

                {/* Grid de Productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Tarjeta 1 */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-neutral-800 transition-all hover:-translate-y-2">
                        <div className="h-64 bg-gray-200 dark:bg-neutral-800 relative">
                            <div className="absolute top-4 left-4 bg-brand-orange text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                                30% OFF
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-gray-900 dark:text-white font-black text-xl mb-2">Carta Charizard 1ra Edición</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-brand-blue dark:text-brand-orange">$2.450</span>
                                <span className="text-sm text-gray-400 line-through font-bold">$3.500</span>
                            </div>
                            <button className="w-full mt-6 bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg">
                                Añadir al Carrito
                            </button>
                        </div>
                    </div>

                    {/* Tarjeta 2 */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-neutral-800 transition-all hover:-translate-y-2">
                        <div className="h-64 bg-gray-300 dark:bg-neutral-700 relative">
                            <div className="absolute top-4 left-4 bg-brand-orange text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                                NUEVO
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-gray-900 dark:text-white font-black text-xl mb-2">Batman Who Laughs #1</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-brand-blue dark:text-brand-orange">$120</span>
                            </div>
                            <button className="w-full mt-6 bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg">
                                Añadir al Carrito
                            </button>
                        </div>
                    </div>

                    {/* Tarjeta 3 */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-neutral-800 transition-all hover:-translate-y-2">
                        <div className="h-64 bg-gray-200 dark:bg-neutral-800 relative"></div>
                        <div className="p-6">
                            <h3 className="text-gray-900 dark:text-white font-black text-xl mb-2">Shelby Cobra 1965 (1:18)</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-brand-blue dark:text-brand-orange">$85</span>
                            </div>
                            <button className="w-full mt-6 bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg">
                                Añadir al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}