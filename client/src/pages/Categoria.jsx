import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
    ShoppingCart, 
    Box, 
    X, 
    SlidersHorizontal, 
    CircleDollarSign,
    Tag,
    Loader2,
    Heart
} from 'lucide-react';
import { useCart } from '../context/CartContext'; 
import { useWishList } from '../context/WishListContext';
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
        return <img src={item.images} alt={item.title} className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300" />;
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <img src={item.images} alt={item.title} className="absolute max-w-full max-h-full object-contain opacity-90 group-hover:opacity-0 transition-opacity duration-500" />
            <img src={hoverImg} alt={item.title} className="absolute max-w-full max-h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
    );
};

const Categoria = ({ isFilterOpen, setIsFilterOpen }) => {
    const { slug } = useParams();
    const location = useLocation(); 
    const { addToCart } = useCart(); 
    const { addToWishList } = useWishList();
    
    const [categoryId, setCategoryId] = useState(null);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoriaInfo, setCategoriaInfo] = useState(null);
    const [franquiciasSeleccionadas, setFranquiciasSeleccionadas] = useState([]);
    const [listaFranquicias, setListaFranquicias] = useState([]);
    const [orden, setOrden] = useState("reciente");

    const [precioMinLocal, setPrecioMinLocal] = useState(0);
    const [precioMaxLocal, setPrecioMaxLocal] = useState(1000000);
    const [precioMinFinal, setPrecioMinFinal] = useState(0);
    const [precioMaxFinal, setPrecioMaxFinal] = useState(1000000);

    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search') || '';
    const franquiciaParam = queryParams.get('franquicia') || '';

    useEffect(() => {
        setListaFranquicias([]);
        if (franquiciaParam) {
            const franquicias = franquiciaParam.split(',').map(f => f.trim()).filter(f => f);
            setFranquiciasSeleccionadas(franquicias);
        } else {
            setFranquiciasSeleccionadas([]);
        }
    }, [slug, franquiciaParam]);

    const toggleFranquicia = (f) => {
        setFranquiciasSeleccionadas(prev =>
            prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
        );
    };

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                // Resolver slug a ID de categoría
                const resCats = await fetch(`${API_URL}/api/categories`);
                const cats = await resCats.json();
                
                let resolvedId = slug;
                if (slug !== 'all' && slug !== 'recomendados') {
                    const catActual = cats.find(c => c.slug === slug || slugify(c.name) === slug);
                    if (catActual) {
                        resolvedId = catActual.id;
                        setCategoriaInfo(catActual);
                    } else {
                        setCategoriaInfo(null);
                    }
                } else {
                    setCategoriaInfo(null);
                }
                setCategoryId(resolvedId);

                let url = `${API_URL}/api/products?minPrice=${precioMinFinal}&maxPrice=${precioMaxFinal}`;
                if (slug !== 'all' && slug !== 'recomendados') {
                    url += `&categoryId=${resolvedId}`;
                }
                if (franquiciasSeleccionadas.length > 0) url += `&franchise=${franquiciasSeleccionadas.join(',')}`;
                if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

                const res = await fetch(url);
                const data = await res.json();
                
                let productosOrdenados = Array.isArray(data) ? [...data] : [];

                if (slug === 'recomendados') {
                    const storedInterests = localStorage.getItem('vntg_interests');
                    if (storedInterests) {
                        try {
                            const interestsArray = JSON.parse(storedInterests);
                            if (Array.isArray(interestsArray)) {
                                productosOrdenados = productosOrdenados.filter(p => 
                                    interestsArray.includes(String(p.categoryId || p.category_id))
                                );
                            }
                        } catch(e) {}
                    } else {
                        productosOrdenados = [];
                    }
                }

                if (orden === "precioAsc") productosOrdenados.sort((a, b) => a.price - b.price);
                else if (orden === "precioDesc") productosOrdenados.sort((a, b) => b.price - a.price);
                else if (orden === "alfaAsc") productosOrdenados.sort((a, b) => a.title.localeCompare(b.title));
                else if (orden === "alfaDesc") productosOrdenados.sort((a, b) => b.title.localeCompare(a.title));
                
                setProductos(productosOrdenados);

                const unicas = [...new Set(productosOrdenados.map(p => p.franchise).filter(f => f))];
                setListaFranquicias(unicas);

            } catch (error) { 
                console.error("Error cargando categoría:", error); 
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, [slug, franquiciasSeleccionadas, precioMinFinal, precioMaxFinal, orden, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPrecioMinFinal(precioMinLocal);
            setPrecioMaxFinal(precioMaxLocal);
        }, 500);
        return () => clearTimeout(timer);
    }, [precioMinLocal, precioMaxLocal]);

    const renderTitulo = () => {
        if (searchQuery) return `"${searchQuery}"`;
        if (slug === 'all') return "TODO EL CATALOGO";
        if (slug === 'recomendados') return "RECOMENDADOS PARA TI";
        if (categoriaInfo?.name || categoriaInfo?.nombre) return categoriaInfo.name || categoriaInfo.nombre;
        if (isNaN(slug)) return slug.replace(/-/g, ' ');
        return "COLECCIÓN"; 
    };

    // Actualizar el título de la página dinámicamente
    useEffect(() => {
        if (!loading) {
            const titulo = renderTitulo();
            document.title = `VNTG HUB - ${titulo}`;
        }
    }, [slug, categoriaInfo, searchQuery, loading]);

    const bannerImg = slug === 'all' 
        ? "/wallpaper.webp" 
        : (categoriaInfo?.banner_url || "/wallpaper.webp");

    if (loading && productos.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark">
                <Loader2 className="animate-spin text-brand-orange" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full bg-transparent min-h-screen text-zinc-900 dark:text-white transition-colors duration-300 relative">

            <section className="relative w-full h-[400px] md:h-[500px] group overflow-hidden border-b border-zinc-100 dark:border-zinc-800">
                <img 
                    src={bannerImg} 
                    className="w-full h-full object-cover opacity-60 dark:opacity-40 transition-transform duration-[2000ms]" 
                    alt={renderTitulo()}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-50/60 dark:from-brand-dark/60 via-zinc-50/20 dark:via-brand-dark/20 to-transparent"></div>
                
                <div className="absolute inset-0 flex flex-col justify-center px-4 max-[400px]:px-3 md:px-20">
                    <span className="text-brand-orange font-black uppercase tracking-[0.5em] text-[10px] mb-4">
                        {slug === 'all' ? "Tienda Completa" : (slug === 'recomendados' ? "Basado en tus intereses" : "Colección Oficial")}
                    </span>
                    <h1 className="text-3xl max-[400px]:text-2xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-zinc-900 dark:text-white">
                        {renderTitulo()}
                    </h1>
                </div>
            </section>

            <main className="max-w-[1800px] mx-auto px-3 xs:px-6 py-6 xs:py-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-12 border-b border-zinc-100 dark:border-zinc-800 pb-6">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-4">
                        {franquiciasSeleccionadas.length > 0 && (
                            <span className="text-[10px] font-bold italic text-brand-orange">
                                Mostrando productos de <strong className="not-italic font-black uppercase tracking-wider">{franquiciasSeleccionadas.join(', ')}</strong>
                            </span>
                        )}
                        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                            {productos.length} PRODUCTOS ENCONTRADOS
                        </span>
                    </div>
                    <button 
                        onClick={() => setIsFilterOpen(true)} 
                        className="flex items-center gap-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-6 py-3 font-black uppercase italic text-xs hover:bg-brand-orange hover:text-white transition-all  shadow-md rounded-2xl"
                    >
                        <SlidersHorizontal size={16} /> Filtros
                    </button>
                </div>

                {/* GRID DE PRODUCTOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-8">
                    {productos.map((item) => (
                        <div key={item.id} className={`group bg-zinc-50 dark:bg-brand-card  transition-all duration-500 hover:ring-2 hover:ring-brand-orange hover:border-brand-orange hover:shadow-2xl shadow-md rounded-3xl overflow-hidden ${item.stock === 0 ? 'opacity-70' : ''}`}>
                            <div className="aspect-video bg-transparent flex items-center justify-center overflow-hidden relative p-4 border-b border-white/20 dark:border-zinc-600">
                                <Link to={`/producto/${slugify(item.title)}`} className="w-full h-full flex items-center justify-center">
                                    <CardImage item={item} />
                                </Link>
                                <div className="absolute top-4 left-4 bg-brand-blue text-white px-3 py-1 text-[9px] font-black uppercase italic tracking-widest z-10 rounded-full">
                                    {item.stock === 0 ? "AGOTADO" : (item.estado || "MINT")}
                                </div>
                            </div>
                            <div className="p-3 xs:p-4 sm:p-8">
                                <h3 className="text-base max-[400px]:text-sm font-black uppercase italic truncate mb-4 group-hover:text-brand-orange transition-colors">
                                    {item.title}
                                </h3>
                                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6">
                                    <p className="text-xl max-[400px]:text-lg font-black italic">${Number(item.price).toLocaleString('es-AR')}</p>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToWishList(item); }} 
                                            className="text-zinc-400 hover:text-brand-orange transition-colors p-2"
                                        >
                                            <Heart size={24} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(item); }} 
                                            disabled={item.stock === 0}
                                            className={`p-3.5 transition-all duration-300 shadow-lg rounded-2xl active:scale-95 ${item.stock === 0 ? 'bg-zinc-200 cursor-not-allowed text-zinc-400' : 'bg-brand-blue text-white hover:bg-brand-orange'}`}
                                        >
                                            <ShoppingCart size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* SIDEBAR DE FILTROS */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60" onClick={() => setIsFilterOpen(false)} />
                <aside className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-brand-dark border-l border-zinc-100 dark:border-zinc-800 shadow-2xl transform transition-transform duration-500 ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="h-full flex flex-col p-4 sm:p-8">
                        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-6 mb-8">
                            <h2 className="text-2xl font-black italic uppercase">Filtros</h2>
                            <button onClick={() => setIsFilterOpen(false)}><X size={28} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-10 custom-scrollbar pr-2">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                    <Tag size={14} className="text-brand-orange" /> Ordenar
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {["reciente", "precioAsc", "precioDesc", "alfaAsc", "alfaDesc"].map((k) => (
                                        <button key={k} onClick={() => setOrden(k)} className={`px-6 py-4 text-left text-xs font-bold uppercase italic border transition-all rounded-xl ${orden === k ? 'border-brand-orange text-brand-orange bg-brand-orange/5' : 'border-zinc-200 dark:border-zinc-600'}`}>
                                            {k === "reciente" ? "Novedades" : k === "precioAsc" ? "Menor Precio" : k === "precioDesc" ? "Mayor Precio" : k === "alfaAsc" ? "A - Z" : "Z - A"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <CircleDollarSign size={14} className="text-brand-orange" /> Rango de Precio
                                    </h4>
                                    <span className="text-xs font-black italic text-brand-orange">
                                        ${Number(precioMinLocal).toLocaleString()} - ${Number(precioMaxLocal).toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative h-12 flex items-center px-2">
                                    <div className="absolute left-2 right-2 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                    <div className="absolute h-1 bg-brand-orange rounded-full" 
                                        style={{ left: `${(precioMinLocal / 1000000) * 100}%`, right: `${100 - (precioMaxLocal / 1000000) * 100}%` }}>
                                    </div>
                                    <input type="range" min="0" max="1000000" step="5000" value={precioMinLocal}
                                        onChange={(e) => setPrecioMinLocal(Math.min(Number(e.target.value), precioMaxLocal - 50000))}
                                        className="absolute left-0 w-full appearance-none bg-transparent pointer-events-none z-30 dual-range-input" />
                                    <input type="range" min="0" max="1000000" step="5000" value={precioMaxLocal}
                                        onChange={(e) => setPrecioMaxLocal(Math.max(Number(e.target.value), precioMinLocal + 50000))}
                                        className="absolute left-0 w-full appearance-none bg-transparent pointer-events-none z-30 dual-range-input" />
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                    <Box size={14} className="text-brand-orange" /> Franquicia
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {listaFranquicias.map(f => (
                                        <button key={f} onClick={() => toggleFranquicia(f)} className={`w-full text-left p-4 text-xs font-black italic uppercase border transition-all rounded-xl ${franquiciasSeleccionadas.includes(f) ? 'border-brand-orange text-brand-orange bg-brand-orange/5' : 'border-zinc-200 dark:border-zinc-600'}`}>
                                            <span className="flex items-center gap-3">
                                                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${franquiciasSeleccionadas.includes(f) ? 'border-brand-orange bg-brand-orange' : 'border-zinc-400'}`}>
                                                    {franquiciasSeleccionadas.includes(f) && <span className="text-white text-[10px]">✓</span>}
                                                </span>
                                                {f}
                                            </span>
                                        </button>
                                    ))}
                                    {listaFranquicias.length === 0 && (
                                        <p className="text-xs italic text-zinc-400 px-2">No hay franquicias disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <button 
                                onClick={() => {
                                    setFranquiciasSeleccionadas([]);
                                    setPrecioMinLocal(0);
                                    setPrecioMaxLocal(1000000);
                                    setOrden('reciente');
                                }} 
                                className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-4 font-black uppercase italic text-xs tracking-widest hover:bg-brand-orange hover:text-white transition-all rounded-2xl"
                            >
                                Limpiar Filtros
                            </button>
                            <button 
                                onClick={() => setIsFilterOpen(false)} 
                                className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest shadow-xl hover:bg-zinc-900 transition-colors rounded-2xl"
                            >
                                Aplicar Configuración
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .dual-range-input::-webkit-slider-thumb {
                    pointer-events: auto; width: 20px; height: 20px; border-radius: 100%;
                    background: #ff5a00; cursor: pointer; -webkit-appearance: none; border: 2px solid #fff;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ff5a00;
                    border-radius: 10px;
                }
            ` }} />
        </div>
    );
};

export default Categoria;