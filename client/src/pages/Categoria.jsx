import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Box, ChevronDown, ListFilter, ArrowUpDown, CircleDollarSign, Check } from 'lucide-react';
import { useCart } from '../context/CartContext'; 

const API_URL = import.meta.env.VITE_API_URL || "http://kernelos-pc:5000";

const Categoria = () => {
    const { id } = useParams();
    const location = useLocation(); 
    const { addToCart } = useCart(); 
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

    const [showFranchiseList, setShowFranchiseList] = useState(false);
    const [showOrderList, setShowOrderList] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search') || '';

    useEffect(() => {
        setFranquiciaSeleccionada("");
        setListaFranquicias([]);
        setPrecioMinLocal(0);
        setPrecioMaxLocal(1000000);
        setPrecioMinFinal(0);
        setPrecioMaxFinal(1000000);
        setOrden("reciente");
        setCategoriaInfo(null); 
    }, [id, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPrecioMinFinal(precioMinLocal);
            setPrecioMaxFinal(precioMaxLocal);
        }, 500);
        return () => clearTimeout(timer);
    }, [precioMinLocal, precioMaxLocal]);

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                if (searchQuery) {
                    setCategoriaInfo({ name: `RESULTADOS PARA "${searchQuery.toUpperCase()}"` });
                } else if (id === 'all') {
                    setCategoriaInfo({ name: "TODO EL CATÁLOGO" });
                } else {
                    const resCat = await fetch(`${API_URL}/api/categories`);
                    const cats = await resCat.json();
                    const actual = cats.find(c => c.id.toString() === id.toString());
                    if (actual) setCategoriaInfo(actual);
                }

                let url = `${API_URL}/api/products?categoryId=${id}&minPrice=${precioMinFinal}&maxPrice=${precioMaxFinal}`;
                
                if (franquiciaSeleccionada) {
                    url += `&franchise=${franquiciaSeleccionada}`;
                }
                
                if (searchQuery) {
                    url += `&q=${encodeURIComponent(searchQuery)}`;
                }

                const res = await fetch(url);
                const data = await res.json();

                let productosOrdenados = [...data];
                if (orden === "precioAsc") productosOrdenados.sort((a, b) => a.price - b.price);
                else if (orden === "precioDesc") productosOrdenados.sort((a, b) => b.price - a.price);
                else if (orden === "alfa") productosOrdenados.sort((a, b) => a.title.localeCompare(b.title));

                setProductos(productosOrdenados);

                if (listaFranquicias.length === 0) {
                    const resFull = await fetch(`${API_URL}/api/products?categoryId=${id}`);
                    const dataFull = await resFull.json();
                    const unicas = [...new Set(dataFull.map(p => p.franchise).filter(f => f))];
                    setListaFranquicias(unicas);
                }
                
                setLoading(false);
            } catch (error) {
                console.error("Error al cargar:", error);
                setLoading(false);
            }
        };
        fetchDatos();
    }, [id, franquiciaSeleccionada, precioMinFinal, precioMaxFinal, orden, listaFranquicias.length, searchQuery]); 

    useEffect(() => {
        const closeMenus = () => {
            setShowFranchiseList(false);
            setShowOrderList(false);
        };
        window.addEventListener('click', closeMenus);
        return () => window.removeEventListener('click', closeMenus);
    }, []);

    const ordenLabels = {
        reciente: "Novedades",
        precioAsc: "Precio: Menor a Mayor",
        precioDesc: "Precio: Mayor a Menor",
        alfa: "Orden Alfabético"
    };

    return (
        <div className="w-full transition-colors duration-300 min-h-screen">
            <div className="relative w-full min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/wallpaper.webp')" }}>
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 select-none">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div>
                            <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-none">
                                {searchQuery ? "" : "EXPLORANDO "}
                                <span className="text-brand-orange">
                                    {categoriaInfo ? categoriaInfo.name : "COLECCIÓN"}
                                </span>
                            </h1>
                            <p className="text-zinc-500 font-bold tracking-[0.3em] text-[10px] uppercase mt-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse"></div>
                                {productos.length} piezas en exhibición
                            </p>
                        </div>

                        <div className="relative z-40" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={() => setShowOrderList(!showOrderList)}
                                className="flex items-center gap-4 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 p-4 px-6 rounded-2xl shadow-xl hover:border-brand-orange transition-all"
                            >
                                <ArrowUpDown size={16} className="text-brand-orange" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">
                                    {ordenLabels[orden]}
                                </span>
                                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${showOrderList ? 'rotate-180' : ''}`} />
                            </button>

                            {showOrderList && (
                                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                                    {Object.entries(ordenLabels).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => { setOrden(key); setShowOrderList(false); }}
                                            className="w-full flex justify-between items-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-brand-orange hover:text-white transition-all border-b border-gray-50 dark:border-zinc-800 last:border-none"
                                        >
                                            {label}
                                            {orden === key && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative z-30 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-gray-100 dark:border-zinc-800/50 shadow-2xl mb-12">
                        
                        <div className="lg:col-span-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
                                <ListFilter size={14} className="text-brand-orange" /> Franquicia
                            </label>
                            <div className="relative">
                                <button 
                                    onClick={() => setShowFranchiseList(!showFranchiseList)}
                                    className="w-full flex justify-between items-center bg-white/50 dark:bg-black/40 border-2 border-gray-100 dark:border-zinc-800 p-4 rounded-2xl text-[11px] font-black text-gray-900 dark:text-white hover:border-brand-orange transition-all uppercase tracking-[0.1em]"
                                >
                                    {franquiciaSeleccionada || "Todas las Marcas"}
                                    <ChevronDown size={18} className={`text-zinc-500 transition-transform ${showFranchiseList ? 'rotate-180' : ''}`} />
                                </button>

                                {showFranchiseList && (
                                    <div className="absolute w-full mt-3 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                        <button
                                            onClick={() => { setFranquiciaSeleccionada(""); setShowFranchiseList(false); }}
                                            className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-brand-orange hover:text-white transition-all border-b border-gray-50 dark:border-zinc-800"
                                        >
                                            Todas las Marcas
                                        </button>
                                        {listaFranquicias.map(f => (
                                            <button
                                                key={f}
                                                onClick={() => { setFranquiciaSeleccionada(f); setShowFranchiseList(false); }}
                                                className="w-full flex justify-between items-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-brand-orange hover:text-white transition-all border-b border-gray-50 dark:border-zinc-800 last:border-none"
                                            >
                                                {f}
                                                {franquiciaSeleccionada === f && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
                                    <CircleDollarSign size={14} className="text-brand-orange" /> Rango de Precio
                                </label>
                                <div className="flex gap-2">
                                    <span className="bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white px-3 py-1 rounded-lg text-[10px] font-black italic">
                                        ${Number(precioMinLocal).toLocaleString('es-AR')}
                                    </span>
                                    <span className="text-brand-orange font-black italic">-</span>
                                    <span className="bg-brand-orange text-white px-3 py-1 rounded-lg text-[10px] font-black italic shadow-lg shadow-orange-500/20">
                                        ${Number(precioMaxLocal).toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="relative h-10 flex items-center pt-2 px-1">
                                <div className="absolute w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
                                <div 
                                    className="absolute h-2 bg-brand-orange rounded-full" 
                                    style={{ 
                                        left: `${(precioMinLocal / 1000000) * 100}%`, 
                                        right: `${100 - (precioMaxLocal / 1000000) * 100}%` 
                                    }}
                                ></div>
                                <input 
                                    type="range" min="0" max="1000000" step="1000" value={precioMinLocal}
                                    onChange={(e) => setPrecioMinLocal(Math.min(Number(e.target.value), precioMaxLocal - 10000))}
                                    className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 dual-range-input"
                                />
                                <input 
                                    type="range" min="0" max="1000000" step="1000" value={precioMaxLocal}
                                    onChange={(e) => setPrecioMaxLocal(Math.max(Number(e.target.value), precioMinLocal + 10000))}
                                    className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 dual-range-input"
                                />
                            </div>
                            <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1 opacity-60">
                                <span>$0</span>
                                <span>$1.0M+</span>
                            </div>
                        </div>
                    </div>

                    {productos.length === 0 && !loading ? (
                        <div className="text-center py-20 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] border-2 border-gray-100 dark:border-zinc-800/50 shadow-2xl relative z-10">
                            <h2 className="text-2xl font-black dark:text-white italic uppercase tracking-tighter mb-2">No encontramos tesoros</h2>
                            <p className="text-zinc-500 font-bold">Intenta con otros términos o ajusta los filtros de búsqueda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                            {productos.map((item) => (
                                <Link to={`/producto/${item.id}`} key={item.id} className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-gray-100 dark:border-zinc-800/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                                    
                                    <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                                        <img src={item.images} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" alt={item.title} />
                                        
                                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-xl">
                                            <span className="text-[8px] font-black text-brand-blue uppercase tracking-[0.2em] flex items-center gap-1.5">
                                                <div className="w-1 h-1 bg-brand-blue rounded-full animate-pulse"></div>
                                                {item.estado || "STOCK"}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-4 right-4 bg-brand-orange text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase italic tracking-widest shadow-lg">
                                            {item.franchise}
                                        </div>
                                    </div>

                                    <div className="p-7">
                                        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight h-14 line-clamp-2 group-hover:text-brand-orange transition-colors uppercase italic tracking-tighter">
                                            {item.title}
                                        </h3>
                                        <div className="mt-8 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Inversión</p>
                                                <p className="text-3xl font-black text-brand-orange italic leading-none">${Number(item.price).toLocaleString('es-AR')}</p>
                                            </div>
                                            <div 
                                                className="bg-brand-blue text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-brand-orange transition-all duration-300"
                                                onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    addToCart(item);
                                                }}
                                            >
                                                <ShoppingCart size={22} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .dual-range-input::-webkit-slider-thumb {
                    pointer-events: auto; width: 22px; height: 22px; border-radius: 50%;
                    background: #ff5e00; border: 4px solid #fff; cursor: pointer; -webkit-appearance: none;
                    box-shadow: 0 4px 10px rgba(255, 94, 0, 0.3);
                }
                .dark .dual-range-input::-webkit-slider-thumb { border-color: #111; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ff5e00; }
            ` }} />
        </div>
    );
};

export default Categoria;