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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Categoria = ({ isFilterOpen, setIsFilterOpen }) => {
    const { id } = useParams();
    const location = useLocation(); 
    const { addToCart } = useCart(); 
    const { addToWishList } = useWishList();
    
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoriaInfo, setCategoriaInfo] = useState(null);
    const [franquiciaSeleccionada, setFranquiciaSeleccionada] = useState("");
    const [listaFranquicias, setListaFranquicias] = useState([]);
    const [orden, setOrden] = useState("reciente");

    const [precioMinLocal, setPrecioMinLocal] = useState(0);
    const [precioMaxLocal, setPrecioMaxLocal] = useState(1000000);
    const [precioMinFinal, setPrecioMinFinal] = useState(0);
    const [precioMaxFinal, setPrecioMaxFinal] = useState(1000000);

    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search') || '';

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                let url = `${API_URL}/api/products?categoryId=${id}&minPrice=${precioMinFinal}&maxPrice=${precioMaxFinal}`;
                if (franquiciaSeleccionada) url += `&franchise=${franquiciaSeleccionada}`;
                if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

                const res = await fetch(url);
                const data = await res.json();
                
                let productosOrdenados = Array.isArray(data) ? [...data] : [];
                if (orden === "precioAsc") productosOrdenados.sort((a, b) => a.price - b.price);
                else if (orden === "precioDesc") productosOrdenados.sort((a, b) => b.price - a.price);
                
                setProductos(productosOrdenados);

                const resCats = await fetch(`${API_URL}/api/categories`);
                const cats = await resCats.json();
                const catActual = cats.find(c => String(c.id) === String(id));
                
                if (catActual) {
                    setCategoriaInfo(catActual);
                } else {
                    setCategoriaInfo(null);
                }

                if (listaFranquicias.length === 0 && productosOrdenados.length > 0) {
                    const unicas = [...new Set(productosOrdenados.map(p => p.franchise).filter(f => f))];
                    setListaFranquicias(unicas);
                }

            } catch (error) { 
                console.error("Error cargando categoría:", error); 
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, [id, franquiciaSeleccionada, precioMinFinal, precioMaxFinal, orden, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPrecioMinFinal(precioMinLocal);
            setPrecioMaxFinal(precioMaxLocal);
        }, 500);
        return () => clearTimeout(timer);
    }, [precioMinLocal, precioMaxLocal]);

    const renderTitulo = () => {
        if (searchQuery) return `"${searchQuery}"`;
        if (id === 'all') return "TODO EL CATALOGO";
        if (categoriaInfo?.name || categoriaInfo?.nombre) return categoriaInfo.name || categoriaInfo.nombre;
        if (isNaN(id)) return id.replace(/-/g, ' ');
        return "COLECCIÓN"; 
    };

    const bannerImg = id === 'all' 
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
        <div className="w-full bg-white dark:bg-brand-dark min-h-screen text-zinc-900 dark:text-white transition-colors duration-300">

            <section className="relative w-full h-[400px] md:h-[500px] group overflow-hidden border-b border-zinc-200 dark:border-white/5">
                <img 
                    src={bannerImg} 
                    className="w-full h-full object-cover opacity-60 dark:opacity-40 transition-transform duration-[2000ms]" 
                    alt={renderTitulo()}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-brand-dark via-white/50 dark:via-brand-dark/30 to-transparent"></div>
                
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-20">
                    <span className="text-brand-orange font-black uppercase tracking-[0.5em] text-[10px] mb-4">
                        {id === 'all' ? "Tienda Completa" : "Colección Oficial"}
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-zinc-900 dark:text-white">
                        {renderTitulo()}
                    </h1>
                </div>
            </section>

            <main className="max-w-[1800px] mx-auto px-6 py-10">
                <div className="flex justify-between items-center mb-12 border-b border-zinc-200 dark:border-white/5 pb-6">
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                        {productos.length} PRODUCTOS ENCONTRADOS
                    </span>
                    <button 
                        onClick={() => setIsFilterOpen(true)} 
                        className="flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-6 py-3 font-black uppercase italic text-xs hover:bg-brand-orange transition-all"
                    >
                        <SlidersHorizontal size={16} /> Filter + Sort
                    </button>
                </div>

                {/* GRID DE PRODUCTOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {productos.map((item) => (
                        <div key={item.id} className={`group bg-zinc-50 dark:bg-brand-dark border border-zinc-200 dark:border-white/5 transition-all duration-300 hover:ring-2 hover:ring-brand-orange hover:border-brand-orange hover:shadow-lg ${item.stock === 0 ? 'opacity-70' : ''}`}>
                            <div className="aspect-video bg-zinc-50 dark:bg-brand-dark flex items-center justify-center overflow-hidden relative p-4 border-b border-zinc-200 dark:border-white/5">
                                <Link to={`/producto/${item.id}`} className="w-full h-full flex items-center justify-center">
                                    <img 
                                        src={item.images} 
                                        className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300" 
                                        alt={item.title} 
                                    />
                                </Link>
                                <div className="absolute top-4 left-4 bg-brand-blue text-white px-3 py-1 text-[9px] font-black uppercase italic tracking-widest z-10">
                                    {item.stock === 0 ? "AGOTADO" : (item.estado || "MINT")}
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-xl font-black uppercase italic truncate mb-4 group-hover:text-brand-orange transition-colors">
                                    {item.title}
                                </h3>
                                <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-6">
                                    <p className="text-3xl font-black italic">${Number(item.price).toLocaleString('es-AR')}</p>
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
                                            className={`p-3.5 transition-colors shadow-lg ${item.stock === 0 ? 'bg-zinc-200 cursor-not-allowed text-zinc-400' : 'bg-brand-blue text-white hover:bg-brand-orange'}`}
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
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
                <aside className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-brand-dark shadow-2xl transform transition-transform duration-500 ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="h-full flex flex-col p-8">
                        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-6 mb-8">
                            <h2 className="text-2xl font-black italic uppercase">Filtros</h2>
                            <button onClick={() => setIsFilterOpen(false)}><X size={28} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-10 custom-scrollbar pr-2">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                    <Tag size={14} className="text-brand-orange" /> Ordenar
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {["reciente", "precioAsc", "precioDesc"].map((k) => (
                                        <button key={k} onClick={() => setOrden(k)} className={`px-6 py-4 text-left text-xs font-bold uppercase italic border ${orden === k ? 'border-brand-orange text-brand-orange' : 'border-zinc-200 dark:border-white/5'}`}>
                                            {k === "reciente" ? "Novedades" : k === "precioAsc" ? "Menor Precio" : "Mayor Precio"}
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
                                    <button onClick={() => setFranquiciaSeleccionada("")} className={`w-full text-left p-4 text-xs font-black italic uppercase border ${franquiciaSeleccionada === "" ? 'border-brand-orange text-brand-orange' : 'border-zinc-200 dark:border-white/5'}`}>Todas</button>
                                    {listaFranquicias.map(f => (
                                        <button key={f} onClick={() => setFranquiciaSeleccionada(f)} className={`w-full text-left p-4 text-xs font-black italic uppercase border ${franquiciaSeleccionada === f ? 'border-brand-orange text-brand-orange' : 'border-zinc-200 dark:border-white/5'}`}>{f}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <button 
                                onClick={() => setIsFilterOpen(false)} 
                                className="w-full bg-brand-orange text-white py-5 font-black uppercase italic tracking-widest shadow-xl hover:bg-zinc-900 transition-colors"
                            >
                                Aplicar Configuración
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .dual-range-input::-webkit-slider-thumb {
                    pointer-events: auto; width: 20px; height: 20px; border-radius: 0;
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