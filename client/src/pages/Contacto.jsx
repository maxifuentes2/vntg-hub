import { Mail, Phone, MapPin, Send, ChevronDown } from 'lucide-react';

export default function Contacto() {
    return (
        <div className="w-full transition-colors duration-300">
            <div 
                className="relative w-full min-h-[80vh] bg-cover bg-center bg-fixed py-12 px-4"
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-6xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 p-8 md:p-12">
                    
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-black dark:text-white mb-4">¿Necesitas ayuda con un tesoro?</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                            Estamos aquí para resolver tus dudas sobre productos, envíos o tasaciones.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        
                        {/* COLUMNA IZQUIERDA: Información de Contacto */}
                        <div className="space-y-8">
                            <div className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-gray-100 dark:border-neutral-700">
                                <h3 className="text-xl font-bold dark:text-white mb-6">Información Directa</h3>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-brand-orange text-white p-3 rounded-full">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Email</p>
                                            <p className="font-medium dark:text-white">soporte@vntghub.com</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="bg-brand-blue text-white p-3 rounded-full">
                                            <Phone size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Teléfono / WhatsApp</p>
                                            <p className="font-medium dark:text-white">+54 261 123-4567</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="bg-gray-800 dark:bg-gray-600 text-white p-3 rounded-full">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Oficinas (Solo con cita previa)</p>
                                            <p className="font-medium dark:text-white">Av. Emilio Civit</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: Formulario */}
                        <div>
                            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                                        <input type="text" placeholder="Tu nombre" className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                        <input type="email" placeholder="tu@email.com" className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all" />
                                    </div>
                                </div>

                                {/* SELECT MODIFICADO CON FLECHA PERSONALIZADA */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Asunto</label>
                                    <div className="relative">
                                        <select className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl py-3 pl-4 pr-12 appearance-none focus:ring-2 focus:ring-brand-orange outline-none transition-all cursor-pointer">
                                            <option>Duda sobre un producto</option>
                                            <option>Problema con mi envío</option>
                                            <option>Quiero vender mi colección</option>
                                            <option>Otros</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                            <ChevronDown size={20} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mensaje</label>
                                    <textarea rows="4" placeholder="¿En qué te podemos ayudar?" className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all resize-none"></textarea>
                                </div>

                                <button type="submit" className="w-full bg-brand-orange hover:bg-orange-600 text-white py-3.5 rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 active:scale-95">
                                    Enviar Mensaje <Send size={20} />
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}