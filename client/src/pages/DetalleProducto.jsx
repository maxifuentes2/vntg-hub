import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// Aseguramos que todos los iconos usados estén aquí importados
import { ShoppingCart, ChevronLeft, ShieldCheck, Truck, Gauge, Search, Box } from 'lucide-react';

const DetalleProducto = () => {
    const { id } = useParams();
    const [imgPrincipal, setImgPrincipal] = useState("");
    const [isZoomed, setIsZoomed] = useState(false);

    // Mantenemos los datos exactos que ya tenías
    const productosDB = [
        { 
            id: 3, 
            nombre: "Ecto-1 Cadillac Miller-Meteor Sentinel de 1959", 
            precio: 50000, 
            estado: "Nuevo / Sellado", 
            descripcion: "Increíble reproducción a escala del icónico vehículo de los Cazafantasmas. Detalles de alta fidelidad, pintura original.",
            galeria: [
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto-1_ehvzjx.webp",
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto3_c8eryw.webp",
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto2_r7c1ac.webp",
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto4_j7gn5f.webp"
            ]
        },
        { 
            id: 4, 
            nombre: "1965 AC Shelby 427 Cobra", 
            precio: 55000, 
            estado: "Nuevo / Sellado", 
            descripcion: "La leyenda del automovilismo americano. Este Shelby 427 Cobra a escala captura la agresividad del motor V8.",
            galeria: [
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506219/cobra1_ulmge8.webp",
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506220/cobra2_uf56q9.webp",
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506220/cobra3_lrtf17.webp",
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506220/cobra4_lta94p.webp",
                "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506220/cobra5_nd25vt.webp"
            ]
        }
    ];

    const producto = productosDB.find(p => p.id === Number(id));

    useEffect(() => {
        if (producto) setImgPrincipal(producto.galeria[0]);
    }, [producto, id]);

    // Pantalla de error amigable si el ID no existe
    if (!producto) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <h1 className="text-white font-black text-4xl mb-4 italic">PRODUCTO NO ENCONTRADO</h1>
                    <button onClick={() => window.history.back()} className="text-brand-orange font-bold uppercase tracking-widest">Regresar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 py-10 select-none bg-white dark:bg-neutral-900 transition-colors">
            {/* Volver */}
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-400 hover:text-brand-orange mb-8 font-black text-[10px] uppercase tracking-[0.3em]">
                <ChevronLeft size={22} /> Volver al catálogo
            </button>

            {/* Encabezado Estilo Racing */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 dark:border-zinc-800 pb-10 mb-10">
                <div className="max-w-3xl">
                    <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-black italic rounded-sm mb-3 inline-block uppercase">Racing Series</span>
                    <h1 className="text-5xl md:text-7xl font-black dark:text-white italic uppercase tracking-tighter leading-none">{producto.nombre}</h1>
                </div>
                <div className="text-right">
                    <p className="text-5xl md:text-6xl font-black text-brand-orange italic leading-none">${producto.precio.toLocaleString('es-AR')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Miniaturas a la izquierda */}
                <div className="lg:col-span-1 flex lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-visible">
                    {producto.galeria.map((img, i) => (
                        <button 
                            key={i} 
                            onClick={() => setImgPrincipal(img)}
                            className={`flex-shrink-0 w-20 h-20 lg:w-full lg:h-auto aspect-square rounded-lg overflow-hidden border-2 transition-all 
                            ${imgPrincipal === img ? 'border-brand-orange scale-105' : 'border-zinc-800 opacity-40 hover:opacity-100'}`}
                        >
                            <img src={img} className="w-full h-full object-cover" alt="thumb" />
                        </button>
                    ))}
                </div>

                {/* Imagen Principal Central */}
                <div className="lg:col-span-8 order-1 lg:order-2">
                    <div 
                        className="relative aspect-[16/10] rounded-xl overflow-hidden bg-zinc-900 border-2 dark:border-zinc-800 cursor-zoom-in"
                        onClick={() => setIsZoomed(!isZoomed)}
                    >
                        <img 
                            src={imgPrincipal} 
                            className={`w-full h-full transition-transform duration-700 ease-out ${isZoomed ? 'scale-150 object-contain' : 'object-cover'}`} 
                            alt={producto.nombre} 
                        />
                        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-lg border border-white/10">
                            <Gauge size={20} className="text-brand-orange mx-auto" />
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/40 p-2 rounded text-white/50"><Search size={18} /></div>
                    </div>
                </div>

                {/* Specs y Compra */}
                <div className="lg:col-span-3 order-3 space-y-6">
                    <div className="p-6 bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <h3 className="text-zinc-900 dark:text-white font-black italic mb-4 uppercase text-xs tracking-widest border-b dark:border-zinc-700 pb-2">Especificaciones</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">{producto.descripcion}</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-zinc-400 font-bold text-[10px] uppercase"><ShieldCheck size={16} className="text-green-500" /> Garantía de Autenticidad</div>
                            <div className="flex items-center gap-3 text-zinc-400 font-bold text-[10px] uppercase"><Truck size={16} className="text-brand-blue" /> Envío a Mendoza</div>
                        </div>
                    </div>
                    <button className="w-full bg-brand-orange hover:bg-orange-600 text-white py-5 rounded-xl font-black italic text-xl transition-all shadow-xl shadow-orange-500/20 uppercase tracking-tighter active:scale-95">
                        Comprar ahora
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalleProducto;