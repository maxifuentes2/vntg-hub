import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Box, ArrowRight, Loader, ChevronDown, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishList } from '../context/WishListContext';
import { useCurrency } from '../context/CurrencyContext';
import { calculateDiscountedPrice } from '../utils/priceUtils';
import Reveal from '../components/Reveal';
import TypewriterText from '../components/TypewriterText';
import { slugify } from '../utils/slugify';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Componente de imagen con hover para mostrar segunda foto de galería
const CardImage = ({ item }) => {
    const { formatPrice } = useCurrency();
    const gallery = (() => {
        if (!item.gallery) return [];
        if (Array.isArray(item.gallery)) return item.gallery;
        try { return JSON.parse(item.gallery); } catch { return []; }
    })();
    const hoverImg = gallery.find(img => img && img !== item.images);

    if (!hoverImg) {
        return item.images
            ? <img src={item.images} alt={item.title} className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            : <Box size={40} className="text-zinc-300 dark:text-white/5" />;
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <img
                src={item.images}
                alt={item.title}
                className="absolute max-w-full max-h-full object-contain opacity-90 group-hover:opacity-0 transition-opacity duration-500 rounded-2xl"
            />
            <img
                src={hoverImg}
                alt={item.title}
                className="absolute max-w-full max-h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
            />
        </div>
    );
};

const ProductCarousel = ({ items, addToCart, addToWishList, wishListItems = [], removeFromWishList }) => {
    const { formatPrice } = useCurrency();
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(Math.ceil(scrollLeft) + clientWidth < scrollWidth);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [items]);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400; 
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative group/carousel sm:px-16 md:px-20 lg:px-24">
            {items.length > 3 && (
                <>
                    <button 
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className="absolute hidden sm:flex sm:left-0 md:left-2 lg:left-4 top-[45%] -translate-y-1/2 z-20 bg-white dark:bg-zinc-800 text-zinc-400 hover:text-brand-orange dark:text-zinc-500 dark:hover:text-brand-orange w-10 h-10 sm:w-14 sm:h-14 items-center justify-center rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300 hover:bg-brand-orange/10 dark:hover:bg-brand-orange/20 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none border border-zinc-200 dark:border-zinc-700 hover:border-brand-orange hover:shadow-brand-orange/20"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <button 
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className="absolute hidden sm:flex sm:right-0 md:right-2 lg:right-4 top-[45%] -translate-y-1/2 z-20 bg-white dark:bg-zinc-800 text-zinc-400 hover:text-brand-orange dark:text-zinc-500 dark:hover:text-brand-orange w-10 h-10 sm:w-14 sm:h-14 items-center justify-center rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300 hover:bg-brand-orange/10 dark:hover:bg-brand-orange/20 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none border border-zinc-200 dark:border-zinc-700 hover:border-brand-orange hover:shadow-brand-orange/20"
                    >
                        <ChevronRight size={28} />
                    </button>
                </>
            )}

            <div 
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex overflow-x-auto gap-4 sm:gap-6 pb-2 snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map(item => {
                    const isWished = wishListItems.some(wItem => String(wItem.id) === String(item.id));
                    
                    return (
                        <div key={item.id} className="w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start shrink-0">
                            <div className={`group h-full flex flex-col bg-zinc-50 dark:bg-brand-card transition-all duration-500 border-2 border-transparent hover:border-brand-orange hover:shadow-2xl shadow-md rounded-3xl overflow-hidden ${item.stock === 0 ? 'opacity-60' : ''}`}>
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
                                        <h3 className="text-base max-[400px]:text-sm font-black uppercase italic text-zinc-900 dark:text-white group-hover:text-brand-orange transition-colors truncate mb-6">
                                            {item.title}
                                        </h3>
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
                                                onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    e.stopPropagation(); 
                                                    if (isWished) {
                                                        removeFromWishList(item.id);
                                                    } else {
                                                        addToWishList(item);
                                                    }
                                                }}
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
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

const ScrambleText = ({ text, delay = 0, duration = 800 }) => {
    const [displayText, setDisplayText] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

    useEffect(() => {
        let frame = 0;
        const totalFrames = Math.max(Math.floor((duration / 1000) * 20), 1);
        let timeoutId, intervalId;

        const startAnimation = () => {
            frame = 0;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const tick = () => {
                    setDisplayText(
                        text.split('').map((char, i) => {
                            if (char === ' ') return ' ';
                            const progress = frame / totalFrames;
                            if (progress > i / text.length) return char;
                            return chars[Math.floor(Math.random() * chars.length)];
                        }).join('')
                    );
                    frame++;
                    if (frame >= totalFrames) {
                        setDisplayText(text);
                        return;
                    }
                    timeoutId = setTimeout(tick, 50);
                };
                tick();
            }, delay);
        };

        startAnimation();
        intervalId = setInterval(startAnimation, 10000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [text, delay, duration]);

    return <span>{displayText}</span>;
};

export default function Inicio() {
    const [productos, setProductos] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const SECTIONS_PER_PAGE = 4; // Puedes ajustar cuántas categorías por página querés
    const { addToCart } = useCart();
    
    // ACA TRAEMOS LOS ITEMS Y LA FUNCIÓN DE REMOVER DEL CONTEXTO
    const { addToWishList, wishListItems, removeFromWishList } = useWishList();

    const firstCategoryRef = useRef(null);

    const scrollToContent = () => {
        firstCategoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [prodRes, catRes] = await Promise.all([
                    fetch(`${API_URL}/api/products`),
                    fetch(`${API_URL}/api/categories`)
                ]);

                const prods = await prodRes.json();
                const cats = await catRes.json();

                setProductos(Array.isArray(prods) ? prods : []);
                setDbCategories(Array.isArray(cats) ? cats : []);

                const token = localStorage.getItem('vntg_token');
                if (token) {
                    try {
                        const intRes = await fetch(`${API_URL}/api/auth/interests`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (intRes.ok) {
                            const intData = await intRes.json();
                            if (Array.isArray(intData) && intData.length > 0) {
                                localStorage.setItem('vntg_interests', JSON.stringify(intData));
                            }
                        }
                    } catch (e) {
                        console.error("Error al cargar intereses de la DB:", e);
                    }
                }
            } catch (err) {
                console.error("Error al sincronizar con la DB:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const secciones = useMemo(() => {
        let result = [];

        try {
            const productosConDescuento = productos.filter(p => p.discount_percentage > 0);
            if (productosConDescuento.length > 0) {
                result.push({
                    id: 'ofertas',
                    nombre: 'Ofertas Especiales',
                    subtitle: 'Precios rebajados por tiempo limitado',
                    banner: '/wallpaper.webp',
                    items: productosConDescuento,
                    isRecomendados: true
                });
            }

            const storedInterests = localStorage.getItem('vntg_interests');
            if (storedInterests) {
                const interestsArray = JSON.parse(storedInterests);
                if (Array.isArray(interestsArray) && interestsArray.length > 0) {
                    const topRecomendados = productos.filter(p => 
                        interestsArray.includes(String(p.categoryId || p.category_id))
                    );

                    if (topRecomendados.length > 0) {
                        result.push({
                            id: 'recomendados',
                            nombre: 'Recomendados para ti',
                            subtitle: 'Basado en tus intereses',
                            banner: '/wallpaper.webp',
                            items: topRecomendados,
                            isRecomendados: true
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error loading recommendations", e);
        }

        const catSections = dbCategories.map(cat => {
            const filtrados = productos.filter(p =>
                String(p.categoryId || p.category_id) === String(cat.id)
            );

            return {
                id: cat.id,
                nombre: cat.name,
                subtitle: 'Colección Oficial',
                banner: cat.banner_url || "/wallpaper.webp",
                items: shuffleArray(filtrados),
                slug: slugify(cat.name)
            };
        }).filter(seccion => seccion.items.length > 0);

        return [...result, ...shuffleArray(catSections)];
    }, [productos, dbCategories]);

    const totalPages = Math.ceil(secciones.length / SECTIONS_PER_PAGE);
    const indexOfLastSection = currentPage * SECTIONS_PER_PAGE;
    const indexOfFirstSection = indexOfLastSection - SECTIONS_PER_PAGE;
    const currentSections = secciones.slice(indexOfFirstSection, indexOfLastSection);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark">
                <Loader className="animate-spin text-brand-orange" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full transition-colors duration-300 font-sans overflow-x-hidden relative">

            {/* HERO SECTION */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden mb-20">
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src="/wallpaper.webp"
                        className="w-full h-full object-cover opacity-20 scale-110"
                        style={{
                            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
                        }}
                        alt="Hero Background"
                    />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/80 dark:from-brand-dark/80 via-transparent to-transparent"></div>

                <div className="relative z-10 text-center px-4">
                    <Reveal variant="fade-down" delay={0}>
                        <h1 className="text-[clamp(3.2rem,14vw,10rem)] font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white flex items-center justify-center gap-1 min-[380px]:gap-3 sm:gap-4 subtle-glitch">
                            <span className="text-[#003e9b] hover:animate-pulse transition-all glow-blue">
                                <ScrambleText text="VNTG" delay={200} />
                            </span>
                            <span className="text-[#ff5a00] glow-orange">
                                <ScrambleText text="HUB" delay={600} />
                            </span>
                        </h1>
                    </Reveal>
                    <Reveal variant="fade-up" delay={150}>
                        <p className="text-[clamp(0.85rem,3.5vw,2.5rem)] font-bold italic text-[#ff5a00] uppercase tracking-[0.15em] min-[380px]:tracking-[0.2em] sm:tracking-[0.3em] glow-subtitle">
                            <TypewriterText phrases={["Coleccionismo de Alto Nivel", "Tu tienda de confianza", "Objetos con Historia"]} speed={70} deleteSpeed={35} pause={3000} />
                        </p>
                    </Reveal>
                </div>

                {/* BOTÓN SIGUE EXPLORANDO */}
                <button
                    onClick={scrollToContent}
                    className="absolute bottom-10 w-full flex flex-col items-center justify-center animate-bounce z-20 text-zinc-900 dark:text-white opacity-70 hover:opacity-100 transition-all cursor-pointer group"
                >
                    <ChevronDown size={36} className="mb-1 group-hover:text-brand-orange transition-colors" />
                    <span className="text-xs font-black italic uppercase tracking-[0.3em] pl-[0.3em] group-hover:text-brand-orange transition-colors">
                        Sigue Explorando
                    </span>
                </button>
            </section>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes glitch-subtle {
                    0%, 90%, 100% { transform: translate(0); opacity: 1; }
                    91% { transform: translate(-2px, 1px) skewX(1deg); opacity: 0.8; }
                    92% { transform: translate(2px, -1px) skewX(-1deg); opacity: 0.9; }
                    95% { transform: translate(0); opacity: 1; }
                }

                .subtle-glitch {
                    animation: glitch-subtle 8s infinite;
                }
                .glow-blue {
                    text-shadow: 0 0 20px rgba(0,62,155,0.35), 0 0 50px rgba(0,62,155,0.12);
                }
                .glow-orange {
                    text-shadow: 0 0 20px rgba(255,90,0,0.35), 0 0 50px rgba(255,90,0,0.12);
                }
                .glow-subtitle {
                    text-shadow: 0 0 12px rgba(255,90,0,0.25), 0 0 30px rgba(255,90,0,0.08);
                }
                div.hide-scrollbar {
                    scrollbar-width: none !important;
                }
                div.hide-scrollbar::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
                div.hide-scrollbar::-webkit-scrollbar-track {
                    background: transparent !important;
                    display: none !important;
                }
                div.hide-scrollbar::-webkit-scrollbar-thumb {
                    background: transparent !important;
                    display: none !important;
                    border: none !important;
                }
            ` }} />

            {/* SECCIONES DINÁMICAS (PAGINADAS) */}
            {currentSections.map((seccion, index) => (
                <section
                    key={seccion.id}
                    ref={index === 0 ? firstCategoryRef : null}
                    className="w-full pb-20"
                >

                    {/* BANNER DE CATEGORÍA */}
                    {seccion.isRecomendados ? (
                        <div className="max-w-[1700px] mx-auto px-4 pt-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8">
                                <div>
                                    <span className="text-brand-orange font-black uppercase tracking-[0.5em] text-[10px] mb-3 flex items-center gap-2">
                                        <Sparkles size={14} className="animate-pulse" /> {seccion.subtitle}
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">
                                        {seccion.nombre}
                                    </h2>
                                </div>
                                <Link to="/categoria/recomendados" className="text-[10px] font-black uppercase tracking-[0.2em] italic text-zinc-500 hover:text-brand-orange transition-colors flex items-center gap-2 mt-4 md:mt-0">
                                    Ver Todo <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-[200px] md:h-[300px] group overflow-hidden">
                            <img
                                src={seccion.banner}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/wallpaper.webp";
                                }}
                                className="w-full h-full object-cover opacity-60 dark:opacity-40 transition-transform duration-[2000ms]"
                                alt={seccion.nombre}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-50/40 dark:from-brand-dark/40 via-transparent to-transparent"></div>

                            <div className="absolute inset-0 flex flex-col justify-center px-4 max-[400px]:px-3 md:px-20">
                                <span className="text-brand-orange font-black uppercase tracking-[0.5em] text-[10px] mb-4 block">
                                    {seccion.subtitle || 'Colección Oficial'}
                                </span>
                                <h2 className="text-3xl max-[400px]:text-2xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-10 text-zinc-900 dark:text-white">{seccion.nombre}</h2>
                                <Link
                                    to={`/categoria/${seccion.slug || slugify(seccion.nombre)}`}
                                    className="w-fit bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-6 sm:px-10 py-4 font-black uppercase italic text-sm hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white transition-all duration-300 flex items-center gap-3 group/btn shadow-xl rounded-2xl"
                                >
                                    COMPRAR AHORA <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* GRID DE PRODUCTOS */}
                    <div className={`max-w-[1700px] mx-auto px-4 ${seccion.isRecomendados ? 'mt-4' : 'mt-12'}`}>
                        {/* ACÁ LE PASAMOS LOS ITEMS Y LA FUNCIÓN DE REMOVER A CAROUSEL */}
                        <ProductCarousel items={seccion.items.slice(0, 5)} addToCart={addToCart} addToWishList={addToWishList} wishListItems={wishListItems} removeFromWishList={removeFromWishList} />
                    </div>
                </section>
            ))}

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 sm:gap-4 pb-20 pt-4">
                    <button 
                        onClick={() => {
                            setCurrentPage(p => Math.max(1, p - 1));
                            scrollToContent();
                        }}
                        disabled={currentPage === 1}
                        className="p-3 bg-white dark:bg-zinc-800 text-zinc-400 hover:text-brand-orange dark:text-zinc-500 dark:hover:text-brand-orange rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 border border-zinc-200 dark:border-zinc-700 disabled:hover:shadow-none disabled:active:scale-100 flex items-center justify-center"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2 px-2 sm:px-4 flex-wrap justify-center">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                            <button
                                key={num}
                                onClick={() => {
                                    setCurrentPage(num);
                                    scrollToContent();
                                }}
                                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl font-black italic text-sm transition-all duration-300 ${
                                    currentPage === num 
                                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30 scale-110 border border-brand-orange' 
                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-brand-orange dark:hover:text-brand-orange border border-zinc-200 dark:border-zinc-700 hover:border-brand-orange dark:hover:border-brand-orange hover:shadow-md'
                                }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => {
                            setCurrentPage(p => Math.min(totalPages, p + 1));
                            scrollToContent();
                        }}
                        disabled={currentPage === totalPages}
                        className="p-3 bg-white dark:bg-zinc-800 text-zinc-400 hover:text-brand-orange dark:text-zinc-500 dark:hover:text-brand-orange rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 border border-zinc-200 dark:border-zinc-700 disabled:hover:shadow-none disabled:active:scale-100 flex items-center justify-center"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}