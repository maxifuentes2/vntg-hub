// IMPORTACIONES
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ShoppingCart, ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut, X, 
    Tag, ArrowRight, Plus, Minus, Heart, ShieldCheck 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishList } from '../context/WishListContext'; 
import { useCurrency } from '../context/CurrencyContext'; 
import { calculateDiscountedPrice } from '../utils/priceUtils';
import { slugify } from '../utils/slugify';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Imagen con efecto hover que muestra la segunda foto de la galería
const CardImage = ({ item }) => {
    const gallery = (() => {
        if (!item.gallery) return [];
        if (Array.isArray(item.gallery)) return item.gallery;
        try { return JSON.parse(item.gallery); } catch { return []; }
    })();
    const hoverImg = gallery.find(img => img && img !== item.images);
    if (!hoverImg) {
        return <img src={item.images} alt={item.title} className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />;
    }
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <img src={item.images} alt={item.title} className="absolute max-w-full max-h-full object-contain opacity-90 group-hover:opacity-0 transition-opacity duration-500 rounded-2xl" />
            <img src={hoverImg} alt={item.title} className="absolute max-w-full max-h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
        </div>
    );
};

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
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();
    const { addToWishList, removeFromWishList, wishListItems } = useWishList(); 
    
    const [producto, setProducto] = useState(null);
    const [relacionados, setRelacionados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imgPrincipal, setImgPrincipal] = useState("");
    const [openSection, setOpenSection] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDraggingCursor, setIsDraggingCursor] = useState(false);
    const isDraggingRef = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    const handleMouseDown = (e) => {
        if (zoomLevel <= 1) return;
        e.stopPropagation();
        isDraggingRef.current = true;
        setIsDraggingCursor(true);
        dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        setIsDraggingCursor(false);
    };

    // NUEVO: Escuchar la tecla ESC para cerrar el modal
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const res = await fetch(`${API_URL}/api/products/${slug}`);
                const data = await res.json();
                
                let gallery = data.gallery;
                if (typeof gallery === 'string') {
                    try { gallery = JSON.parse(gallery); } catch(e) { gallery = []; }
                }

                setProducto({ ...data, gallery: gallery || [] });
                setImgPrincipal(data.images);

                if (data.categoryId) {
                    const resRel = await fetch(`${API_URL}/api/products?categoryId=${data.categoryId}`);
                    const dataRel = await resRel.json();
                    setRelacionados(dataRel.filter(p => slugify(p.title) !== slug).slice(0, 4));
                }
                
                setLoading(false);
                window.scrollTo(0, 0); 
            } catch (error) {
                console.error("Error al cargar datos:", error);
                setLoading(false);
            }
        };
        fetchDatos();
    }, [slug]);

    // Actualizar el título de la página dinámicamente con el nombre del producto
    useEffect(() => {
        if (producto && producto.title) {
            document.title = `VNTG HUB - ${producto.title}`;
        }
    }, [producto]);

    const handleWheel = (e) => {
        if (!isModalOpen) return;
        const delta = e.deltaY * -0.001;
        setZoomLevel(prev => {
            const next = Math.min(Math.max(1, prev + delta), 4);
            if (next <= 1) setPan({ x: 0, y: 0 });
            return next;
        });
    };

    if (loading || !producto) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark font-black italic uppercase tracking-widest text-zinc-400">Catalogando Pieza...</div>;

    const fotosUnicas = Array.from(new Set([
        producto.images, 
        ...(Array.isArray(producto.gallery) ? producto.gallery : [])
    ])).filter(img => img && typeof img === 'string' && img.trim() !== '');

    const isInWishlist = wishListItems.some(item => String(item.id) === String(producto.id));

    return (
        <div className="bg-transparent min-h-screen text-zinc-900 dark:text-white font-sans py-12 px-3 max-[400px]:py-8 transition-colors relative overflow-hidden">
            
            <div className="max-w-[1400px] mx-auto">
                
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-brand-orange mb-8 font-black text-[10px] uppercase tracking-[0.3em] transition-colors mt-10">
                    <ChevronLeft size={18} /> Volver al catálogo
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xs:gap-12 lg:gap-20 mb-32 items-start">
                    <div className="flex flex-col gap-6">
                        <div 
                            className="relative w-full aspect-square md:aspect-[4/3] bg-transparent flex items-center justify-center cursor-zoom-in group"
                            onClick={() => { setIsModalOpen(true); setZoomLevel(1); }}
                        >
                            <img src={imgPrincipal} alt={producto.title} className="max-w-full max-h-full object-contain drop-shadow-md dark:drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900" />
                            
                            <div className="absolute top-6 left-6 bg-brand-orange text-white px-4 py-1.5 font-black uppercase italic text-[10px] tracking-widest shadow-xl rounded-full z-30">
                                {producto.stock === 0 ? 'SIN STOCK' : (producto.estado || 'STOCK EXCLUSIVO')}
                            </div>

                            {fotosUnicas.length > 1 && fotosUnicas.indexOf(imgPrincipal) > 0 && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = fotosUnicas.indexOf(imgPrincipal);
                                        setImgPrincipal(fotosUnicas[currentIndex - 1]);
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-white p-3 rounded-full shadow-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            )}

                            {fotosUnicas.length > 1 && fotosUnicas.indexOf(imgPrincipal) < fotosUnicas.length - 1 && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = fotosUnicas.indexOf(imgPrincipal);
                                        setImgPrincipal(fotosUnicas[currentIndex + 1]);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-white p-3 rounded-full shadow-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </div>

                        {fotosUnicas.length > 1 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {fotosUnicas.map((fotoUrl) => (
                                    <button 
                                        key={fotoUrl}
                                        onClick={() => setImgPrincipal(fotoUrl)}
                                        className={`aspect-square transition-all duration-300 flex items-center justify-center ${imgPrincipal === fotoUrl ? 'scale-95' : 'opacity-40 hover:opacity-100 hover:scale-95'}`}
                                    >
                                        <img 
                                            src={fotoUrl} 
                                            alt="Thumb" 
                                            className={`max-w-full max-h-full object-contain drop-shadow-md rounded-2xl transition-all ${imgPrincipal === fotoUrl ? 'ring-2 ring-brand-orange ring-offset-4 ring-offset-zinc-50 dark:ring-offset-[#111]' : ''}`} 
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col pt-4">
                        <div className="mb-8">
                            <span className="bg-brand-blue/10 text-brand-blue px-3 py-1 text-[9px] font-black uppercase italic tracking-widest border border-brand-blue/30 mb-6 inline-block rounded-full">
                                {producto.franchise || "SERIE VNTG"}
                            </span>
                            <h1 className="text-3xl max-[400px]:text-2xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 leading-[0.9]">{producto.title}</h1>
                            
                            {/* PRECIO Y STOCK */}
                            <div className="flex flex-col mt-4">
                                <div className="flex flex-col">
                                    {producto.discount_percentage > 0 ? (
                                        <>
                                            <p className="text-lg line-through text-zinc-400 font-bold">{formatPrice(producto.price)}</p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-3xl max-[400px]:text-2xl font-black italic text-brand-orange">{formatPrice(calculateDiscountedPrice(producto.price, producto.discount_percentage))}</p>
                                                <span className="text-sm bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full font-bold">-{producto.discount_percentage}% OFF</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-3xl max-[400px]:text-2xl font-black italic text-brand-orange">{formatPrice(producto.price)}</p>
                                    )}
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
                                    Stock Disponible: <span className={producto.stock === 0 ? 'text-red-500' : 'text-zinc-900 dark:text-white'}>{producto.stock ?? '0'}</span>
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => addToCart(producto)} 
                            disabled={producto.stock === 0}
                            className={`w-full py-6 max-[360px]:py-4 font-black uppercase italic text-lg max-[360px]:text-sm tracking-[0.2em] max-[360px]:tracking-widest transition-all flex items-center justify-center gap-4 max-[360px]:gap-2 mb-4 shadow-xl active:translate-y-1 rounded-2xl ${producto.stock === 0 ? 'bg-zinc-200 cursor-not-allowed text-zinc-400' : 'bg-brand-orange text-white hover:bg-zinc-900'}`}
                        >
                            <ShoppingCart size={24} /> {producto.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>

                        <button 
                            onClick={() => isInWishlist ? removeFromWishList(producto.id) : addToWishList(producto)} 
                            className={`w-full border py-4 max-[360px]:py-3 font-black uppercase italic text-xs max-[360px]:text-[9px] tracking-[0.2em] max-[360px]:tracking-wider transition-all flex items-center justify-center gap-3 max-[360px]:gap-1.5 mb-10 rounded-xl ${
                                isInWishlist 
                                ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-500 hover:bg-green-500/20' 
                                : 'bg-transparent border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-brand-orange hover:text-brand-orange'
                            }`}
                        >
                            <Heart size={18} className={isInWishlist ? "fill-current" : ""} /> 
                            {isInWishlist 
                                ? 'Añadido a la lista de deseos' 
                                : (producto.stock === 0 ? 'Avísame cuando haya stock' : 'Agregar a la lista de deseos')
                            }
                        </button>

                        <div className="border-t border-white/10">
                            <AccordionItem 
                                title="Descripción" 
                                isOpen={openSection === 'descripcion'} 
                                onClick={() => setOpenSection(openSection === 'descripcion' ? null : 'descripcion')}
                            >
                                <p>{producto.description}</p>
                            </AccordionItem>

                            <AccordionItem 
                                title="Ficha Técnica" 
                                isOpen={openSection === 'specs'} 
                                onClick={() => setOpenSection(openSection === 'specs' ? null : 'specs')}
                            >
                                <ul className="space-y-4">
                                    <li className="flex justify-between border-b border-white/5 pb-2"><span className="uppercase text-[10px] font-black text-zinc-500">Escala</span><span className="font-bold italic">{producto.escala || 'N/A'}</span></li>
                                    <li className="flex justify-between border-b border-white/5 pb-2"><span className="uppercase text-[10px] font-black text-zinc-500">Material</span><span className="font-bold italic">{producto.material || 'Premium'}</span></li>
                                    <li className="flex justify-between border-b border-white/5 pb-2"><span className="uppercase text-[10px] font-black text-zinc-500">Marca</span><span className="font-bold italic">{producto.fabricante || 'Original'}</span></li>
                                    <li className="flex justify-between border-b border-white/5 pb-2"><span className="uppercase text-[10px] font-black text-zinc-500">Año</span><span className="font-bold italic">{producto.anio || 'N/A'}</span></li>
                                </ul>
                            </AccordionItem>
                        </div>
                    </div>
                </div>

                {relacionados.length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-20">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <div className="flex items-center gap-2 text-brand-orange mb-2">
                                    <Tag size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sugerencias VNTG</span>
                                </div>
                                <h2 className="text-2xl max-[400px]:text-xl font-black uppercase italic text-zinc-900 dark:text-white tracking-tighter">También te puede interesar</h2>
                            </div>
                            <Link to="/categoria/all" className="group flex items-center gap-3 text-zinc-500 hover:text-brand-orange transition-all font-black uppercase italic text-xs">
                                Ver catálogo completo <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relacionados.map((item) => {
                                const isWished = wishListItems.some(wItem => String(wItem.id) === String(item.id));
                                return (
                                    <div key={item.id} className={`group h-full flex flex-col bg-zinc-50 dark:bg-brand-card transition-all duration-500 border-2 border-transparent hover:border-brand-orange hover:shadow-2xl shadow-md rounded-3xl overflow-hidden ${item.stock === 0 ? 'opacity-60' : ''}`}>
                                        <div className="aspect-[16/10] bg-transparent relative overflow-hidden flex items-center justify-center p-4 border-b border-white/20 dark:border-zinc-600 shrink-0">
                                            <Link to={`/producto/${slugify(item.title)}`} className="w-full h-full flex items-center justify-center">
                                                <CardImage item={item} />
                                            </Link>
                                            <div className="absolute top-4 left-4 bg-brand-blue text-white px-3 py-1 text-[9px] font-black uppercase italic tracking-widest z-10 rounded-full">
                                                {item.stock === 0 ? "AGOTADO" : (item.estado || "MINT")}
                                            </div>
                                        </div>
                                        <div className="p-3 xs:p-4 sm:p-8 flex flex-col grow justify-between">
                                            <Link to={`/producto/${slugify(item.title)}`}>
                                                <h3 className="text-base max-[400px]:text-sm font-black uppercase italic text-zinc-900 dark:text-white group-hover:text-brand-orange transition-colors truncate mb-6">{item.title}</h3>
                                            </Link>
                                            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6 mt-auto">
                                                <div className="flex flex-col">
                                                    {item.discount_percentage > 0 ? (
                                                        <>
                                                            <p className="text-xs line-through text-zinc-400 font-bold">{formatPrice(item.price)}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black italic text-brand-orange text-lg">
                                                                    {formatPrice(calculateDiscountedPrice(item.price, item.discount_percentage))}
                                                                </span>
                                                                <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full font-bold">-{item.discount_percentage}%</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="font-black italic text-brand-orange text-lg">
                                                            {formatPrice(item.price)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (isWished) { removeFromWishList(item.id); } else { addToWishList(item); } }}
                                                        className={`${isWished ? 'text-brand-orange' : 'text-zinc-400 hover:text-brand-orange'} transition-colors duration-300 p-2`}
                                                        title={isWished ? "Quitar de deseados" : "Añadir a deseados"}
                                                    >
                                                        <Heart size={24} fill={isWished ? "currentColor" : "none"} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(item); }}
                                                        disabled={item.stock === 0}
                                                        className={`p-3.5 transition-all duration-300 shadow-lg active:scale-95 rounded-2xl ${item.stock === 0 ? 'bg-zinc-200 cursor-not-allowed text-zinc-400' : 'bg-brand-blue text-white hover:bg-brand-orange'}`}
                                                    >
                                                        <ShoppingCart size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/85 flex flex-col p-4" 
                    onWheel={handleWheel} 
                    onClick={() => { if (!isDraggingRef.current) setIsModalOpen(false); }}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 md:top-8 right-4 md:right-8 z-50 text-white/60 hover:text-white transition-all cursor-pointer"
                    >
                        <X size={36} />
                    </button>

                    {/* Botón Anterior */}
                    {fotosUnicas.length > 1 && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = fotosUnicas.indexOf(imgPrincipal);
                                const prevIndex = (currentIndex - 1 + fotosUnicas.length) % fotosUnicas.length;
                                setImgPrincipal(fotosUnicas[prevIndex]);
                                setZoomLevel(1);
                                setPan({ x: 0, y: 0 });
                            }}
                            className="absolute left-2 xs:left-4 md:left-12 z-50 text-white/40 hover:text-white transition-all cursor-pointer p-2 top-1/2 -translate-y-1/2"
                        >
                            <ChevronLeft size={44} />
                        </button>
                    )}

                    <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                        <img 
                            src={imgPrincipal} 
                            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` }} 
                            className={`max-w-full max-h-full object-contain drop-shadow-2xl rounded-2xl ${zoomLevel > 1 ? (isDraggingCursor ? 'cursor-grabbing' : 'cursor-grab') : ''} ${zoomLevel > 1 ? 'transition-none' : 'transition-transform duration-300'}`}
                            alt="Zoom" 
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => { if (zoomLevel > 1) { e.stopPropagation(); const t = e.touches[0]; isDraggingRef.current = true; setIsDraggingCursor(true); dragStart.current = { x: t.clientX, y: t.clientY, panX: pan.x, panY: pan.y }; } }}
                            onTouchMove={(e) => { if (!isDraggingRef.current) return; const t = e.touches[0]; setPan({ x: dragStart.current.panX + (t.clientX - dragStart.current.x), y: dragStart.current.panY + (t.clientY - dragStart.current.y) }); }}
                            onTouchEnd={() => { isDraggingRef.current = false; setIsDraggingCursor(false); }}
                        />
                    </div>
                    
                    {/* Botón Siguiente */}
                    {fotosUnicas.length > 1 && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = fotosUnicas.indexOf(imgPrincipal);
                                const nextIndex = (currentIndex + 1) % fotosUnicas.length;
                                setImgPrincipal(fotosUnicas[nextIndex]);
                                setZoomLevel(1);
                                setPan({ x: 0, y: 0 });
                            }}
                            className="absolute right-2 xs:right-4 md:right-12 z-50 text-white/40 hover:text-white transition-all cursor-pointer p-2 top-1/2 -translate-y-1/2"
                        >
                            <ChevronRight size={44} />
                        </button>
                    )}

                    <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[100]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-6 bg-zinc-900/80 px-5 md:px-6 py-2.5 md:py-3 rounded-xl shadow-xl">
                            <button onClick={() => { setZoomLevel(prev => { const next = Math.max(1, prev - 0.5); if (next <= 1) setPan({ x: 0, y: 0 }); return next; }); }} className="text-white/50 hover:text-white transition-all"><ZoomOut size={22}/></button>
                            <span className="text-white/80 font-black italic text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={() => setZoomLevel(prev => Math.min(4, prev + 0.5))} className="text-white/50 hover:text-white transition-all"><ZoomIn size={22}/></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleProducto;