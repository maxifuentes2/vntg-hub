import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Tag, Box, Images } from 'lucide-react';

const Categoria = () => {
    const { categorySlug } = useParams();

    // SIMULACIÓN DE BASE DE DATOS UNIFICADA
    const productosDB = {
        "marvel": [
            { 
                id: 1, 
                nombre: "Iron Man Mark 85 - Hot Toys", 
                precio: 450000, 
                estado: "Nuevo / En Caja", 
                imagen: "https://via.placeholder.com/400x400?text=Iron+Man",
                galeria: ["https://via.placeholder.com/400x400?text=Iron+Man", "https://via.placeholder.com/400x400?text=Iron+Man+Alt"]
            },
            { 
                id: 2, 
                nombre: "Spider-Man No Way Home - Marvel Legends", 
                precio: 85000, 
                estado: "Caja Dañada", 
                imagen: "https://via.placeholder.com/400x400?text=Spiderman",
                galeria: ["https://via.placeholder.com/400x400?text=Spiderman"]
            }
        ],
        "autos": [
            { 
                id: 3, 
                nombre: "Ecto-1 Cadillac Miller-Meteor Sentinel de 1959", 
                precio: 50000, 
                estado: "Nuevo / Sellado", 
                imagen: "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto-1_ehvzjx.webp",
                galeria: [
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto-1_ehvzjx.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto3_c8eryw.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto2_r7c1ac.webp",
                    "https://res.cloudinary.com/dhg3jbifk/image/upload/v1777506211/ecto4_j7gn5f.webp"
                ]
            },
            { 
                id: 102, 
                nombre: "Porsche 911 Carrera RS", 
                precio: 95000, 
                estado: "Sin Caja / Excelente", 
                imagen: "https://via.placeholder.com/400x400?text=Porsche+911",
                galeria: ["https://via.placeholder.com/400x400?text=Porsche+911"]
            }
        ],
        "numismatica": [
            {
                id: 201, 
                nombre: "Moneda de Oro 20 Pesos - 1917", 
                precio: 850000, 
                estado: "Certificada MS64", 
                imagen: "https://via.placeholder.com/400x400?text=Moneda+Oro",
                galeria: ["https://via.placeholder.com/400x400?text=Moneda+Oro"]
            }
        ]
    };

    const productos = productosDB[categorySlug] || [];
    const title = categorySlug ? categorySlug.toUpperCase() : "CATEGORÍA";

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Encabezado */}
            <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                    EXPLORANDO <span className="text-brand-orange">{title}</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    {productos.length} tesoros encontrados
                </p>
            </div>

            {/* Grilla de Productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productos.map((item) => (
                    <Link 
                        to={`/producto/${item.id}`} 
                        key={item.id} 
                        className="group bg-white dark:bg-brand-dark rounded-3xl border border-gray-100 dark:border-zinc-800 p-3 hover:shadow-2xl transition-all duration-500"
                    >
                        {/* Contenedor Imagen */}
                        <div className="relative aspect-square rounded-2xl bg-gray-50 dark:bg-zinc-900 overflow-hidden">
                            <img 
                                src={item.imagen} 
                                alt={item.nombre}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            
                            {/* Badge de Estado */}
                            <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-gray-100 dark:border-zinc-700 shadow-sm">
                                <span className="text-[10px] font-black text-brand-blue dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                    <Box size={10} /> {item.estado}
                                </span>
                            </div>

                            {/* Badge de Fotos (si tiene más de una) */}
                            {item.galeria?.length > 1 && (
                                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold">
                                    <Images size={12} />
                                    {item.galeria.length}
                                </div>
                            )}
                        </div>

                        {/* Info del Producto */}
                        <div className="mt-4 px-2 pb-2">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight h-12 line-clamp-2 transition-colors group-hover:text-brand-orange">
                                {item.nombre}
                            </h3>
                            
                            <div className="mt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Inversión</p>
                                    <p className="text-2xl font-black text-brand-orange">
                                        ${item.precio.toLocaleString('es-AR')}
                                    </p>
                                </div>
                                
                                <div className="bg-brand-blue hover:bg-blue-700 text-white p-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                                    <ShoppingCart size={20} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Estado Vacío */}
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