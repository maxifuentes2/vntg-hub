import { useState, useEffect, useRef } from 'react'; // Añadido useRef
import { Link } from 'react-router-dom';
import { ShoppingCart, Box, ArrowRight, Loader2, ChevronDown, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishList } from '../context/WishListContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Inicio() {
    const [productos, setProductos] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { addToWishList } = useWishList();

    // Referencia para la primera sección de categorías
    const firstCategoryRef = useRef(null);

    // Función para scroll suave
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
            } catch (err) {
                console.error("Error al sincronizar con la DB:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const secciones = dbCategories.map(cat => {
        const filtrados = productos.filter(p =>
            String(p.categoryId || p.category_id) === String(cat.id)
        );

        return {
            id: cat.id,
            nombre: cat.name,
            banner: cat.banner_url || "/wallpaper.webp",
            items: filtrados.slice(0, 3) 
        };
    }).filter(seccion => seccion.items.length > 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark">
                <Loader2 className="animate-spin text-brand-orange" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full transition-colors duration-300 font-sans overflow-x-hidden bg-white dark:bg-brand-dark">

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

                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-brand-dark via-transparent to-transparent"></div>

                <div className="relative z-10 text-center px-4">
                    <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">
                        VNTG <span className="text-brand-orange">HUB</span>
                    </h1>
                    <p className="text-lg md:text-xl font-bold italic text-zinc-600 dark:text-zinc-500 uppercase tracking-[0.4em]">
                        Coleccionismo de Alto Nivel
                    </p>
                </div>

                {/* BOTÓN SIGUE EXPLORANDO (ACCESIBILIDAD MEJORADA) */}
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

            {/* SECCIONES DINÁMICAS */}
            {secciones.map((seccion, index) => (
                <section 
                    key={seccion.id} 
                    ref={index === 0 ? firstCategoryRef : null} // Asignar ref a la primera categoría
                    className="w-full pb-20"
                >

                    {/* BANNER DE CATEGORÍA */}
                    <div className="relative w-full h-[400px] md:h-[500px] group overflow-hidden border-y border-zinc-200 dark:border-white/5">
                        <img
                            src={seccion.banner}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/wallpaper.webp";
                            }}
                            className="w-full h-full object-cover opacity-60 dark:opacity-40 transition-transform duration-[2000ms]"
                            alt={seccion.nombre}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 dark:from-brand-dark via-transparent to-transparent"></div>

                        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-20">
                            <span className="text-brand-orange font-black uppercase tracking-[0.5em] text-[10px] mb-4">
                                Colección Oficial
                            </span>
                            <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-10 text-zinc-900 dark:text-white">{seccion.nombre}</h2>
                            <Link
                                to={`/categoria/${seccion.id}`}
                                className="w-fit bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-6 sm:px-10 py-4 font-black uppercase italic text-sm hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white transition-all duration-300 flex items-center gap-3 group/btn shadow-xl"
                            >
                                SHOP NOW <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* GRID DE PRODUCTOS */}
                    <div className="max-w-[1700px] mx-auto px-4 mt-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {seccion.items.map((item) => (
                                <div key={item.id} className={`group bg-white dark:bg-brand-dark border border-zinc-200 dark:border-white/5 transition-all duration-300 hover:ring-2 hover:ring-brand-orange hover:border-brand-orange hover:shadow-lg ${item.stock === 0 ? 'opacity-60' : ''}`}>
                                    <div className="aspect-[16/10] bg-white dark:bg-brand-dark relative overflow-hidden flex items-center justify-center p-4 border-b border-zinc-200 dark:border-white/5">
                                        <Link to={`/producto/${item.id}`} className="w-full h-full flex items-center justify-center">
                                            {item.images ? (
                                                <img
                                                    src={item.images}
                                                    alt={item.title}
                                                    className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                                                />
                                            ) : (
                                                <Box size={40} className="text-zinc-300 dark:text-white/5" />
                                            )}
                                        </Link>
                                        <div className="absolute top-4 left-4 bg-brand-blue text-white px-3 py-1 text-[9px] font-black uppercase italic tracking-widest z-10">
                                            {item.stock === 0 ? "AGOTADO" : (item.estado || "MINT")}
                                        </div>
                                    </div>

                                    <div className="p-4 sm:p-8">
                                        <Link to={`/producto/${item.id}`}>
                                            <h3 className="text-xl font-black uppercase italic text-zinc-900 dark:text-white group-hover:text-brand-orange transition-colors truncate mb-6">
                                                {item.title}
                                            </h3>
                                        </Link>

                                        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-6">
                                            <p className="text-3xl font-black text-zinc-900 dark:text-white italic">
                                                ${Number(item.price).toLocaleString('es-AR')}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToWishList(item); }}
                                                    className="text-zinc-400 hover:text-brand-orange transition-colors duration-300 p-2"
                                                    title="Añadir a deseados"
                                                >
                                                    <Heart size={24} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(item); }}
                                                    disabled={item.stock === 0}
                                                    className={`p-3.5 transition-all duration-300 shadow-lg active:scale-95 ${item.stock === 0 ? 'bg-zinc-200 cursor-not-allowed text-zinc-400' : 'bg-brand-blue text-white hover:bg-brand-orange'}`}
                                                >
                                                    <ShoppingCart size={24} />
                                                </button>
                                            </div>
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