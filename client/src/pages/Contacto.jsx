import { useState } from 'react';
import { Mail, MapPin, Send, MessageCircle } from 'lucide-react';

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
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                signal: controller.signal,
            });
            clearTimeout(timeout);

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
            <header className="py-24 bg-white dark:bg-brand-dark border-b border-brand-orange/30 text-center px-4">
                <h1 className="text-3xl max-[400px]:text-2xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">Contacto</h1>
                <p className="text-brand-blue font-black uppercase tracking-[0.5em] text-xs">Soporte directo para coleccionistas</p>
            </header>
            <div className="max-w-[1400px] mx-auto px-4 xs:px-6 py-12 xs:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 xs:gap-12 lg:gap-20">
                <div className="space-y-12 flex flex-col justify-center">
                    <h2 className="text-3xl max-[400px]:text-2xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">Tienes alguna <span className="text-brand-orange">duda?</span></h2>
                    <div className="space-y-8 pt-8 border-t border-zinc-200 dark:border-white/10">
                        <div className="flex items-center gap-6 group">
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-5  group-hover:border-brand-blue transition-colors rounded-xl shadow-sm"><Mail size={28} className="text-brand-blue" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Email</p>
                                <p className="text-sm xs:text-base sm:text-xl font-black italic uppercase break-all">soportehubvntg@gmail.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-5  group-hover:border-green-500 transition-colors rounded-xl shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-[28px] h-[28px] text-green-500 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.411 0 .01 5.403.007 12.04c0 2.123.543 4.197 1.57 6.068l-1.67 6.095 6.236-1.636a11.79 11.79 0 005.904 1.564h.005c6.637 0 12.039-5.404 12.042-12.041a11.8 11.8 0 00-3.535-8.529z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">WhatsApp</p>
                                <p className="text-sm xs:text-base sm:text-xl font-black italic uppercase">+54 9 261 710-0686</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-5  group-hover:border-brand-orange transition-colors rounded-xl shadow-sm"><MapPin size={28} className="text-brand-orange" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Showroom</p>
                                <p className="text-sm xs:text-base sm:text-xl font-black italic uppercase break-words sm:break-normal">Mendoza, ARG</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Formulario conectado con los estados */}
                <form className="bg-white dark:bg-brand-card p-4 xs:p-5 sm:p-10 md:p-16  space-y-6 shadow-lg rounded-3xl" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Nombre completo"
                        className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-600 p-5 font-black italic focus:border-brand-orange outline-none rounded-xl transition-all"
                    />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Email de contacto"
                        className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-600 p-5 font-black italic focus:border-brand-orange outline-none rounded-xl transition-all"
                    />
                    <textarea
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleChange}
                        required
                        rows="5"
                        placeholder="Tu mensaje..."
                        className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-600 p-5 font-black italic focus:border-brand-orange outline-none resize-none rounded-xl transition-all"
                    ></textarea>

                    <button
                        type="submit"
                        disabled={estadoEnviando === 'loading'}
                        className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95"
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