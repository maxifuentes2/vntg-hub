import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Registro() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);

    const checkCapsLock = (e) => {
        setCapsLock(e.getModifierState('CapsLock'));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('vntg_user', JSON.stringify(data.user));
                navigate('/');
                window.location.reload();
            } else {
                setError(data.error || "Error al crear la cuenta");
            }
        } catch (error) {
            console.error("Error de red:", error);
            setError("Error de conexión. Inténtalo más tarde.");
        }
    };

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen flex items-center justify-center px-4 font-sans py-20 transition-colors">
            <div className="max-w-md w-full bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-6 sm:p-12 text-center relative shadow-2xl">
                <div className="absolute top-0 left-0 w-24 h-24 bg-brand-blue transform -rotate-45 -translate-x-12 -translate-y-12"></div>
                
                <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Registro</h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-10 italic tracking-[0.3em]">Join the squadron</p>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic">
                        {error}
                    </div>
                )}

                <form className="space-y-4 text-left" onSubmit={handleRegister}>
                    <input 
                        type="text" 
                        placeholder="NOMBRE COMPLETO" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold italic placeholder:uppercase focus:border-brand-orange outline-none" 
                        required 
                    />
                    <input 
                        type="email" 
                        placeholder="EMAIL" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold italic placeholder:uppercase focus:border-brand-orange outline-none" 
                        required 
                    />
                    
                    <div>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="PASSWORD" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyUp={checkCapsLock}
                                className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 pr-12 font-bold italic placeholder:uppercase focus:border-brand-orange outline-none" 
                                required 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand-orange transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {capsLock && <p className="text-brand-orange text-[10px] font-bold uppercase italic mt-1 ml-1">⚠️ Mayúsculas activadas</p>}
                    </div>
                    
                    <div className="flex items-start gap-3 pt-2">
                        <input type="checkbox" id="terms" className="mt-1 accent-brand-orange" required />
                        <label htmlFor="terms" className="text-[10px] text-zinc-500 font-bold uppercase italic leading-tight">
                            Acepto los <Link to="/terminos" className="text-brand-blue hover:underline">Términos</Link> y <Link to="/privacidad" className="text-brand-blue hover:underline">Privacidad</Link>.
                        </label>
                    </div>
                    
                    <button type="submit" className="w-full bg-brand-orange text-white py-4 font-black uppercase italic tracking-widest hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark transition-all mt-4 flex items-center justify-center gap-2">
                        Crear Cuenta <ShieldCheck size={18} />
                    </button>
                </form>

                <p className="mt-10 text-[11px] font-bold uppercase italic text-zinc-500">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-brand-blue hover:text-zinc-900 dark:hover:text-white transition-colors">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}