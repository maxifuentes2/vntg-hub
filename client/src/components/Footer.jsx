import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-gray-100 dark:bg-brand-dark pt-16 pb-8 border-t border-gray-200 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
                
                {/* Logo y Descripción */}
                <div className="col-span-1 md:col-span-2">
                    <h2 className="text-2xl font-black mb-4 dark:text-white">
                        <span className="text-brand-blue dark:text-white">VNTG</span>
                        <span className="text-brand-orange">HUB</span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
                        La plataforma líder para coleccionistas de alto nivel. Autenticidad garantizada en cada pieza.
                    </p>
                </div>
                
                {/* Enlaces: Categorías */}
                <div>
                    <h3 className="font-bold mb-4 text-gray-900 dark:text-white uppercase tracking-wider text-sm">Categorías</h3>
                    <ul className="space-y-3 flex flex-col text-gray-600 dark:text-gray-400 text-sm">
                        <Link to="/categorias/figuras" className="hover:text-brand-orange transition-colors w-fit">Figuras de Acción</Link>
                        <Link to="/categorias/cartas" className="hover:text-brand-orange transition-colors w-fit">Cartas TCG</Link>
                        <Link to="/categorias/autos" className="hover:text-brand-orange transition-colors w-fit">Autos a Escala</Link>
                    </ul>
                </div>
                
                {/* Enlaces: Soporte */}
                <div>
                    <h3 className="font-bold mb-4 text-gray-900 dark:text-white uppercase tracking-wider text-sm">Soporte</h3>
                    <ul className="space-y-3 flex flex-col text-gray-600 dark:text-gray-400 text-sm">
                        <Link to="/guia-autenticidad" className="hover:text-brand-orange transition-colors w-fit">Guía de Autenticidad</Link>
                        <Link to="/envios" className="hover:text-brand-orange transition-colors w-fit">Envíos Seguros</Link>
                        <Link to="/contacto" className="hover:text-brand-orange transition-colors w-fit">Contacto</Link>
                    </ul>
                </div>
                
            </div>
            
            {/* Copyright */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-neutral-800 text-center text-xs font-medium text-gray-500">
                © 2026 VNTG Hub. Todos los derechos reservados.
            </div>
        </footer>
    );
}