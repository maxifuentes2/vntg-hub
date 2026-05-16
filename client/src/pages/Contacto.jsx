import { useState } from 'react';
import { Mail, MapPin, Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Contacto() {
    // Estados para guardar la información del formulario
    const [formData, setFormData] = useState({ nombre: '', email: '', mensaje: '' });
    const [estadoEnviando, setEstadoEnviando] = useState('idle');

    // Función para actualizar el estado cuando el usuario escribe
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Función que se ejecuta al darle al botón "Enviar"
    const handleSubmit = async (e) => {
        e.preventDefault();
        setEstadoEnviando('loading');

        try {
            // Mandamos los datos al backend
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setEstadoEnviando('success');
                setFormData({ nombre: '', email: '', mensaje: '' }); // Limpiamos el formulario
                setTimeout(() => setEstadoEnviando('idle'), 3000);
            } else {
                setEstadoEnviando('error');
            }
        } catch (error) {
            console.error('Error:', error);
            setEstadoEnviando('error');
        }
    };

    return (
        <div className="bg-transparent min-h-screen text-zinc-900 dark:text-white font-sans transition-colors relative">
            <header className="py-24 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-b border-brand-orange/30 text-center px-4">
                    <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">Contacto</h1>
                    <p className="text-brand-blue font-black uppercase tracking-[0.5em] text-xs">Soporte directo para coleccionistas</p>
            </header>
            <div className="max-w-[1400px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-12 flex flex-col justify-center">
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">Tienes alguna <span className="text-brand-orange">duda?</span></h2>
                    <div className="space-y-8 pt-8 border-t border-zinc-200 dark:border-white/10">
                        <div className="flex items-center gap-6 group">
                            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-5 border border-white/20 dark:border-white/5 group-hover:border-brand-blue transition-colors rounded-xl shadow-lg"><Mail size={28} className="text-brand-blue" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Email</p>
                                <p className="text-base sm:text-xl font-black italic uppercase break-all">soportehubvntg@gmail.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-5 border border-white/20 dark:border-white/5 group-hover:border-brand-orange transition-colors rounded-xl shadow-lg"><MapPin size={28} className="text-brand-orange" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Showroom</p>
                                <p className="text-base sm:text-xl font-black italic uppercase break-words sm:break-normal">Mendoza, ARG</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Formulario conectado con los estados */}
                <form className="bg-white/20 dark:bg-white/5 backdrop-blur-2xl p-5 sm:p-10 md:p-16 border border-white/20 dark:border-white/5 space-y-6 shadow-2xl rounded-3xl" onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Nombre completo" 
                        className="w-full bg-white/40 dark:bg-black/20 text-zinc-900 dark:text-white border border-white/20 dark:border-white/5 p-5 font-black italic focus:border-brand-orange outline-none rounded-xl transition-all" 
                    />
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Email de contacto" 
                        className="w-full bg-white/40 dark:bg-black/20 text-zinc-900 dark:text-white border border-white/20 dark:border-white/5 p-5 font-black italic focus:border-brand-orange outline-none rounded-xl transition-all" 
                    />
                    <textarea 
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleChange}
                        required
                        rows="5" 
                        placeholder="Tu mensaje..." 
                        className="w-full bg-white/40 dark:bg-black/20 text-zinc-900 dark:text-white border border-white/20 dark:border-white/5 p-5 font-black italic focus:border-brand-orange outline-none resize-none rounded-xl transition-all"
                    ></textarea>
                    
                    <button 
                        type="submit" 
                        disabled={estadoEnviando === 'loading'}
                        className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {estadoEnviando === 'loading' ? 'ENVIANDO...' : 
                         estadoEnviando === 'success' ? 'CORREO ENVIADO' : 
                         estadoEnviando === 'error' ? 'ERROR AL ENVIAR' : 
                         <>Enviar Correo  <Send size={20} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}