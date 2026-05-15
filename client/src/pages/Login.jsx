import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const justRegistered = location.state?.registered;

    const [step, setStep] = useState(1); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // --- NUEVO ESTADO PARA RECORDAR DISPOSITIVO ---
    const [rememberDevice, setRememberDevice] = useState(false);

    const checkCapsLock = (e) => {
        setCapsLock(e.getModifierState('CapsLock'));
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('vntg_user', JSON.stringify(data.user));
                if (data.token) localStorage.setItem('vntg_token', data.token);
                navigate('/');
                window.location.reload();
            } else {
                setError(data.error || "Error al iniciar sesión con Google");
            }
        } catch (error) {
            console.error("Error de red:", error);
            setError("Error de conexión. Inténtalo más tarde.");
        }
    };

    const handleLocalLogin = async (e) => {
        e.preventDefault();
        
        if (isLoading) return; 
        
        setIsLoading(true);
        setError('');
        setMensaje('');

        try {
            // Recuperamos el token del dispositivo si existe en el navegador
            const storedToken = localStorage.getItem('vntg_device_token');

            const response = await fetch(`${API_URL}/api/auth/login/local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    deviceToken: storedToken 
                })
            });
            const data = await response.json();

            if (response.ok) {
                if (data.skipCode) {
                    // Si el dispositivo es de confianza, entramos directo
                    localStorage.setItem('vntg_user', JSON.stringify(data.user));
                    if (data.token) localStorage.setItem('vntg_token', data.token);
                    navigate('/');
                    window.location.reload();
                } else if (data.requireCode) {
                    // Si no, procedemos a la verificación por código
                    setStep(2); 
                    setMensaje("Revisa tu bandeja de entrada o spam.");
                }
            } else {
                setError(data.error || "Error al iniciar sesión");
            }
        } catch (error) {
            console.error("Error de red:", error);
            setError("Error de conexión. Inténtalo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        
        if (isLoading) return; 
        
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    code, 
                    rememberDevice // Enviamos si el usuario quiere recordar el dispositivo
                })
            });
            const data = await response.json();

            if (response.ok) {
                // Si el servidor generó un token de confianza, lo guardamos localmente
                if (data.deviceToken) {
                    localStorage.setItem('vntg_device_token', data.deviceToken);
                }
                localStorage.setItem('vntg_user', JSON.stringify(data.user));
                if (data.token) localStorage.setItem('vntg_token', data.token);
                navigate('/');
                window.location.reload();
            } else {
                setError(data.error || "Código incorrecto o expirado");
            }
        } catch (error) {
            console.error("Error de red:", error);
            setError("Error de conexión. Inténtalo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen flex items-center justify-center px-4 font-sans py-20 transition-colors">
            <div className="max-w-md w-full bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-6 sm:p-12 text-center relative shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange transform rotate-45 translate-x-12 -translate-y-12"></div>

                {step === 1 ? (
                    <>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Login</h1>
                        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-10 italic tracking-[0.3em]">Access your profile</p>

                        {justRegistered && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 text-xs font-bold uppercase italic">
                                ¡Cuenta creada! Iniciá sesión para entrar al Hub.
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4 text-left" onSubmit={handleLocalLogin}>
                            <input
                                type="email"
                                placeholder="EMAIL"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold italic placeholder:uppercase focus:border-brand-blue outline-none disabled:opacity-50"
                            />
                            
                            <div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="PASSWORD"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyUp={checkCapsLock}
                                        required
                                        disabled={isLoading}
                                        className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 pr-12 font-bold italic placeholder:uppercase focus:border-brand-blue outline-none disabled:opacity-50"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand-orange transition-colors disabled:opacity-50"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {capsLock && <p className="text-brand-orange text-[10px] font-bold uppercase italic mt-1 ml-1">⚠️ Mayúsculas activadas</p>}
                            </div>

                            {/* CHECKBOX RECORDAR DISPOSITIVO */}
                            <div className="flex items-center gap-2 py-2">
                                <input 
                                    type="checkbox" 
                                    id="remember"
                                    checked={rememberDevice}
                                    onChange={(e) => setRememberDevice(e.target.checked)}
                                    disabled={isLoading}
                                    className="w-4 h-4 accent-brand-blue cursor-pointer"
                                />
                                <label htmlFor="remember" className="text-[10px] font-bold uppercase italic text-zinc-500 cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                                    Recordar este dispositivo
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full bg-brand-blue text-white py-4 font-black uppercase italic tracking-widest transition-all mt-2 flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand-orange'}`}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
                            </button>
                            
                            <Link to="/recuperar-password" className="block mt-4 text-right text-[10px] font-bold uppercase italic text-zinc-500 hover:text-brand-orange transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </form>

                        <div className="my-8 flex items-center gap-4 text-zinc-300 dark:text-zinc-700 font-black italic text-[10px]">
                            <div className="h-px flex-grow bg-zinc-200 dark:bg-white/5"></div> O <div className="h-px flex-grow bg-zinc-200 dark:bg-white/5"></div>
                        </div>

                        <div className="flex justify-center">
                            <GoogleLogin onSuccess={handleGoogleSuccess} theme="filled_black" shape="square" />
                        </div>

                        <p className="mt-10 text-[11px] font-bold uppercase italic text-zinc-500">
                            ¿No tienes cuenta? <Link to="/register" className="text-brand-orange hover:text-zinc-900 dark:hover:text-white transition-colors">Regístrate</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setStep(1)}
                            disabled={isLoading}
                            className="absolute top-6 left-6 text-zinc-500 hover:text-brand-orange transition-colors disabled:opacity-50"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <ShieldCheck size={48} className="mx-auto text-brand-orange mb-4" />
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Verificación</h1>
                        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-2 italic tracking-[0.3em]">
                            Código enviado a tu email
                        </p>
                        <p className="text-brand-blue font-bold text-xs mb-8 italic">{mensaje}</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4 text-left" onSubmit={handleVerifyCode}>
                            <input
                                type="text"
                                placeholder="0 0 0 0 0 0"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={6}
                                required
                                disabled={isLoading}
                                className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-black uppercase italic tracking-[0.5em] text-center text-2xl focus:border-brand-orange outline-none disabled:opacity-50"
                            />
                            
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full bg-brand-orange text-white py-4 font-black uppercase italic tracking-widest transition-all mt-4 flex justify-center items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark'}`}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Confirmar <ShieldCheck size={18} /></>}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}