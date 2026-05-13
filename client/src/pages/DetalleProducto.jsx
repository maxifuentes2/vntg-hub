import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ShoppingCart, ChevronLeft, ShieldCheck, Truck, Gauge, 
    Scale, CalendarDays, Box, Maximize2, ZoomIn, ZoomOut, X, Tag, ArrowRight, Plus, Minus 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AccordionItem = ({ title, children, isOpen, onClick }) => (
    <div className="border-b border-zinc-200 dark:border-white/10">
        <button 
            onClick={onClick}
            className="w-full py-6 flex justify-between items-center group hover:text-brand-orange text-zinc-900 dark:text-white transition-colors"
        >
            <span className="text-sm font-black uppercase italic tracking-widest">{title}</span>
            {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 pb-8' : 'max-h-0'}`}>
            <div className="text-zinc-600 dark:text-zinc-400 text-sm font-medium leading-relaxed italic">
                {children}
            </div>
        </div>
    </div>
);

const DetalleProducto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    
    const [producto, setProducto] = useState(null);
    const [relacionados, setRelacionados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imgPrincipal, setImgPrincipal] = useState("");
    const [openSection, setOpenSection] = useState('descripcion');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const res = await fetch(`${API_URL}/api/products/${id}`);
                const data = await res.json();
                setProducto(data);
                setImgPrincipal(data.images);

                if (data.categoryId) {
                    const resRel = await fetch(`${API_URL}/api/products?categoryId=${data.categoryId}`);
                    const dataRel = await resRel.json();
                    const filtrados = dataRel.filter(p => String(p.id) !== String(id)).slice(0, 4);
                    setRelacionados(filtrados);
                }
                setLoading(false);
                window.scrollTo(0, 0); 
            } catch (error) {
                console.error("Error:", error);
                setLoading(false);
            }
        };
        fetchDatos();
    }, [id]);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') setIsModalOpen(false); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleWheel = (e) => {
        if (!isModalOpen) return;
        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(1, zoomLevel + delta), 4);
        setZoomLevel(newZoom);
    };

    if (loading || !producto) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark font-black italic uppercase tracking-widest text-zinc-400">Catalogando Pieza...</div>;

    const fotosUnicas = Array.from(new Set([producto.images, ...(producto.gallery || [])])).filter(img => img && img.trim() !== '');

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen text-zinc-900 dark:text-white font-sans py-20 px-4 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto">
                
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-brand-orange mb-8 font-black text-[10px] uppercase tracking-[0.3em] transition-colors">
                    <ChevronLeft size={18} /> Volver al catálogo
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-32 items-start">
                    
                    {/* IMÁGENES */}
                    <div className="flex flex-col gap-6">
                        <div 
                            className="relative w-full bg-[#f8f8f8] dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 overflow-hidden flex items-center justify-center shadow-xl cursor-zoom-in group rounded-sm"
                            onClick={() => { setIsModalOpen(true); setZoomLevel(1); }}
                        >
                            <img 
                                src={imgPrincipal} 
                                alt={producto.title} 
                                className="w-full h-auto max-h-[80vh] object-contain transition-transform duration-700 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                            </div>
                            <div className="absolute top-6 left-6 bg-brand-orange text-white px-4 py-1.5 font-black uppercase italic text-[10px] tracking-widest shadow-xl">
                                {producto.estado || "EXCLUSIVE STOCK"}
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {fotosUnicas.map((fotoUrl, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setImgPrincipal(fotoUrl)}
                                    className={`aspect-square border transition-all duration-300 bg-[#f8f8f8] dark:bg-[#111111] p-1 ${
                                        imgPrincipal.trim() === fotoUrl.trim() 
                                        ? 'border-brand-orange opacity-100' 
                                        : 'border-transparent opacity-50 hover:opacity-100'
                                    }`}
                                >
                                    <img src={fotoUrl} alt="Thumb" className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* INFORMACIÓN */}
                    <div className="flex flex-col pt-4">
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue px-3 py-1 text-[9px] font-black uppercase italic tracking-widest border border-brand-blue/30">
                                    {producto.franchise || "VNTG SERIES"}
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 leading-[0.9]">
                                {producto.title}
                            </h1>
                            <p className="text-4xl font-black italic text-zinc-900 dark:text-white mt-4">
                                ${Number(producto.price).toLocaleString('es-AR')}
                            </p>
                        </div>

                        <button 
                            onClick={() => addToCart(producto)}
                            className="w-full bg-brand-orange text-white py-6 font-black uppercase italic text-lg tracking-[0.2em] hover:bg-zinc-900 transition-all flex items-center justify-center gap-4 mb-10 shadow-[8px_8px_0px_0px_rgba(255,90,0,0.2)] active:translate-y-1 active:shadow-none"
                        >
                            <ShoppingCart size={24} /> Agregar al Carrito
                        </button>

                        <div className="border-t border-zinc-200 dark:border-white/10">
                            <AccordionItem title="Descripción" isOpen={openSection === 'descripcion'} onClick={() => setOpenSection('descripcion')}>
                                <p>{producto.description}</p>
                            </AccordionItem>

                            <AccordionItem title="Ficha Técnica" isOpen={openSection === 'specs'} onClick={() => setOpenSection('specs')}>
                                <ul className="space-y-4">
                                    <li className="flex justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                                        <span className="uppercase text-[10px] font-black text-zinc-500 tracking-widest">Escala</span>
                                        <span className="font-bold italic">{producto.escala || 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                                        <span className="uppercase text-[10px] font-black text-zinc-500 tracking-widest">Material</span>
                                        <span className="font-bold italic">{producto.material || 'Premium'}</span>
                                    </li>
                                    <li className="flex justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                                        <span className="uppercase text-[10px] font-black text-zinc-500 tracking-widest">Marca</span>
                                        <span className="font-bold italic">{producto.fabricante || 'Original'}</span>
                                    </li>
                                </ul>
                            </AccordionItem>
                        </div>
                    </div>
                </div>

                {/* RELACIONADOS */}
                {relacionados.length > 0 && (
                    <div className="border-t border-zinc-200 dark:border-white/5 pt-20">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <div className="flex items-center gap-2 text-brand-orange mb-2">
                                    <Tag size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sugerencias VNTG</span>
                                </div>
                                <h2 className="text-4xl font-black uppercase italic text-zinc-900 dark:text-white tracking-tighter">
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
                                    <div className="relative w-full bg-[#f8f8f8] dark:bg-[#111111] overflow-hidden border border-zinc-200 dark:border-white/5 transition-colors duration-300">
                                        <Link to={`/producto/${item.id}`}>
                                            <img 
                                                src={item.images} 
                                                alt={item.title} 
                                                className="w-full h-auto object-contain p-4 transition-transform duration-700 group-hover:scale-110" 
                                            />
                                        </Link>
                                    </div>
                                    <div className="mt-6">
                                        <Link to={`/producto/${item.id}`}>
                                            <h3 className="text-sm font-black uppercase italic text-zinc-900 dark:text-white group-hover:text-brand-orange transition-colors truncate mb-4">
                                                {item.title}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-4">
                                            <p className="text-xl font-black text-zinc-900 dark:text-white italic">
                                                ${Number(item.price).toLocaleString('es-AR')}
                                            </p>
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="text-zinc-900 dark:text-white hover:text-brand-orange transition-colors"
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

            {/* MODAL FULLSCREEN */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/98 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
                    onWheel={handleWheel}
                    onClick={() => setIsModalOpen(false)}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                        className="absolute top-8 right-8 text-white/50 hover:text-brand-orange transition-all z-[10000] p-2 hover:rotate-90"
                    >
                        <X size={40} />
                    </button>
                    
                    <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={imgPrincipal} 
                            style={{ transform: `scale(${zoomLevel})` }}
                            className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out shadow-2xl"
                            alt="Zoom View"
                        />
                    </div>

                    <div className="absolute bottom-10 flex items-center gap-6 bg-zinc-900/80 px-6 py-3 rounded-full border border-white/10 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="text-white hover:text-brand-orange"><ZoomOut size={24}/></button>
                        <span className="text-white font-black italic text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))} className="text-white hover:text-brand-orange"><ZoomIn size={24}/></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleProducto;