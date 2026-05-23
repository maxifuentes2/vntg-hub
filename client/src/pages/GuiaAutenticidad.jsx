import { ShieldCheck, Search, Award, FileText } from 'lucide-react';

export default function GuiaAutenticidad() {
    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen text-zinc-900 dark:text-white font-sans transition-colors duration-300">
            {/* HERO HEADER */}
            <header className="py-24 bg-white dark:bg-brand-dark border-b border-brand-orange/30 text-center px-4">
                    <ShieldCheck className="text-brand-orange mx-auto mb-6" size={60} />
                    <h1 className="text-3xl max-[400px]:text-2xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">Autenticidad</h1>
                    <p className="text-brand-blue font-black uppercase tracking-[0.5em] text-xs md:text-sm">Coleccionismo Verificado</p>
            </header>

            <div className="max-w-[1200px] mx-auto px-6 py-20 space-y-16">
                <div className="bg-zinc-50 dark:bg-[#111111] p-5 sm:p-10 md:p-16 shadow-2xl rounded-3xl">
                    <p className="text-lg md:text-xl font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed mb-12">
                        En <span className="font-black italic text-brand-blue uppercase">VNTG HUB</span>, sabemos que el valor de un coleccionable reside en su autenticidad. Por eso, cada pieza que ingresa a nuestro catálogo pasa por un riguroso proceso de verificación.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-brand-card p-5 sm:p-8 group hover:border-brand-blue rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <Search className="text-brand-blue mb-6" size={40} />
                            <h3 className="text-2xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">1. Inspección Experta</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                                Nuestro equipo de curadores revisa cada artículo al detalle: materiales, marcas de fábrica, estado de conservación y consistencia histórica.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-brand-card p-5 sm:p-8 group hover:border-brand-orange rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <Award className="text-brand-orange mb-6" size={40} />
                            <h3 className="text-2xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">2. Agencias Oficiales</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                                Trabajamos con artículos graduados por las mejores agencias del mundo (CGC para cómics, PSA/Beckett para TCG y PCGS para numismática).
                            </p>
                        </div>
                        <div className="bg-white dark:bg-brand-card p-5 sm:p-8 md:col-span-2 group hover:border-green-500 rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <FileText className="text-green-500 mb-6" size={40} />
                            <h3 className="text-2xl font-black italic uppercase mb-4 text-zinc-900 dark:text-white">Certificado de Autenticidad (COA)</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                                Las piezas exclusivas que no poseen encapsulado de fábrica incluyen nuestro propio Certificado de Autenticidad VNTG HUB, firmado por nuestros expertos y con un número de serie único rastreable en nuestra base de datos.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-brand-blue text-white p-5 sm:p-8 md:p-12 border-l-[10px] border-brand-orange shadow-2xl flex flex-col md:flex-row items-center gap-8 rounded-2xl">
                    <ShieldCheck size={60} className="shrink-0 text-brand-orange" />
                    <div>
                        <h3 className="text-2xl font-black italic uppercase mb-2">Garantía del 100%</h3>
                        <p className="font-medium text-lg">
                            Si alguna vez se demuestra que un artículo adquirido en nuestra tienda no es auténtico, te reembolsaremos el importe total de tu compra, sin límite de tiempo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}