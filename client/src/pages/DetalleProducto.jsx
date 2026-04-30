import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, ShieldCheck, Truck, Gauge, Maximize2, Scale, CalendarDays, Box } from 'lucide-react';
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
        // BASE DE DATOS LOCAL CORREGIDA
        // Los IDs 3 y 4 corresponden a los que aparecen en tu imagen image_1d3760.jpg
        const dbSimulada = [
            {
                id: 3, 
                title: "Ecto-1 Cadillac Miller-Meteor Sentinel de 1959",
                price: 50000,
                description: "Increíble reproducción a escala del icónico vehículo de los Cazafantasmas. Pintura original y accesorios montados en el techo.",
                images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto-1_ehvzjx.webp",
                ficha: { 
                    estado: "Nuevo / Sellado", 
                    escala: "1:18 Premium", 
                    material: "Die-cast Metal y ABS", 
                    año: "2023 RE", 
                    fabricante: "Ecto Collectibles" 
                },
                gallery: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto-1_ehvzjx.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto3_c8eryw.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto2_r7c1ac.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto4_j7gn5f.webp"
                ]
            },
            {
                id: 4, 
                title: "1965 AC Shelby 427 Cobra",
                price: 55000,
                description: "La leyenda del automovilismo americano. Captura la agresividad del motor V8 y las curvas clásicas.",
                images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506219/cobra1_ulmge8.webp",
                ficha: { 
                    estado: "Nuevo / Sellado", 
                    escala: "1:18 Premium", 
                    material: "Resin Model", 
                    año: "1965 Classic", 
                    fabricante: "Shelby Collectibles" 
                },
                gallery: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506219/cobra1_ulmge8.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506220/cobra2_uf56q9.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506220/cobra3_lrtf17.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506220/cobra4_lta94p.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506220/cobra5_nd25vt.webp"
                ]
            },
            {
                id: 1, 
                title: "Batman (1989) Batmobile - Edición Coleccionista",
                price: 120000,
                description: "La representación definitiva del caballero de la noche. Un modelo imponente con acabado negro mate satinado y detalles de armamento oculto.",
                images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506233/batimobile_gpiwne.webp",
                ficha: { 
                    estado: "Nuevo / Sellado", 
                    escala: "1:18 Premium", 
                    material: "Die-cast Metal", 
                    año: "1989 (Movie RE)", 
                    fabricante: "DC Collectibles" 
                },
                gallery: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506233/batimobile_gpiwne.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506233/batimobile2_qirese.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506233/batimobile3_ufgpph.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506233/batimobile4_sc7mfs.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506234/batimobile5_wohvic.webp",
                ]
            },
            {
                id: 2, 
                title: "Delorean Time Machine - Back to the Future",
                price: 95000,
                description: "Viaja en el tiempo con esta réplica exacta de 1985. Incluye el condensador de flujo detallado y apertura de puertas de ala de gaviota.",
                images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506242/delorean1_ni8uvi.webp", 
                ficha: { 
                    estado: "Nuevo / Sellado", 
                    escala: "1:18 Premium", 
                    material: "Metal Inyectado", 
                    año: "1985 (Model RE)", 
                    fabricante: "Hot Wheels Elite" 
                },
                gallery: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506242/delorean1_ni8uvi.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506242/delorean3_fipewq.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506242/delorean2_grbzcw.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506242/delorean4_nndemy.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506243/delorean5_vmrkuc.webp",
                ]
            },
            {
                id: 5, 
                title: "Mercedes-Benz 300 SL Gullwing - Silver Edition",
                price: 150000,
                description: "El auto deportivo más icónico de la historia. Esta edición de coleccionista presenta interiores en cuero sintético y acabados cromados reales.",
                images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506251/mercedes1_ouo6sd.webp",
                ficha: { 
                    estado: "Nuevo / Sellado", 
                    escala: "1:18 Collector", 
                    material: "Die-Cast / Cuero", 
                    año: "1954 Classic", 
                    fabricante: "Minichamps"
                },
                gallery: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506251/mercedes1_ouo6sd.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506251/mercedes2_ltxccy.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506251/mercedes3_q0tdxv.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506251/mercedes4_h4sgza.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506252/mercedes5_ztosqm.webp",
                ]
            },
            {
                id: 6,
                title: "Mach 5 - Speed Racer (Meteor) Collector's Edition",
                price: 85000,
                description: "¡Go Speed Racer Go! Réplica del auto de carreras más famoso del anime con sus gadgets característicos y el domo transparente.",
                images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506267/meteoro1_iul29s.webp",
                ficha: { 
                    estado: "Nuevo / Sellado", 
                    escala: "1:18 High Detail", 
                    material: "Resina Premium", 
                    año: "Serie Clásica", 
                    fabricante: "AutoArt" 
                },
                gallery: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506267/meteoro1_iul29s.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506267/meteoro2_pyrgnw.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506268/meteoro3_fjeink.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506268/meteoro4_qkxsog.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506268/meteoro5_veqy2y.webp",
                ]
            },
            {
                id: 7,
                title: "1967 Ford Mustang GT Fastback - Red Passion",
                price: 85000,
                description: "Muscle car puro. Esta pieza captura la potencia americana con un motor detallado bajo el capó y pintura de alta resistencia.",
                images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506281/mustang_eotaku.webp",
                ficha: { 
                    estado: "Nuevo / Sellado", 
                    escala: "1:18 Classic", 
                    material: "Die-cast Heavy Metal", 
                    año: "1967", 
                    fabricante: "Shelby Collectibles" 
                },
                gallery: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506281/mustang_eotaku.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506281/mustang2_yox3oo.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506282/mustang3_rvfpbt.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506282/mustang4_bxr3xx.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506282/mustang5_akh9fh.webp",
                ]
            },
            {
                id: 8,
                title: "Fiat Palio Fire 1.4 G3 - Edición Limitada",
                price: 85000,
                description: "Una pieza de culto para el coleccionista local. Réplica fiel del Fiat Palio Fire G3 con detalles de motor y maletero, presentado en su caja de exhibición original de edición limitada.",
                images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777525854/palio1_mtc69b.webp",
                ficha: { 
                    estado: "Nuevo / Sellado", 
                    escala: "1:18 Collector", 
                    material: "Die-cast Metal", 
                    año: "G3 Classic", 
                    fabricante: "Fiat Official Model" 
                },
                gallery: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777525854/palio1_mtc69b.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777525854/palio2_ax9a2t.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777525854/palio3_mb39r9.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777525854/palio4_jvtwgh.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777526058/palio6_b8idc5.webp",
                ]
            }
        ];

        const data = dbSimulada.find(p => p.id === parseInt(id));
        if (data) {
            setProducto(data);
            setImgPrincipal(data.images);
        }
        setLoading(false);
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
        <div className="max-w-[1440px] mx-auto px-4 py-8 select-none bg-white dark:bg-neutral-900 transition-colors">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-400 hover:text-brand-orange mb-6 font-black text-[10px] uppercase tracking-[0.3em]">
                <ChevronLeft size={18} /> Volver al catálogo
            </button>

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 dark:border-zinc-800 pb-8 mb-8">
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
                    {producto.gallery.map((img, i) => (
                        <button 
                            key={i} 
                            onClick={() => setImgPrincipal(img)}
                            className={`flex-shrink-0 w-20 h-20 lg:w-full lg:h-auto aspect-square rounded-lg overflow-hidden border-2 transition-all 
                            ${imgPrincipal === img ? 'border-brand-orange scale-105 shadow-lg' : 'border-zinc-800 opacity-40 hover:opacity-100'}`}
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
                                <Box size={10} /> {producto.ficha.estado}
                            </span>
                        </div>
                        {!isZooming && (
                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Maximize2 size={14} /> Pasa el mouse para inspeccionar detalles
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 order-3 space-y-6">
                    <div className="p-8 bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
                        <h3 className="text-zinc-900 dark:text-white font-black italic mb-6 uppercase text-sm tracking-[0.2em] border-b-2 dark:border-zinc-700 pb-3">Detalle Técnico</h3>
                        <div className="space-y-6">
                            <p className="text-zinc-700 dark:text-zinc-200 text-base leading-relaxed font-medium italic">"{producto.description}"</p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-6 border-t dark:border-zinc-800 text-sm">
                                <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold">
                                    <Scale size={16} className="text-brand-orange" /> Escala: <span className="text-zinc-900 dark:text-white font-black">{producto.ficha.escala}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold">
                                    <CalendarDays size={16} className="text-brand-orange" /> Año: <span className="text-zinc-900 dark:text-white font-black">{producto.ficha.año}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold col-span-2">
                                    <Gauge size={16} className="text-brand-orange" /> Fabricante: <span className="text-zinc-900 dark:text-white font-black">{producto.ficha.fabricante}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-semibold col-span-2">
                                    <ShieldCheck size={16} className="text-green-500" /> Material: <span className="text-zinc-900 dark:text-white font-black">{producto.ficha.material}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 mt-10">
                            <div className="flex items-center gap-4 text-zinc-500 font-bold text-[10px] uppercase"><ShieldCheck size={18} className="text-green-500" /> Garantía de Autenticidad VNTG</div>
                            <div className="flex items-center gap-4 text-zinc-500 font-bold text-[10px] uppercase"><Truck size={18} className="text-brand-blue" /> Envío Asegurado Mendoza</div>
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
    );
};

export default DetalleProducto;