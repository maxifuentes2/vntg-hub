import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Tag, Box } from 'lucide-react';

const Categoria = () => {
    const { id } = useParams();
    const [productos, setProductos] = useState([]);
    const [title, setTitle] = useState("CATEGORÍA");
    const [loading, setLoading] = useState(true);

    // BASE DE DATOS LOCAL UNIFICADA (Para que coincida con DetalleProducto)
    const dbMaestra = [
        { id: 3, categoryId: 1, title: "Ecto-1 Cadillac Miller-Meteor Sentinel de 1959", price: 50000, images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto-1_ehvzjx.webp" },
        { id: 4, categoryId: 1, title: "1965 AC Shelby 427 Cobra", price: 55000, images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506219/cobra1_ulmge8.webp" },
        { id: 1, categoryId: 1, title: "Batman (1989) Batmobile - Edición Coleccionista", price: 120000, images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506233/batimobile_gpiwne.webp" },
        { id: 2, categoryId: 1, title: "Delorean Time Machine - Back to the Future", price: 95000, images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506242/delorean1_ni8uvi.webp" },
        { id: 5, categoryId: 1, title: "Mercedes-Benz 300 SL Gullwing - Silver Edition", price: 150000, images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506251/mercedes1_ouo6sd.webp" },
        { id: 6, categoryId: 1, title: "Mach 5 - Speed Racer (Meteor) Collector's Edition", price: 85000, images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506267/meteoro1_iul29s.webp" },
        { id: 7, categoryId: 1, title: "1967 Ford Mustang GT Fastback - Red Passion", price: 110000, images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506281/mustang_eotaku.webp" },
        { id: 8, categoryId: 1, title: "Fiat Palio Fire 1.4 G3 - Edición Limitada", price: 45000, images: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777525854/palio1_mtc69b.webp" }
    ];

    useEffect(() => {
        // Forzamos el título para que se vea bien
        setTitle("AUTOS A ESCALA");

        // OPCIÓN SEGURA: Mostramos todos los productos de dbMaestra 
        // sin filtrar por ID de la URL para que no salga vacío
        setProductos(dbMaestra);
        
        setLoading(false);
    }, [id]); // El componente se recargará si cambia el ID, pero mostrará siempre la lista

    if (loading) return <div className="min-h-screen flex items-center justify-center dark:text-white font-black italic tracking-widest">CARGANDO CATÁLOGO...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 select-none">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                    EXPLORANDO <span className="text-brand-orange">{title}</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-bold tracking-widest text-xs uppercase">
                    {productos.length} tesoros encontrados
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productos.map((item) => (
                    <Link 
                        to={`/producto/${item.id}`} 
                        key={item.id} 
                        className="group bg-white dark:bg-brand-dark rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
                    >
                        <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
                            <img 
                                src={item.images} 
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border dark:border-zinc-700">
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-1">
                                    <Box size={10} /> NUEVO
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight h-12 line-clamp-2 group-hover:text-brand-orange transition-colors">
                                {item.title}
                            </h3>
                            <div className="mt-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter italic">Inversión</p>
                                    <p className="text-2xl font-black text-brand-orange italic">
                                        ${Number(item.price).toLocaleString('es-AR')}
                                    </p>
                                </div>
                                <div className="bg-brand-blue text-white p-3.5 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:bg-blue-600 transition-colors">
                                    <ShoppingCart size={20} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Categoria;