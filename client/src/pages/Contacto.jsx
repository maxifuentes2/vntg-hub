import { useState } from 'react';
import { Mail, MapPin, Send } from 'lucide-react';

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
            const response = await fetch('http://localhost:5000/api/contact', {
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
        <div className="bg-white dark:bg-brand-dark min-h-screen text-zinc-900 dark:text-white font-sans transition-colors">
            <header className="py-24 bg-zinc-100 dark:bg-[#111111] border-b-[6px] border-brand-orange text-center px-4">
                <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">Contacto</h1>
                <p className="text-brand-blue font-black uppercase tracking-[0.5em] text-xs">Direct support for collectors</p>
            </header>
            <div className="max-w-[1400px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-12 flex flex-col justify-center">
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">Tienes alguna <span className="text-brand-orange">duda?</span></h2>
                    <div className="space-y-8 pt-8 border-t border-zinc-200 dark:border-white/10">
                        <div className="flex items-center gap-6 group">
                            <div className="bg-zinc-50 dark:bg-[#1a1a1a] p-5 border border-zinc-200 dark:border-white/5 group-hover:border-brand-blue transition-colors"><Mail size={28} className="text-brand-blue" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Email</p>
                                <p className="text-base sm:text-xl font-black italic uppercase break-all">soportehubvntg@gmail.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                            <div className="bg-zinc-50 dark:bg-[#1a1a1a] p-5 border border-zinc-200 dark:border-white/5 group-hover:border-brand-orange transition-colors"><MapPin size={28} className="text-brand-orange" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Showroom</p>
                                <p className="text-base sm:text-xl font-black italic uppercase break-words sm:break-normal">Mendoza, ARG</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Formulario conectado con los estados */}
                <form className="bg-zinc-50 dark:bg-[#111111] p-5 sm:p-10 md:p-16 border border-zinc-200 dark:border-white/5 space-y-6 shadow-2xl" onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="NOMBRE COMPLETO" 
                        className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-5 font-black uppercase italic focus:border-brand-orange outline-none" 
                    />
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="EMAIL DE CONTACTO" 
                        className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-5 font-black uppercase italic focus:border-brand-orange outline-none" 
                    />
                    <textarea 
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleChange}
                        required
                        rows="5" 
                        placeholder="TU MENSAJE..." 
                        className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-5 font-black uppercase italic focus:border-brand-orange outline-none resize-none"
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