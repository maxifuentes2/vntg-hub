import { FileText } from 'lucide-react';

export default function Terminos() {
    return (
        <div className="w-full transition-colors duration-300">
            <div 
                className="relative w-full min-h-[80vh] bg-cover bg-center bg-fixed py-12 px-4"
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 p-8 md:p-12">
                    
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-neutral-800 pb-6">
                        <FileText className="text-brand-blue" size={40} />
                        <h1 className="text-3xl md:text-4xl font-black dark:text-white">Términos de Servicio</h1>
                    </div>

                    <div className="space-y-6 text-gray-600 dark:text-gray-300 font-medium">
                        <p>Última actualización: Noviembre 2023</p>
                        <h2 className="text-xl font-bold dark:text-white mt-8 mb-4">1. Aceptación de los Términos</h2>
                        <p>Al acceder y utilizar VNTG HUB, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo con alguna parte, te pedimos que no utilices nuestros servicios.</p>
                        
                        <h2 className="text-xl font-bold dark:text-white mt-8 mb-4">2. Uso del Sitio</h2>
                        <p>El contenido de estas páginas es para tu información y uso general. Está sujeto a cambios sin previo aviso. Ni nosotros ni terceros ofrecemos ninguna garantía en cuanto a la exactitud o idoneidad de la información encontrada en este sitio para un propósito particular.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}