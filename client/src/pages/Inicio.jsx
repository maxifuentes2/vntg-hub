import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Box, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || "http://kernelos-pc:5000";

export default function Inicio() {
    const [productos, setProductos] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Cargamos productos y categorías de la DB
                const [prodRes, catRes] = await Promise.all([
                    fetch(`${API_URL}/api/products`),
                    fetch(`${API_URL}/api/categories`)
                ]);

                const prods = await prodRes.json();
                const cats = await catRes.json();

                setProductos(Array.isArray(prods) ? prods : []);
                setDbCategories(Array.isArray(cats) ? cats : []);
            } catch (err) {
                console.error("Error al sincronizar con la DB:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. Lógica dinámica: Agrupamos productos usando la info de la tabla 'categories'
    const secciones = dbCategories.map(cat => {
        const filtrados = productos.filter(p => 
            // Comparamos IDs asegurando que ambos sean tratados igual
            String(p.categoryId || p.category_id) === String(cat.id)
        );

        return {
            id: cat.id,
            nombre: cat.name,
            // Aquí tomamos el banner que acabas de configurar en MySQL
            banner: cat.banner_url || "/wallpaper.webp", 
            items: filtrados.slice(0, 4) // Mostramos solo los primeros 4
        };
    }).filter(seccion => seccion.items.length > 0); // Solo mostramos categorías con productos

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark">
                <Loader2 className="animate-spin text-brand-orange" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full transition-colors duration-300 font-sans overflow-x-hidden bg-white dark:bg-brand-dark">
            
            {/* HERO SECTION ORIGINAL */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-zinc-200 dark:border-white/5">
                <img 
                    src="/wallpaper.webp" 
                    className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110" 
                    alt="Hero Background"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-brand-dark via-transparent to-transparent"></div>
                
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">
                        VNTG <span className="text-brand-orange">HUB</span>
                    </h1>
                    <p className="text-lg md:text-xl font-bold italic text-zinc-600 dark:text-zinc-500 uppercase tracking-[0.4em]">
                        Coleccionismo de Alto Nivel
                    </p>
                </div>
            </section>

            {/* SECCIONES DINÁMICAS (UNA POR CADA FILA EN TU TABLA CATEGORIES) */}
            {secciones.map((seccion) => (
                <section key={seccion.id} className="w-full pb-20">
                    
                    {/* BANNER DE CATEGORÍA DINÁMICO */}
                    <div className="relative w-full h-[400px] md:h-[500px] group overflow-hidden border-y border-zinc-200 dark:border-white/5">
                        <img 
                            src={seccion.banner} 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/wallpaper.webp";
                            }}
                            className="w-full h-full object-cover opacity-60 dark:opacity-40 group-hover:scale-105 transition-transform duration-[2000ms]" 
                            alt={seccion.nombre}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 dark:from-brand-dark via-zinc-50/50 dark:via-brand-dark/30 to-transparent"></div>
                        
                        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-20">
                            <span className="text-brand-orange font-black uppercase tracking-[0.5em] text-[10px] mb-4">
                                Colección Oficial
                            </span>
                            <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-10 text-zinc-900 dark:text-white">
                                {seccion.nombre}
                            </h2>
                            <Link 
                                to={`/categoria/${seccion.id}`} 
                                className="w-fit bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-10 py-4 font-black uppercase italic text-sm hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white transition-all duration-300 flex items-center gap-3 group/btn shadow-xl"
                            >
                                SHOP NOW <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* GRID DE PRODUCTOS */}
                    <div className="max-w-[1700px] mx-auto px-4 mt-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-3">
                            {seccion.items.map((item) => (
                                <div key={item.id} className="group bg-white dark:bg-[#1a1a1a]/40 border border-zinc-200 dark:border-white/5 hover:border-brand-orange transition-all duration-500">
                                    <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-900/50 relative overflow-hidden flex items-center justify-center">
                                        <Link to={`/producto/${item.id}`} className="w-full h-full">
                                            {/* Usamos 'item.images' que es tu campo original con fotos */}
                                            {item.images ? (
                                                <img 
                                                    src={item.images} 
                                                    alt={item.title} 
                                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                                />
                                            ) : (
                                                <Box size={40} className="text-zinc-300 dark:text-white/5" />
                                            )}
                                        </Link>
                                        <div className="absolute top-4 left-4 bg-brand-blue text-white px-3 py-1 text-[9px] font-black uppercase italic tracking-widest">
                                            {item.estado || "MINT"}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <Link to={`/producto/${item.id}`}>
                                            <h3 className="text-lg font-black uppercase italic text-zinc-900 dark:text-white group-hover:text-brand-orange transition-colors truncate mb-6">
                                                {item.title}
                                            </h3>
                                        </Link>
                                        
                                        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-6">
                                            <p className="text-2xl font-black text-zinc-900 dark:text-white italic">
                                                ${Number(item.price).toLocaleString('es-AR')}
                                            </p>
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="bg-brand-blue text-white p-3 hover:bg-brand-orange transition-all duration-300 shadow-lg active:scale-95"
                                            >
                                                <ShoppingCart size={22} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
}