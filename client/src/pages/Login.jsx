import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
    return (
        <div className="w-full min-h-[80vh] flex items-center justify-center py-12 px-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 p-8">
                
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black dark:text-white tracking-tight">
                        Bienvenido a <span className="text-brand-blue dark:text-white">VNTG</span><span className="text-brand-orange">HUB</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        Ingresa a tu cuenta para continuar
                    </p>
                </div>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    {/* Campo Email */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
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

                    {/* Campo Contraseña */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Contraseña
                            </label>
                            <a href="#" className="text-xs font-bold text-brand-blue hover:text-brand-orange transition-colors">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={20} className="text-gray-400" />
                            </div>
                            <input 
                                type="password" 
                                placeholder="••••••••"
                                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Botón de Ingreso */}
                    <button 
                        type="submit" 
                        className="w-full mt-6 bg-brand-orange hover:bg-orange-600 text-white py-3.5 rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        Iniciar Sesión <ArrowRight size={20} />
                    </button>
                </form>

                {/* Enlace al Registro */}
                <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/register" className="text-brand-orange font-bold hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    );
}