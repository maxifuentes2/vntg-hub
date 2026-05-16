import { Shield } from 'lucide-react';

export default function Privacidad() {
    return (
        <div className="bg-transparent min-h-screen text-zinc-900 dark:text-white font-sans transition-colors duration-300 relative">
            {/* HERO HEADER */}
            <header className="py-24 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-b border-brand-orange/30 text-center px-4">
                    <Shield className="text-brand-orange mx-auto mb-6" size={60} />
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">Privacidad</h1>
                    <p className="text-brand-blue font-black uppercase tracking-[0.5em] text-xs md:text-sm">Protección de Datos</p>
            </header>

            <div className="max-w-[1000px] mx-auto px-6 py-20">
                <div className="bg-white/20 dark:bg-white/5 backdrop-blur-2xl p-5 sm:p-10 md:p-16 border border-white/20 dark:border-white/5 shadow-2xl rounded-3xl">
                    <p className="text-xl md:text-2xl font-black italic uppercase text-zinc-800 dark:text-zinc-200 border-l-4 border-brand-orange pl-6 mb-12">
                        En <span className="text-brand-blue">VNTG HUB</span> valoramos tu privacidad y nos comprometemos a proteger tus datos personales al máximo nivel.
                    </p>
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black italic uppercase text-zinc-900 dark:text-white mb-6">Recopilación de Información</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 border border-white/20 dark:border-white/5 rounded-2xl shadow-inner">
                                Solo recopilamos la información estrictamente necesaria para procesar tus pedidos y mejorar tu experiencia operativa (nombre, correo electrónico, dirección de envío).
                            </p>
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black italic uppercase text-zinc-900 dark:text-white mb-6">Protección de Datos</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 border border-white/20 dark:border-white/5 rounded-2xl shadow-inner">
                                Tus datos están encriptados y <span className="font-bold text-brand-orange">no los compartimos, vendemos ni alquilamos</span> a terceros bajo ninguna circunstancia. Utilizamos pasarelas de pago seguras para garantizar que tu información financiera nunca quede almacenada en nuestros servidores.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}