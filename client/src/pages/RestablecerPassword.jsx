import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RestablecerPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);

    const checkCapsLock = (e) => {
        setCapsLock(e.getModifierState('CapsLock'));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            return setError("Las contraseñas no coinciden");
        }

        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, newPassword })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMensaje("Contraseña actualizada con éxito.");
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.error || "El enlace expiró o es inválido.");
            }
        } catch (err) {
            setError("Error de red.");
        }
    };

    if (!email || !token) {
        return <div className="text-center mt-20 font-bold dark:text-white">Enlace inválido.</div>;
    }

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen flex items-center justify-center px-4 py-20 transition-colors">
            <div className="max-w-md w-full bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-6 sm:p-12 text-center shadow-2xl">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Nueva Contraseña</h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-8 italic tracking-[0.3em]">{email}</p>

                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic">{error}</div>}
                {mensaje && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 text-xs font-bold uppercase italic">{mensaje}</div>}

                {!mensaje && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        <div>
                            <div className="relative">
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    placeholder="NUEVA CONTRASEÑA" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    onKeyUp={checkCapsLock}
                                    required minLength={6}
                                    className="w-full bg-white dark:bg-brand-card text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 pr-12 font-bold italic placeholder:uppercase focus:border-brand-orange outline-none" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand-orange transition-colors"
                                >
                                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    placeholder="CONFIRMAR CONTRASEÑA" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    onKeyUp={checkCapsLock}
                                    required minLength={6}
                                    className="w-full bg-white dark:bg-brand-card text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 pr-12 font-bold italic placeholder:uppercase focus:border-brand-orange outline-none" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand-orange transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {capsLock && <p className="text-brand-orange text-left text-[10px] font-bold uppercase italic mt-1 ml-1">⚠️ Mayúsculas activadas</p>}
                        </div>

                        <button type="submit" className="w-full bg-brand-orange text-white py-4 font-black uppercase italic tracking-widest hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark transition-all mt-4 flex items-center justify-center gap-2">
                            Guardar Cambios <ShieldCheck size={18} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}