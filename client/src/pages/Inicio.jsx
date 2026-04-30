import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Inicio() {
    const [productos, setProductos] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/products')
            .then(res => res.json())
            .then(data => setProductos(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error:", err));
    }, []);

    return (
        <div className="w-full bg-white dark:bg-brand-dark transition-colors duration-300">
            <section className="bg-brand-blue py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-md">
                        Encuentra tu próximo <span className="text-brand-orange">TESORO</span>
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium leading-relaxed">
                        Piezas únicas, cómics graduados y figuras de edición limitada con autenticidad garantizada.
                    </p>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 py-20">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <span className="text-brand-orange font-black uppercase tracking-widest text-xs">Coleccionables</span>
                        <h2 className="text-3xl font-black dark:text-white mt-1">🔥 Ofertas del Día</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {productos.map((prod) => (
                        <div key={prod.id} className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-neutral-800 transition-all hover:-translate-y-2">
                            <Link to={`/producto/${prod.id}`}>
                                <div className="h-64 bg-gray-200 dark:bg-neutral-800 relative">
                                    <img src={prod.images} alt={prod.title} className="w-full h-full object-cover" />
                                </div>
                            </Link>
                            <div className="p-6">
                                <h3 className="text-gray-900 dark:text-white font-black text-xl mb-2">{prod.title}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-black text-brand-blue dark:text-brand-orange">
                                        ${Number(prod.price).toLocaleString('es-AR')}
                                    </span>
                                </div>
                                <button className="w-full mt-6 bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg">
                                    Añadir al Carrito
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}