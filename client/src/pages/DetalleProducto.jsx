import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Box, ShieldCheck, Truck, Tag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || "http://kernelos-pc:5000";

const AccordionItem = ({ title, children, isOpen, onClick }) => (
    <div className="border-b border-white/10">
        <button 
            onClick={onClick}
            className="w-full py-6 flex justify-between items-center group hover:text-brand-orange transition-colors"
        >
            <span className="text-sm font-black uppercase italic tracking-widest">{title}</span>
            {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 pb-8' : 'max-h-0'}`}>
            <div className="text-zinc-400 text-sm font-medium leading-relaxed italic">
                {children}
            </div>
        </div>
    </div>
);

const DetalleProducto = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    
    const [producto, setProducto] = useState(null);
    const [relacionados, setRelacionados] = useState([]); // Estado para productos similares
    const [loading, setLoading] = useState(true);
    const [imgPrincipal, setImgPrincipal] = useState("");
    const [openSection, setOpenSection] = useState('descripcion');

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                // 1. Obtener producto principal
                const res = await fetch(`${API_URL}/api/products/${id}`);
                const data = await res.json();
                setProducto(data);
                setImgPrincipal(data.images); 

                // 2. Obtener productos relacionados (misma categoría)
                if (data.categoryId) {
                    const resRel = await fetch(`${API_URL}/api/products?categoryId=${data.categoryId}`);
                    const dataRel = await resRel.json();
                    // Filtramos para no mostrar el producto actual en los recomendados
                    const filtrados = dataRel.filter(p => String(p.id) !== String(id)).slice(0, 4);
                    setRelacionados(filtrados);
                }

                setLoading(false);
                window.scrollTo(0, 0); // Volver arriba al cambiar de producto
            } catch (error) {
                console.error("Error:", error);
                setLoading(false);
            }
        };
        fetchDatos();
    }, [id]);

    if (loading || !producto) return <div className="bg-brand-dark min-h-screen"></div>;

    const galeriaBruta = Array.isArray(producto.gallery) ? producto.gallery : [];
    const fotosLimpias = [producto.images, ...galeriaBruta]
        .map(img => typeof img === 'string' ? img.trim() : '')
        .filter(img => img !== '');
    const fotosUnicas = Array.from(new Set(fotosLimpias));

    return (
        <div className="bg-brand-dark min-h-screen text-white font-sans py-20 px-4">
            <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
                    
                    {/* SECCIÓN DE IMÁGENES */}
                    <div className="space-y-6">
                        <div className="aspect-[4/5] bg-[#111111] border border-white/5 overflow-hidden relative flex items-center justify-center shadow-2xl">
                            <img 
                                src={imgPrincipal} 
                                alt={producto.title} 
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                            />
                            <div className="absolute top-8 left-8 bg-brand-orange text-white px-5 py-2 font-black uppercase italic text-[10px] tracking-widest shadow-2xl">
                                {producto.estado || "EXCLUSIVE STOCK"}
                            </div>
                        </div>

                        {fotosUnicas.length > 1 && (
                            <div className="grid grid-cols-5 gap-3">
                                {fotosUnicas.map((fotoUrl, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setImgPrincipal(fotoUrl)}
                                        className={`aspect-square border-2 transition-all duration-300 bg-[#111111] overflow-hidden ${
                                            imgPrincipal.trim() === fotoUrl.trim() 
                                            ? 'border-brand-orange opacity-100 scale-95' 
                                            : 'border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'
                                        }`}
                                    >
                                        <img src={fotoUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CONTENIDO Y DETALLES */}
                    <div className="flex flex-col">
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-brand-blue/20 text-brand-blue px-3 py-1 text-[9px] font-black uppercase italic tracking-widest border border-brand-blue/30">
                                    {producto.franchise}
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 leading-none text-white">
                                {producto.title}
                            </h1>
                            <p className="text-4xl font-black text-white italic">
                                ${Number(producto.price).toLocaleString('es-AR')}
                            </p>
                        </div>

                        <button 
                            onClick={() => addToCart(producto)}
                            className="w-full bg-brand-orange text-white py-6 font-black uppercase italic text-lg tracking-[0.2em] hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-4 mb-12 shadow-[10px_10px_0px_0px_rgba(255,90,0,0.15)] active:translate-y-1 active:shadow-none"
                        >
                            <ShoppingCart size={24} /> Add to Cart
                        </button>

                        <div className="border-t border-white/10 mt-4">
                            <AccordionItem title="Descripción del Producto" isOpen={openSection === 'descripcion'} onClick={() => setOpenSection('descripcion')}>
                                <p>{producto.description}</p>
                            </AccordionItem>

                            <AccordionItem title="Especificaciones Técnicas" isOpen={openSection === 'specs'} onClick={() => setOpenSection('specs')}>
                                <ul className="space-y-4">
                                    <li className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="uppercase text-[10px] font-black text-zinc-500 tracking-widest">Fabricante</span>
                                        <span className="text-white font-bold italic">{producto.fabricante || 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="uppercase text-[10px] font-black text-zinc-500 tracking-widest">Escala</span>
                                        <span className="text-white font-bold italic">{producto.escala || 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="uppercase text-[10px] font-black text-zinc-500 tracking-widest">Material</span>
                                        <span className="text-white font-bold italic">{producto.material || 'N/A'}</span>
                                    </li>
                                </ul>
                            </AccordionItem>
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN DE PRODUCTOS RELACIONADOS --- */}
                {relacionados.length > 0 && (
                    <div className="border-t border-white/5 pt-20">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <div className="flex items-center gap-2 text-brand-orange mb-2">
                                    <Tag size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sugerencias VNTG</span>
                                </div>
                                <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter">
                                    También te puede interesar
                                </h2>
                            </div>
                            <Link to="/categoria/all" className="group flex items-center gap-3 text-zinc-500 hover:text-brand-orange transition-all font-black uppercase italic text-xs">
                                Ver todo el catálogo <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relacionados.map((item) => (
                                <div key={item.id} className="group">
                                    <div className="relative aspect-[4/5] bg-[#111111] overflow-hidden border border-white/5">
                                        <Link to={`/producto/${item.id}`}>
                                            <img 
                                                src={item.images} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                                            />
                                        </Link>
                                    </div>
                                    <div className="mt-6">
                                        <Link to={`/producto/${item.id}`}>
                                            <h3 className="text-sm font-black uppercase italic text-white group-hover:text-brand-orange transition-colors truncate mb-4">
                                                {item.title}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                            <p className="text-xl font-black text-white italic">
                                                ${Number(item.price).toLocaleString('es-AR')}
                                            </p>
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="text-white hover:text-brand-orange transition-colors"
                                            >
                                                <ShoppingCart size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetalleProducto;