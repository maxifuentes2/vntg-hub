import { Package, Truck, Shield, Clock } from 'lucide-react';

export default function EnviosSeguros() {
    return (
        <div className="w-full transition-colors duration-300">
            <div 
                className="relative w-full min-h-[80vh] bg-cover bg-center bg-fixed py-12 px-4"
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 p-8 md:p-12">
                    
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-neutral-800 pb-6">
                        <Package className="text-brand-blue" size={40} />
                        <h1 className="text-3xl md:text-4xl font-black dark:text-white">Envíos y Embalaje Seguros</h1>
                    </div>

                    <div className="space-y-8">
                        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                            Como coleccionistas, sabemos que la caja importa tanto como la figura. Cuidamos tu tesoro desde nuestro almacén hasta tus manos.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-brand-orange/20 p-3 rounded-xl text-brand-orange">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold dark:text-white">Embalaje de Grado Coleccionista</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Utilizamos cajas de cartón corrugado de doble pared, plástico de burbujas premium y esquineros protectores para evitar cualquier daño durante el tránsito. Tus cómics se envían en sobres rígidos.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-brand-blue/20 p-3 rounded-xl text-brand-blue">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold dark:text-white">Métodos de Envío</h3>
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                                        <li><span className="font-bold text-gray-800 dark:text-gray-200">Envío Estándar:</span> 3 a 5 días hábiles.</li>
                                        <li><span className="font-bold text-gray-800 dark:text-gray-200">Envío Express:</span> 24 a 48 horas hábiles.</li>
                                        <li><span className="font-bold text-gray-800 dark:text-gray-200">Retiro en Sucursal:</span> Disponible en nuestros puntos habilitados.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-green-500/20 p-3 rounded-xl text-green-500">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold dark:text-white">Tiempos de Procesamiento</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Todos los pedidos se procesan y despachan en un plazo máximo de 24 horas hábiles tras la confirmación del pago.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-2xl text-center mt-8">
                            <p className="font-bold dark:text-white text-lg">Todos nuestros envíos están 100% asegurados.</p>
                            <p className="text-gray-500 text-sm mt-1">Si el paquete se pierde o llega dañado, nosotros nos hacemos cargo.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}