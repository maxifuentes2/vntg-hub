import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, ShieldCheck, Gauge, Scale, CalendarDays, Box, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const DetalleProducto = () => {
    const { id } = useParams();
    const { addToCart } = useCart();

    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [imgPrincipal, setImgPrincipal] = useState("");
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = useState(false);

    useEffect(() => {
        const fetchProducto = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/products/${id}`);
                const data = await res.json();
                
                setProducto(data);
                setImgPrincipal(data.images);
                setLoading(false);
            } catch (error) {
                console.error("Error al conectar con el servidor:", error);
                setLoading(false);
            }
        };
        fetchProducto();
    }, [id]);

    const handleMouseMove = (e) => {
        if (!isZooming) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPosition({ x, y });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white font-black italic uppercase tracking-widest">Catalogando Pieza...</div>;
    if (!producto) return <div className="min-h-screen flex items-center justify-center bg-black text-white italic font-black">PRODUCTO NO ENCONTRADO</div>;

    return (
        <div className="w-full transition-colors duration-300 min-h-screen">
            <div 
                className="relative w-full min-h-screen bg-cover bg-center bg-fixed py-8 px-4"
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-[1440px] mx-auto select-none">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-500 hover:text-brand-orange mb-6 font-black text-[10px] uppercase tracking-[0.3em]">
                        <ChevronLeft size={18} /> Volver al catálogo
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-gray-200 dark:border-zinc-800 pb-8 mb-8">
                        <div className="max-w-2xl">
                            <span className="bg-red-600 text-white px-2 py-0.5 text-[9px] font-black italic rounded-sm mb-2 inline-block uppercase tracking-tighter">Original Series</span>
                            <h1 className="text-4xl md:text-5xl font-black dark:text-white italic uppercase tracking-tighter leading-none">{producto.title}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl md:text-5xl font-black text-brand-orange italic leading-none">${Number(producto.price).toLocaleString('es-AR')}</p>
                            <p className="text-[9px] font-black text-zinc-500 tracking-widest uppercase mt-2">Valor Coleccionable</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-1 flex lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                            {producto.gallery && producto.gallery.map((img, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setImgPrincipal(img)}
                                    className={`flex-shrink-0 w-20 h-20 lg:w-full lg:h-auto aspect-square rounded-lg overflow-hidden border-2 transition-all 
                                    ${imgPrincipal === img ? 'border-brand-orange scale-105 shadow-lg' : 'border-gray-200 dark:border-zinc-800 opacity-40 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="thumb" />
                                </button>
                            ))}
                        </div>

                        <div className="lg:col-span-7 order-1 lg:order-2">
                            <div 
                                className="relative aspect-[16/10] rounded-xl overflow-hidden bg-zinc-900 border-2 dark:border-zinc-800 cursor-zoom-in group"
                                onMouseMove={handleMouseMove}
                                onMouseEnter={() => setIsZooming(true)}
                                onMouseLeave={() => { setIsZooming(false); setZoomPosition({ x: 0, y: 0 }); }}
                            >
                                <img 
                                    src={imgPrincipal} 
                                    style={{
                                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                        transform: isZooming ? 'scale(2.5)' : 'scale(1)',
                                    }}
                                    className="w-full h-full object-cover transition-transform duration-200 ease-out" 
                                    alt={producto.title} 
                                />
                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border dark:border-zinc-700 shadow-lg">
                                    <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-1.5">
                                        <Box size={10} /> {producto.estado || "Disponible"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 order-3 space-y-6">
                            <div className="p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-2 border-gray-100 dark:border-zinc-800 rounded-3xl shadow-sm">
                                <h3 className="text-zinc-900 dark:text-white font-black italic mb-6 uppercase text-sm tracking-[0.2em] border-b-2 border-gray-100 dark:border-zinc-700 pb-3">Detalle Técnico</h3>
                                <div className="space-y-6">
                                    <p className="text-zinc-700 dark:text-zinc-200 text-base leading-relaxed font-medium italic">"{producto.description}"</p>
                                    
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800 text-sm">
                                        {/* NUEVO CAMPO: FRANQUICIA[cite: 4] */}
                                        <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold col-span-2">
                                            <Tag size={16} className="text-brand-orange" /> Franquicia: <span className="text-zinc-900 dark:text-white font-black uppercase">{producto.franchise || "General"}</span>
                                        </div>

                                        <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold">
                                            <Scale size={16} className="text-brand-orange" /> Escala: <span className="text-zinc-900 dark:text-white font-black">{producto.escala}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold">
                                            <CalendarDays size={16} className="text-brand-orange" /> Año: <span className="text-zinc-900 dark:text-white font-black">{producto.anio}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold col-span-2">
                                            <Gauge size={16} className="text-brand-orange" /> Fabricante: <span className="text-zinc-900 dark:text-white font-black">{producto.fabricante}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold col-span-2">
                                            <ShieldCheck size={16} className="text-green-500" /> Material: <span className="text-zinc-900 dark:text-white font-black">{producto.material}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => addToCart(producto)}
                                className="w-full bg-brand-orange hover:bg-orange-600 text-white py-5 rounded-2xl font-black italic text-xl transition-all shadow-xl shadow-orange-500/20 uppercase active:scale-95"
                            >
                                Añadir a la colección
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetalleProducto;