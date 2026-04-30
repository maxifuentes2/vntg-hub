import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, ShieldCheck, Truck, Gauge, Search } from 'lucide-react';

const DetalleProducto = () => {
    const { id } = useParams();
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:5000/api/products/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("No encontrado");
                return res.json();
            })
            .then(data => {
                setProducto(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error:", err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white font-black italic">CARGANDO...</div>;

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
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-400 hover:text-brand-orange mb-8 font-black text-[10px] uppercase tracking-[0.3em]">
                <ChevronLeft size={22} /> Volver al catálogo
            </button>

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 dark:border-zinc-800 pb-10 mb-10">
                <div className="max-w-3xl">
                    <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-black italic rounded-sm mb-3 inline-block uppercase">Coleccionable</span>
                    <h1 className="text-5xl md:text-7xl font-black dark:text-white italic uppercase tracking-tighter leading-none">{producto.title}</h1>
                </div>
                <div className="text-right">
                    <p className="text-5xl md:text-6xl font-black text-brand-orange italic leading-none">${Number(producto.price).toLocaleString('es-AR')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-9">
                    <div 
                        className="relative aspect-[16/10] rounded-xl overflow-hidden bg-zinc-900 border-2 dark:border-zinc-800 cursor-zoom-in"
                        onClick={() => setIsZoomed(!isZoomed)}
                    >
                        <img 
                            src={producto.images} 
                            className={`w-full h-full transition-transform duration-700 ease-out ${isZoomed ? 'scale-150 object-contain' : 'object-cover'}`} 
                            alt={producto.title} 
                        />
                        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-lg border border-white/10">
                            <Gauge size={20} className="text-brand-orange mx-auto" />
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/40 p-2 rounded text-white/50"><Search size={18} /></div>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <div className="p-6 bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <h3 className="text-zinc-900 dark:text-white font-black italic mb-4 uppercase text-xs tracking-widest border-b dark:border-zinc-700 pb-2">Especificaciones</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">{producto.description}</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-zinc-400 font-bold text-[10px] uppercase"><ShieldCheck size={16} className="text-green-500" /> Garantía de Autenticidad</div>
                            <div className="flex items-center gap-3 text-zinc-400 font-bold text-[10px] uppercase"><Truck size={16} className="text-brand-blue" /> Envío Asegurado</div>
                        </div>
                    </div>
                    <button className="w-full bg-brand-orange hover:bg-orange-600 text-white py-5 rounded-xl font-black italic text-xl transition-all shadow-xl shadow-orange-500/20 uppercase tracking-tighter active:scale-95">
                        Añadir al carrito
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalleProducto;