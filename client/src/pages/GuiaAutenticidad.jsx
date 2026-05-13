import { ShieldCheck, Search, Award, FileText } from 'lucide-react';

export default function GuiaAutenticidad() {
    return (
        <div className="w-full transition-colors duration-300">
            <div 
                className="relative w-full min-h-[80vh] bg-cover bg-center bg-fixed py-12 px-4"
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 p-8 md:p-12">
                    
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-neutral-800 pb-6">
                        <ShieldCheck className="text-brand-orange" size={40} />
                        <h1 className="text-3xl md:text-4xl font-black dark:text-white">Guía de Autenticidad</h1>
                    </div>

                    <div className="space-y-8">
                        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                            En <span className="font-bold text-brand-blue dark:text-white">VNTG HUB</span>, sabemos que el valor de un coleccionable reside en su autenticidad. Por eso, cada pieza que ingresa a nuestro catálogo pasa por un riguroso proceso de verificación.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-gray-100 dark:border-neutral-700">
                                <Search className="text-brand-blue mb-4" size={32} />
                                <h3 className="text-xl font-bold dark:text-white mb-2">1. Inspección Experta</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Nuestro equipo de curadores revisa cada artículo al detalle: materiales, marcas de fábrica, estado de conservación y consistencia histórica.
                                </p>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-gray-100 dark:border-neutral-700">
                                <Award className="text-brand-orange mb-4" size={32} />
                                <h3 className="text-xl font-bold dark:text-white mb-2">2. Certificadoras Oficiales</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Trabajamos con artículos graduados por las mejores agencias del mundo (CGC para cómics, PSA/Beckett para TCG y PCGS para numismática).
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-gray-100 dark:border-neutral-700 md:col-span-2">
                                <FileText className="text-green-600 mb-4" size={32} />
                                <h3 className="text-xl font-bold dark:text-white mb-2">Certificado de Autenticidad (COA)</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Las piezas exclusivas que no poseen encapsulado de fábrica incluyen nuestro propio Certificado de Autenticidad VNTG HUB, firmado por nuestros expertos y con un número de serie único rastreable en nuestra base de datos.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 bg-brand-blue/10 border-l-4 border-brand-blue p-6 rounded-r-2xl">
                            <p className="font-bold text-brand-blue dark:text-blue-400">
                                🛡️ Garantía de Devolución del 100%: Si alguna vez se demuestra que un artículo adquirido en nuestra tienda no es auténtico, te reembolsaremos el importe total de tu compra, sin límite de tiempo.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}