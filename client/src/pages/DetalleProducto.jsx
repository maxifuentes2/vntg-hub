import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ShoppingCart, ChevronLeft, ShieldCheck, Truck, Gauge, 
    Scale, CalendarDays, Box, Maximize2, ZoomIn, ZoomOut, X, Tag 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

// Definir la URL de tu API (ajusta según tu entorno)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AccordionItem = ({ title, children, isOpen, onClick }) => (
    <div className="border-b border-zinc-200 dark:border-white/10">
        <button 
            onClick={onClick}
            className="w-full py-4 flex justify-between items-center font-black uppercase italic text-xs tracking-widest text-zinc-900 dark:text-white"
        >
            {title}
            <span>{isOpen ? '-' : '+'}</span>
        </button>
        {isOpen && <div className="pb-6 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{children}</div>}
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
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isHoverZoom, setIsHoverZoom] = useState(false);

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                // Intento de fetch real
                const res = await fetch(`${API_URL}/api/products/${id}`);
                if (!res.ok) throw new Error("No encontrado");
                const data = await res.json();
                
                setProducto(data);
                setImgPrincipal(data.images);

                if (data.categoryId) {
                    const resRel = await fetch(`${API_URL}/api/products?categoryId=${data.categoryId}`);
                    const dataRel = await resRel.json();
                    setRelacionados(dataRel.filter(p => String(p.id) !== String(id)).slice(0, 4));
                }
            } catch (error) {
                console.error("Error cargando producto, usando fallback local:", error);
                // Aquí podrías poner tu dbSimulada si la API falla
            } finally {
                setLoading(false);
                window.scrollTo(0, 0);
            }
        };

        fetchDatos();
    }, [id]);

    const handleMouseMove = (e) => {
        if (!isHoverZoom) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPosition({ x, y });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white font-black italic uppercase tracking-widest">Catalogando Pieza...</div>;
    if (!producto) return <div className="min-h-screen flex items-center justify-center bg-black text-white italic font-black">PRODUCTO NO ENCONTRADO</div>;

    const fotosUnicas = Array.from(new Set([producto.images, ...(producto.gallery || [])])).filter(img => img);

    return (
        <div className="bg-white dark:bg-neutral-900 min-h-screen transition-colors duration-300">
            <div className="max-w-[1440px] mx-auto px-4 py-20">
                
                {/* BOTÓN VOLVER */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-brand-orange mb-8 font-black text-[10px] uppercase tracking-[0.3em] transition-colors">
                    <ChevronLeft size={18} /> Volver al catálogo
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* COLUMNA IZQUIERDA: GALERÍA */}
                    <div className="lg:col-span-1 flex lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                        {fotosUnicas.map((img, i) => (
                            <button 
                                key={i} 
                                onClick={() => setImgPrincipal(img)}
                                className={`flex-shrink-0 w-20 h-20 lg:w-full lg:h-auto aspect-square rounded-lg overflow-hidden border-2 transition-all 
                                ${imgPrincipal === img ? 'border-brand-orange scale-105 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 opacity-40 hover:opacity-100'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="miniatura" />
                            </button>
                        ))}
                    </div>

                    {/* COLUMNA CENTRAL: IMAGEN PRINCIPAL */}
                    <div className="lg:col-span-7 order-1 lg:order-2">
                        <div 
                            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 dark:border-zinc-800 cursor-zoom-in group"
                            onMouseMove={handleMouseMove}
                            onMouseEnter={() => setIsHoverZoom(true)}
                            onMouseLeave={() => { setIsHoverZoom(false); setZoomPosition({ x: 0, y: 0 }); }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <img 
                                src={imgPrincipal} 
                                style={{
                                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                    transform: isHoverZoom ? 'scale(2.2)' : 'scale(1)',
                                }}
                                className="w-full h-full object-contain transition-transform duration-200 ease-out p-8" 
                                alt={producto.title} 
                            />
                            <div className="absolute top-4 left-4 bg-brand-orange text-white px-3 py-1 font-black uppercase italic text-[10px] tracking-widest rounded-sm">
                                {producto.estado || "NUEVO / SELLADO"}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: INFO Y COMPRA */}
                    <div className="lg:col-span-4 order-3 space-y-8">
                        <div>
                            <span className="text-brand-blue font-black italic text-[10px] uppercase tracking-[0.2em] mb-2 block">
                                {producto.franchise || "Coleccionables Premium"}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black dark:text-white italic uppercase tracking-tighter leading-none mb-4">
                                {producto.title}
                            </h1>
                            <p className="text-4xl font-black text-brand-orange italic">
                                ${Number(producto.price).toLocaleString('es-AR')}
                            </p>
                        </div>

                        <button 
                            onClick={() => addToCart(producto)}
                            className="w-full bg-brand-orange hover:bg-zinc-900 text-white py-6 font-black uppercase italic text-lg tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(255,90,0,0.2)] active:translate-y-1 active:shadow-none"
                        >
                            <ShoppingCart size={24} /> Añadir al Carrito
                        </button>

                        <div className="space-y-1">
                            <AccordionItem title="Descripción" isOpen={openSection === 'descripcion'} onClick={() => setOpenSection('descripcion')}>
                                {producto.description}
                            </AccordionItem>

                            <AccordionItem title="Ficha Técnica" isOpen={openSection === 'specs'} onClick={() => setOpenSection('specs')}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 font-bold"><Scale size={14} className="text-brand-orange"/> Escala: {producto.escala || '1:18'}</div>
                                    <div className="flex items-center gap-2 font-bold"><Gauge size={14} className="text-brand-orange"/> Marca: {producto.fabricante || 'Original'}</div>
                                    <div className="flex items-center gap-2 font-bold"><ShieldCheck size={14} className="text-green-500"/> Material: {producto.material || 'Metal'}</div>
                                    <div className="flex items-center gap-2 font-bold"><Box size={14} className="text-brand-blue"/> Estado: {producto.estado || 'MINT'}</div>
                                </div>
                            </AccordionItem>
                        </div>

                        <div className="pt-4 space-y-3 border-t dark:border-zinc-800">
                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-zinc-500">
                                <Truck size={16} className="text-brand-blue" /> Envío Asegurado a todo el país
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-zinc-500">
                                <ShieldCheck size={16} className="text-green-500" /> Garantía de Autenticidad VNTG
                            </div>
                        </div>
                    </div>
                </div>

                {/* PRODUCTOS RELACIONADOS */}
                {relacionados.length > 0 && (
                    <div className="mt-32 pt-20 border-t dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-12">
                            <Tag className="text-brand-orange" size={20} />
                            <h2 className="text-2xl font-black uppercase italic dark:text-white">También te puede interesar</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relacionados.map((item) => (
                                <Link key={item.id} to={`/producto/${item.id}`} className="group">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 aspect-square rounded-xl overflow-hidden mb-4 p-6 flex items-center justify-center">
                                        <img src={item.images} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={item.title}/>
                                    </div>
                                    <h3 className="font-black uppercase italic text-xs dark:text-white group-hover:text-brand-orange transition-colors truncate">{item.title}</h3>
                                    <p className="font-black text-lg text-brand-orange">${Number(item.price).toLocaleString('es-AR')}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL FULLSCREEN ZOOM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <button className="absolute top-8 right-8 text-white/50 hover:text-brand-orange transition-all"><X size={40} /></button>
                    <img 
                        src={imgPrincipal} 
                        style={{ transform: `scale(${zoomLevel})` }}
                        className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
                        onClick={(e) => e.stopPropagation()}
                        alt="Zoom View"
                    />
                    <div className="absolute bottom-10 flex items-center gap-6 bg-zinc-900 px-6 py-3 rounded-full border border-white/10" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="text-white hover:text-brand-orange"><ZoomOut /></button>
                        <span className="text-white font-black w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))} className="text-white hover:text-brand-orange"><ZoomIn /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleProducto;