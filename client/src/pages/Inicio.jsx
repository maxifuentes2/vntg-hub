import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Box, ArrowRight, Loader, ChevronDown, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishList } from '../context/WishListContext';
import { useCurrency } from '../context/CurrencyContext';
import Reveal from '../components/Reveal';
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
            ? <img src={item.images} alt={item.title} className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
            : <Box size={40} className="text-zinc-300 dark:text-white/5" />;
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <img
                src={item.images}
                alt={item.title}
                className="absolute max-w-full max-h-full object-contain opacity-90 group-hover:opacity-0 transition-opacity duration-500"
            />
            <img
                src={hoverImg}
                alt={item.title}
                className="absolute max-w-full max-h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
            {items.length > 3 && (
                <>
                    <button 
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white p-2.5 rounded-full shadow-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none border border-zinc-200 dark:border-zinc-700"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white p-2.5 rounded-full shadow-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none border border-zinc-200 dark:border-zinc-700"
                    >
                        <ChevronRight size={20} />
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
                                        <p className="text-xl max-[400px]:text-lg font-black text-zinc-900 dark:text-white italic">
                                            {formatPrice(item.price)}
                                        </p>
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
        const totalFrames = (duration / 1000) * 60;
        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                setDisplayText(text.split('').map((char, i) => {
                    if (char === ' ') return ' ';
                    const progress = frame / totalFrames;
                    if (progress > i / text.length) return char;
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join(''));
                frame++;
                if (frame >= totalFrames) {
                    setDisplayText(text);
                    clearInterval(interval);
                }
            }, 1000 / 60);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timeout);
    }, [text, delay, duration]);

    return <span>{displayText}</span>;
};

export default function Inicio() {
    const [productos, setProductos] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [triggerKey, setTriggerKey] = useState(0);
    const { addToCart } = useCart();
    
    // ACA TRAEMOS LOS ITEMS Y LA FUNCIÓN DE REMOVER DEL CONTEXTO
    const { addToWishList, wishListItems, removeFromWishList } = useWishList();

    const firstCategoryRef = useRef(null);

    const scrollToContent = () => {
        firstCategoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Re-triggerear la animación cada 10 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setTriggerKey(prev => prev + 1);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

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

    let secciones = [];

    try {
        const storedInterests = localStorage.getItem('vntg_interests');
        if (storedInterests) {
            const interestsArray = JSON.parse(storedInterests);
            if (Array.isArray(interestsArray) && interestsArray.length > 0) {
                const topRecomendados = productos.filter(p => 
                    interestsArray.includes(String(p.categoryId || p.category_id))
                );

                if (topRecomendados.length > 0) {
                    secciones.push({
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
            items: filtrados,
            slug: slugify(cat.name)
        };
    }).filter(seccion => seccion.items.length > 0);

    secciones = [...secciones, ...catSections];

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
                        <h1 className="text-4xl max-[400px]:text-3xl md:text-9xl font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white flex items-center justify-center gap-4 subtle-glitch">
                            <span className="hover:animate-pulse transition-all">
                                <ScrambleText key={`vntg-${triggerKey}`} text="VNTG" delay={200} />
                            </span>
                            <span className="text-brand-orange liquid-text">
                                <ScrambleText key={`hub-${triggerKey}`} text="HUB" delay={600} />
                            </span>
                        </h1>
                    </Reveal>
                    <Reveal variant="fade-up" delay={150}>
                        <p className="text-sm max-[400px]:text-xs md:text-xl font-bold italic liquid-text uppercase tracking-[0.4em] subtle-glitch">
                            <ScrambleText key={`sub-${triggerKey}`} text="Coleccionismo de Alto Nivel" delay={1000} duration={1200} />
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
                @keyframes liquid-flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes glitch-subtle {
                    0%, 90%, 100% { transform: translate(0); opacity: 1; }
                    91% { transform: translate(-2px, 1px) skewX(1deg); opacity: 0.8; }
                    92% { transform: translate(2px, -1px) skewX(-1deg); opacity: 0.9; }
                    95% { transform: translate(0); opacity: 1; }
                }

                .subtle-glitch {
                    animation: glitch-subtle 8s infinite;
                }

                .liquid-text {
                    background: linear-gradient(
                        -45deg, 
                        #ff5a00, 
                        #ff8c00, 
                        #ffc107, 
                        #ff5a00
                    );
                    background-size: 300% 300%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: liquid-flow 6s ease infinite;
                    display: inline-block;
                    padding-right: 0.05em;
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

            {/* SECCIONES DINÁMICAS */}
            {secciones.map((seccion, index) => (
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
                        <div className="relative w-full h-[400px] md:h-[500px] group overflow-hidden">
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
                        <ProductCarousel items={seccion.items} addToCart={addToCart} addToWishList={addToWishList} wishListItems={wishListItems} removeFromWishList={removeFromWishList} />
                    </div>
                </section>
            ))}
        </div>
    );
}