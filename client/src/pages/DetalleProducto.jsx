import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, Box, ShieldCheck, Truck } from 'lucide-react';

const DetalleProducto = () => {
    const { id } = useParams();
    
    // NOTA: Aquí deberías tener acceso a los mismos datos de productosDB.
    // En un futuro, harás un fetch al backend buscando por el ID.
    // Por ahora, simulamos que encontramos este producto:
    const producto = {
        id: id,
        nombre: "Ecto-1 Cadillac Miller-Meteor Sentinel de 1959",
        precio: 50000,
        estado: "Nuevo / Sellado",
        descripcion: "Increíble reproducción a escala del icónico vehículo de los Cazafantasmas. Detalles de alta fidelidad, pintura original y accesorios montados en el techo.",
        galeria: [
            "https://http2.mlstatic.com/D_NQ_NP_902951-MLA48480604130_122021-O.webp",
            "https://via.placeholder.com/600x400?text=Ecto-1+Lateral",
            "https://via.placeholder.com/600x400?text=Ecto-1+Trasera"
        ]
    };

    const [imgPrincipal, setImgPrincipal] = useState(producto.galeria[0]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            {/* Botón Volver */}
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-500 hover:text-brand-orange transition-colors mb-8 font-bold text-sm">
                <ChevronLeft size={20} /> VOLVER AL CATÁLOGO
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Lado Izquierdo: Galería Dinámica */}
                <div className="space-y-4">
                    <div className="aspect-video sm:aspect-square rounded-3xl overflow-hidden bg-gray-100 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                        <img src={imgPrincipal} alt={producto.nombre} className="w-full h-full object-contain p-4" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {producto.galeria.map((img, index) => (
                            <button 
                                key={index} 
                                onClick={() => setImgPrincipal(img)}
                                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${imgPrincipal === img ? 'border-brand-orange' : 'border-transparent opacity-60'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lado Derecho: Información de Compra */}
                <div className="flex flex-col justify-center">
                    <span className="text-brand-blue font-black tracking-widest text-xs uppercase flex items-center gap-2 mb-4">
                        <Box size={14} /> {producto.estado}
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                        {producto.nombre}
                    </h1>
                    
                    <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-3xl mb-8">
                        <p className="text-xs text-gray-400 font-bold uppercase italic">Precio de Lista</p>
                        <p className="text-5xl font-black text-brand-orange">
                            ${producto.precio.toLocaleString('es-AR')}
                        </p>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                        {producto.descripcion}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-sm font-medium">
                        <div className="flex items-center gap-3 dark:text-gray-300">
                            <ShieldCheck className="text-green-500" /> Garantía de Autenticidad
                        </div>
                        <div className="flex items-center gap-3 dark:text-gray-300">
                            <Truck className="text-brand-blue" /> Envío Asegurado a Mendoza
                        </div>
                    </div>

                    <button className="w-full bg-brand-orange hover:bg-orange-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-orange-500/20">
                        <ShoppingCart size={24} />
                        AÑADIR A LA COLECCIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalleProducto;