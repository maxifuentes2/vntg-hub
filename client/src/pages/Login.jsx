import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Intentando iniciar sesión con:", formData);
        // Aquí iría la lógica de autenticación
    };

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        {/* Tarjeta del Formulario */}
        <div className="w-full max-w-md bg-white dark:bg-brand-dark p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 transition-colors duration-300">
            
            {/* Encabezado */}
            <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Bienvenido a <span className="text-brand-orange">VNTG HUB</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
                Ingresa para gestionar tu colección
            </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                Correo Electrónico
                </label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-blue transition-colors">
                    <Mail size={20} />
                </div>
                <input
                    type="email"
                    name="email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                />
                </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseña
                </label>
                <a href="#" className="text-xs text-brand-blue hover:underline">
                    ¿Olvidaste tu contraseña?
                </a>
                </div>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-blue transition-colors">
                    <Lock size={20} />
                </div>
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                </div>
            </div>

            {/* Botón de Ingreso */}
            <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transform transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-orange-500/20"
            >
                <LogIn size={20} />
                Iniciar Sesión
            </button>
            </form>

            {/* Footer del Formulario */}
            <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link 
                to="/register" 
                className="text-brand-blue font-semibold hover:underline decoration-2 underline-offset-4 transition-all"
                >
                Regístrate aquí
                </Link>
            </p>
            </div>
        </div>
        </div>
    );
};

export default Login;