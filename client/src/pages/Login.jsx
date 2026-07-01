// IMPORTACIONES
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Eye, EyeOff, Loader } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
    const { login } = useAuth();
    const { addToast } = useToast();
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
    const [captchaToken, setCaptchaToken] = useState(null);
    const recaptchaRef = useRef(null);

    // NUEVO ESTADO PARA RECORDAR DISPOSITIVO ---
    const [rememberDevice, setRememberDevice] = useState(false);

    const checkCapsLock = (e) => {
        setCapsLock(e.getModifierState('CapsLock'));
    };

    useEffect(() => {
        if (location.state?.googleError) {
            setError(location.state.googleError);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [location.state]);

    const handleGoogleRedirect = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = window.location.origin;
        const nonce = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('google_nonce', nonce);
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}`;
        window.location.href = url;
    };

    const handleLocalLogin = async (e) => {
        e.preventDefault();
        
        if (isLoading) return; 

        if (!captchaToken) {
            setError("Por favor, completa el captcha");
            return;
        }
        
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
                    deviceToken: storedToken,
                    captchaToken
                })
            });
            const data = await response.json();

            if (response.ok) {
                if (data.skipCode) {
                    login(data.user, data.token);
                    addToast({ title: 'Sesión Iniciada' }, `Bienvenid@ ${(data.user.name || '').split(' ')[0] || data.user.email}`, 'success');
                    navigate('/');
                } else if (data.requireCode) {
                    // Si no, procedemos a la verificación por código
                    setStep(2); 
                    setMensaje("Revisa tu bandeja de entrada o spam.");
                }
            } else {
                setError(data.error || "Error al iniciar sesión");
                addToast({ title: 'Iniciar Sesión' }, data.error || 'Error al iniciar sesión', 'error');
                if (recaptchaRef.current) recaptchaRef.current.reset();
                setCaptchaToken(null);
            }
        } catch (error) {
            console.error("Error de red:", error);
            setError("Error de conexión. Inténtalo más tarde.");
            addToast({ title: 'Iniciar Sesión' }, 'Error de conexión. Inténtalo más tarde.', 'error');
            if (recaptchaRef.current) recaptchaRef.current.reset();
            setCaptchaToken(null);
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
                if (data.deviceToken) {
                    localStorage.setItem('vntg_device_token', data.deviceToken);
                }
                login(data.user, data.token);
                addToast({ title: 'Sesión Iniciada' }, `Bienvenid@ ${(data.user.name || '').split(' ')[0] || data.user.email}`, 'success');
                navigate('/');
            } else {
                setError(data.error || "Código incorrecto o expirado");
                addToast({ title: 'Verificación' }, data.error || 'Código incorrecto o expirado', 'error');
            }
        } catch (error) {
            console.error("Error de red:", error);
            setError("Error de conexión. Inténtalo más tarde.");
            addToast({ title: 'Verificación' }, 'Error de conexión. Inténtalo más tarde.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-transparent min-h-screen flex items-center justify-center px-4 font-sans py-20 transition-colors relative overflow-hidden">
            <div className="max-w-md w-full bg-white dark:bg-brand-card  p-4 xs:p-6 sm:p-12 text-center relative shadow-2xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange transform rotate-45 translate-x-12 -translate-y-12"></div>

                {step === 1 ? (
                    <>
                        <h1 className="text-3xl max-[400px]:text-2xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Iniciar Sesión</h1>
                        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-10 italic tracking-[0.3em]">Accede a tu perfil</p>

                        {justRegistered && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 text-xs font-bold uppercase italic rounded-xl">
                                ¡Cuenta creada! Iniciá sesión para entrar al Hub.
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic rounded-xl">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4 text-left" onSubmit={handleLocalLogin}>
                            <input
                                type="email"
                                placeholder="CORREO ELECTRÓNICO"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-600 p-4 font-bold italic placeholder:uppercase focus:border-brand-blue outline-none disabled:opacity-50 rounded-xl transition-all"
                            />
                            
                            <div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="CONTRASEÑA"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyUp={checkCapsLock}
                                        required
                                        disabled={isLoading}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-600 p-4 pr-12 font-bold italic placeholder:uppercase focus:border-brand-blue outline-none disabled:opacity-50 rounded-xl transition-all"
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

                            <div className="my-4 mx-auto w-[258px] min-[360px]:w-[304px] h-[66px] min-[360px]:h-[78px]">
                                <div className="scale-[0.85] min-[360px]:scale-100 origin-top-left transition-transform">
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                        onChange={(token) => setCaptchaToken(token)}
                                        theme="light"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full bg-brand-blue text-white py-4 font-black uppercase italic tracking-widest transition-all mt-2 flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 rounded-2xl ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand-orange'}`}
                            >
                                {isLoading ? <Loader className="animate-spin" size={20} /> : 'Entrar'}
                            </button>
                            
                            <Link to="/recuperar-password" className="block mt-4 text-right text-[10px] font-bold uppercase italic text-zinc-500 hover:text-brand-orange transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </form>

                        <div className="my-8 flex items-center gap-4 text-zinc-300 dark:text-zinc-700 font-black italic text-[10px]">
                            <div className="h-px flex-grow bg-zinc-200 dark:bg-zinc-700"></div> O <div className="h-px flex-grow bg-zinc-200 dark:bg-zinc-700"></div>
                        </div>

                        <div className="flex justify-center">
                            <button onClick={handleGoogleRedirect} className="flex items-center gap-3 bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold uppercase italic text-xs tracking-widest py-3 px-6 rounded-full transition-all shadow-md">
                                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 0, 0)"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></g></svg>
                                Iniciar sesión con Google
                            </button>
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
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic rounded-xl">
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
                                className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-600 p-4 font-black uppercase italic tracking-[0.5em] text-center text-2xl focus:border-brand-orange outline-none disabled:opacity-50 rounded-2xl transition-all"
                            />
                            
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full bg-brand-orange text-white py-4 font-black uppercase italic tracking-widest transition-all mt-4 flex justify-center items-center gap-2 rounded-2xl ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark'}`}
                            >
                                {isLoading ? <Loader className="animate-spin" size={20} /> : <>Confirmar <ShieldCheck size={18} /></>}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}