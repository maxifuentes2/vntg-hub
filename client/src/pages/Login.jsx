import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
// 1. Importamos el componente de Google
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
    const navigate = useNavigate();

    // 2. Función para manejar el éxito del login
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });

            const data = await response.json();

            if (response.ok) {
                // Guardamos el usuario en el storage para que la App sepa quién es
                localStorage.setItem('vntg_user', JSON.stringify(data.user));
                
                // Redirigimos al inicio
                navigate('/');
                // Opcional: recargar para que la Navbar se actualice con el nombre del usuario
                window.location.reload();
            } else {
                console.error("Error en el servidor:", data.error);
                alert("Error al iniciar sesión con Google");
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
    };

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
                    {/* Campos de Email y Contraseña (Igual que antes) */}
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

                    <button 
                        type="submit" 
                        className="w-full mt-6 bg-brand-orange hover:bg-orange-600 text-white py-3.5 rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        Iniciar Sesión <ArrowRight size={20} />
                    </button>

                    {/* 3. SEPARADOR VISUAL */}
                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-gray-200 dark:border-neutral-800"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">o</span>
                        <div className="flex-grow border-t border-gray-200 dark:border-neutral-800"></div>
                    </div>

                    {/* 4. BOTÓN DE GOOGLE */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Fallido')}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
                            text="signin_with"
                            // width="100%"  <-- ERROR: No acepta strings con %
                            width={350}      // <-- SOLUCIÓN: Usar un número (px)
                        />
                    </div>
                </form>

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