import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Box } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || "http://kernelos-pc:5000";

export default function Inicio() {
    const [productos, setProductos] = useState([]);
    const { addToCart } = useCart();

    useEffect(() => {
        fetch(`${API_URL}/api/products`, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        })
            .then(res => res.json())
            .then(data => setProductos(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error:", err));
    }, []);

    return (
        <div className="w-full transition-colors duration-300">
            <div
                className="relative w-full min-h-screen bg-cover bg-center bg-fixed"
                style={{ backgroundImage: "url('/wallpaper.webp')" }}
            >
                <div className="absolute inset-0 bg-white/85 dark:bg-neutral-950/90 transition-colors duration-300 pointer-events-none"></div>

                <div className="relative z-10">

                    <section className="bg-brand-blue/90 backdrop-blur-md py-20 px-4 border-b border-white/10">
                        <div className="max-w-4xl mx-auto text-center">
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-md italic uppercase">
                                Encuentra tu próximo <span className="text-brand-orange">TESORO</span>
                            </h1>
                            <div className="bg-red-500 text-white p-4 font-bold text-center mt-4">
                                ESTOY APUNTANDO A: {import.meta.env.VITE_API_URL || "http://kernelos-pc:5000"}
                            </div>
                            <p className="text-lg md:text-xl text-blue-100/90 max-w-2xl mx-auto font-medium leading-relaxed italic">
                                Piezas únicas, cómics graduados y figuras de edición limitada con autenticidad garantizada.
                            </p>
                        </div>
                    </section>

                    <section className="max-w-7xl mx-auto px-4 py-20">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <span className="text-brand-orange font-black uppercase tracking-[0.3em] text-xs">Coleccionables</span>
                                <h2 className="text-4xl font-black dark:text-white mt-1 italic uppercase tracking-tighter">🔥 Ofertas del Día</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {productos.map((item) => (
                                <div
                                    key={item.id}
                                    className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-gray-100 dark:border-zinc-800/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative z-10"
                                >
                                    <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                                        <Link to={`/producto/${item.id}`}>
                                            <img
                                                src={item.images}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                                            />
                                        </Link>

                                        <div className="absolute top-5 left-5 bg-white/95 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border dark:border-zinc-700 shadow-xl pointer-events-none">
                                            <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full"></div>
                                                {item.estado || "STOCK"}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-5 right-5 bg-brand-orange text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase italic tracking-widest shadow-lg pointer-events-none">
                                            {item.franchise}
                                        </div>
                                    </div>

                                    <div className="p-7">
                                        <Link to={`/producto/${item.id}`}>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight h-14 line-clamp-2 group-hover:text-brand-orange transition-colors uppercase italic tracking-tighter">
                                                {item.title}
                                            </h3>
                                        </Link>

                                        <div className="mt-8 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Inversión</p>
                                                <p className="text-3xl font-black text-brand-orange italic leading-none">
                                                    ${Number(item.price).toLocaleString('es-AR')}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => addToCart(item)}
                                                className="bg-brand-blue text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-brand-orange hover:shadow-orange-500/30 transition-all duration-300 active:scale-90"
                                            >
                                                <ShoppingCart size={22} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}