import { Shield } from 'lucide-react';

export default function Privacidad() {
    return (
        <div className="w-full transition-colors duration-300">
            <div 
                className="relative w-full min-h-[80vh] bg-cover bg-center bg-fixed py-12 px-4"
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 p-8 md:p-12">
                    
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-neutral-800 pb-6">
                        <Shield className="text-brand-orange" size={40} />
                        <h1 className="text-3xl md:text-4xl font-black dark:text-white">Política de Privacidad</h1>
                    </div>

                    <div className="space-y-6 text-gray-600 dark:text-gray-300 font-medium">
                        <p>En VNTG HUB valoramos tu privacidad y nos comprometemos a proteger tus datos personales.</p>
                        
                        <h2 className="text-xl font-bold dark:text-white mt-8 mb-4">Recopilación de Información</h2>
                        <p>Solo recopilamos la información necesaria para procesar tus pedidos y mejorar tu experiencia (nombre, correo electrónico, dirección de envío).</p>
                        
                        <h2 className="text-xl font-bold dark:text-white mt-8 mb-4">Protección de Datos</h2>
                        <p>Tus datos están encriptados y no los compartimos, vendemos ni alquilamos a terceros bajo ninguna circunstancia. Utilizamos pasarelas de pago seguras para garantizar que tu información financiera nunca quede almacenada en nuestros servidores.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}