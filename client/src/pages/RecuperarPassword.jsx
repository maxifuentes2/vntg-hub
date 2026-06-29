// IMPORTACIONES
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RecuperarPassword() {
    const { addToast } = useToast();
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
                addToast({ title: 'Recuperar' }, 'Correo de recuperación enviado con éxito', 'success');
                setEmail('');
            } else {
                setError(data.error || "Hubo un problema.");
                addToast({ title: 'Recuperar' }, data.error || 'Hubo un problema.', 'error');
            }
        } catch (err) {
            setError("Error de conexión al servidor.");
            addToast({ title: 'Recuperar' }, 'Error de conexión al servidor.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-transparent min-h-screen flex items-center justify-center px-4 font-sans py-20 transition-colors relative overflow-hidden">
            <div className="max-w-md w-full bg-white dark:bg-brand-card p-4 xs:p-6 sm:p-12 text-center relative shadow-2xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange transform rotate-45 translate-x-12 -translate-y-12"></div>

                <Link to="/login" className="absolute top-6 left-6 text-zinc-500 hover:text-brand-orange transition-colors">
                    <ArrowLeft size={20} />
                </Link>

                <h1 className="text-3xl max-[400px]:text-2xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Recuperar</h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-8 italic tracking-[0.3em]">Te enviaremos un enlace</p>

                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold uppercase italic rounded-xl">{error}</div>}
                {mensaje && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 text-xs font-bold uppercase italic rounded-xl">{mensaje}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} required 
                        className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-600 p-4 font-bold italic placeholder:uppercase focus:border-brand-blue outline-none rounded-xl transition-all" 
                    />
                    <button disabled={loading} type="submit" className="w-full bg-brand-orange text-white py-4 font-black uppercase italic tracking-widest transition-all mt-2 flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 rounded-2xl hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark disabled:opacity-70 disabled:cursor-not-allowed">
                        {loading ? 'Enviando...' : 'Enviar Correo'} <Mail size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
