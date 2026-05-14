import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RecuperarPassword() {
    const [email, setEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (loading) return; 

        setError('');
        setMensaje('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMensaje("Revisa tu correo (incluyendo Spam) para el enlace de recuperación.");
                setEmail('');
            } else {
                setError(data.error || "Hubo un problema.");
            }
        } catch (err) {
            setError("Error de conexión al servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen flex items-center justify-center px-4 py-20 transition-colors">
            <div className="max-w-md w-full bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-6 sm:p-12 text-center shadow-2xl relative">
                <Link to="/login" className="absolute top-6 left-6 text-zinc-500 hover:text-brand-orange transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Recuperar</h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-8 italic tracking-[0.3em]">Te enviaremos un enlace</p>

                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic">{error}</div>}
                {mensaje && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 text-xs font-bold uppercase italic">{mensaje}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} required 
                        className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold italic placeholder:uppercase focus:border-brand-orange outline-none" 
                    />
                    <button disabled={loading} type="submit" className="w-full bg-brand-orange text-white py-4 font-black uppercase italic tracking-widest hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark transition-all flex items-center justify-center gap-2">
                        {loading ? 'Enviando...' : 'Enviar Correo'} <Mail size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}