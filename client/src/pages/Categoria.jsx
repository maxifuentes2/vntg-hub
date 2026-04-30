import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Tag, Box } from 'lucide-react';

const Categoria = () => {
    const { id } = useParams();
    const [productos, setProductos] = useState([]);
    const [title, setTitle] = useState("CATEGORÍA");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Buscamos el nombre de la categoría para el título
        fetch('http://localhost:5000/api/categories')
            .then(res => res.json())
            .then(cats => {
                const found = cats.find(c => c.id === Number(id));
                if (found) setTitle(found.name.toUpperCase());
            })
            .catch(console.error);

        // 2. Traemos los productos y filtramos por la categoría actual
        fetch('http://localhost:5000/api/products')
            .then(res => res.json())
            .then(data => {
                const filtrados = data.filter(p => p.categoryId === Number(id));
                setProductos(filtrados);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center dark:text-white font-black">CARGANDO TESOROS...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                    EXPLORANDO <span className="text-brand-orange">{title}</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    {productos.length} tesoros encontrados
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productos.map((item) => (
                    <Link 
                        to={`/producto/${item.id}`} 
                        key={item.id} 
                        className="group bg-white dark:bg-brand-dark rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
                    >
                        <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-zinc-900">
                            <img 
                                src={item.images} 
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                            />
                            <div className="absolute top-4 left-4 bg-white/80 dark:bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 dark:border-zinc-700 shadow-md">
                                <span className="text-[10px] font-black text-brand-blue dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                    <Box size={10} /> Nuevo
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight h-12 line-clamp-2 transition-colors group-hover:text-brand-orange">
                                {item.title}
                            </h3>
                            <div className="mt-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Inversión</p>
                                    <p className="text-2xl font-black text-brand-orange">
                                        ${Number(item.price).toLocaleString('es-AR')}
                                    </p>
                                </div>
                                <div className="bg-brand-blue hover:bg-blue-700 text-white p-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/20 flex-shrink-0">
                                    <ShoppingCart size={20} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {productos.length === 0 && (
                <div className="text-center py-32 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
                    <Tag className="mx-auto text-gray-300 mb-4" size={48} />
                    <h2 className="text-xl font-bold dark:text-white">Próximamente más tesoros</h2>
                    <p className="text-gray-500 mt-2">Estamos catalogando nuevas piezas para {title}.</p>
                </div>
            )}
        </div>
    );
};

export default Categoria;