import { Link } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';

export default function Registro() {
    return (
        <div className="w-full transition-colors duration-300">
            <div 
                className="relative w-full min-h-[80vh] flex items-center justify-center py-12 px-4 bg-cover bg-center bg-fixed"
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 p-8">
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black dark:text-white tracking-tight">
                            Crea tu cuenta
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                            Únete a la comunidad de coleccionistas
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Nombre Completo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Santiago Zufia"
                                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={20} className="text-gray-400" />
                                </div>
                                <input 
                                    type="email" 
                                    placeholder="tu@email.com"
                                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={20} className="text-gray-400" />
                                </div>
                                <input 
                                    type="password" 
                                    placeholder="Crea una contraseña segura"
                                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="terms" 
                                className="mt-1 w-4 h-4 text-brand-orange bg-gray-100 border-gray-300 rounded focus:ring-brand-orange focus:ring-2"
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-tight">
                                Acepto los <Link to="/terminos" target="_blank" className="text-brand-blue hover:underline">Términos de Servicio</Link> y la <Link to="/privacidad" target="_blank" className="text-brand-blue hover:underline">Política de Privacidad</Link>.
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full mt-4 bg-brand-blue hover:bg-blue-800 text-white py-3.5 rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            Crear Cuenta <ShieldCheck size={20} />
                        </button>
                    </form>

                    <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="text-brand-orange font-bold hover:underline">
                            Inicia sesión aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}