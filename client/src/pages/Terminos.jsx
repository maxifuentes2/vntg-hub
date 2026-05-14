import { FileText } from 'lucide-react';

export default function Terminos() {
    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen text-zinc-900 dark:text-white font-sans transition-colors duration-300">
            {/* HERO HEADER */}
            <header className="py-24 bg-zinc-100 dark:bg-[#111111] border-b-[6px] border-brand-orange text-center px-4">
                <FileText className="text-brand-blue mx-auto mb-6" size={60} />
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">Términos</h1>
                <p className="text-brand-orange font-black uppercase tracking-[0.5em] text-xs md:text-sm">Condiciones de Servicio</p>
            </header>

            <div className="max-w-[1000px] mx-auto px-6 py-20">
                <div className="bg-zinc-50 dark:bg-[#111111] p-10 md:p-16 border border-zinc-200 dark:border-white/5 shadow-2xl">
                    <p className="text-sm font-black italic uppercase tracking-widest text-zinc-500 mb-12 border-b border-zinc-200 dark:border-white/10 pb-4">
                        Última actualización: Noviembre 2023
                    </p>

                    <div className="space-y-12">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-3xl font-black text-brand-orange italic">01</span>
                                <h2 className="text-2xl md:text-3xl font-black italic uppercase text-zinc-900 dark:text-white">Aceptación de los Términos</h2>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed bg-white dark:bg-[#1a1a1a] p-6 border border-zinc-100 dark:border-white/5">
                                Al acceder y utilizar <span className="font-black italic text-zinc-900 dark:text-white">VNTG HUB</span>, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo con alguna parte, te pedimos que no utilices nuestros servicios.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-3xl font-black text-brand-blue italic">02</span>
                                <h2 className="text-2xl md:text-3xl font-black italic uppercase text-zinc-900 dark:text-white">Uso del Sitio</h2>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed bg-white dark:bg-[#1a1a1a] p-6 border border-zinc-100 dark:border-white/5">
                                El contenido de estas páginas es para tu información y uso general. Está sujeto a cambios sin previo aviso. Ni nosotros ni terceros ofrecemos ninguna garantía en cuanto a la exactitud o idoneidad de la información encontrada en este sitio para un propósito particular.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}