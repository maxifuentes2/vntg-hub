import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Carrito() {
    // 1. Agregamos 'processCheckout' a la extracción del context
    const { cart, removeFromCart, updateQuantity, processCheckout } = useCart();

    const subtotal = cart.reduce((acc, p) => acc + (p.price * p.cantidad), 0);
    const envio = cart.length > 0 ? 1500 : 0;
    const total = subtotal + envio;

    return (
        <div className="w-full min-h-screen bg-gray-50 dark:bg-brand-dark transition-colors duration-300 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                
                <h1 className="text-3xl font-black dark:text-white mb-8 flex items-center gap-3">
                    <ShoppingBag className="text-brand-orange" size={32} />
                    Tu Carrito
                </h1>

                {cart.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LISTA DE PRODUCTOS */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map((producto) => (
                                <div key={producto.id} className="bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col md:flex-row items-center gap-6">
                                    
                                    <img 
                                        src={producto.images} 
                                        alt={producto.title} 
                                        className="w-24 h-24 md:w-32 md:h-32 rounded-xl shrink-0 object-cover bg-gray-100" 
                                    />

                                    <div className="flex-grow text-center md:text-left">
                                        <h3 className="text-lg md:text-xl font-black dark:text-white mt-1">{producto.title}</h3>
                                        <p className="text-brand-blue dark:text-blue-400 font-bold mt-1">
                                            ${Number(producto.price).toLocaleString('es-AR')}
                                        </p>
                                        {/* Badge de stock restante (opcional para dar contexto al usuario) */}
                                        <p className="text-[10px] text-gray-400 uppercase font-black mt-2">
                                            Disponibles: {producto.stock}
                                        </p>
                                    </div>

                                    {/* Controles de Cantidad */}
                                    <div className="flex items-center gap-4 bg-gray-100 dark:bg-neutral-800 px-4 py-2 rounded-full">
                                        <button 
                                            onClick={() => updateQuantity(producto.id, -1)}
                                            className="text-gray-500 hover:text-brand-orange transition-colors"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        
                                        <span className="font-bold dark:text-white w-4 text-center">{producto.cantidad}</span>
                                        
                                        {/* 2. BOTÓN PLUS CON VALIDACIÓN DE STOCK */}
                                        <button 
                                            onClick={() => updateQuantity(producto.id, 1)}
                                            disabled={producto.cantidad >= producto.stock}
                                            className={`transition-colors ${
                                                producto.cantidad >= producto.stock 
                                                ? 'text-gray-300 dark:text-neutral-700 cursor-not-allowed' 
                                                : 'text-gray-500 hover:text-brand-orange'
                                            }`}
                                            title={producto.cantidad >= producto.stock ? "Límite de stock alcanzado" : ""}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => removeFromCart(producto.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* RESUMEN DE ORDEN */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 sticky top-24">
                                <h2 className="text-xl font-black dark:text-white mb-6">Resumen de Compra</h2>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span className="font-bold text-gray-900 dark:text-white">${subtotal.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Envío estimado</span>
                                        <span className="font-bold text-gray-900 dark:text-white">${envio.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-neutral-800 pt-4 flex justify-between">
                                        <span className="text-lg font-bold dark:text-white">Total</span>
                                        <span className="text-2xl font-black text-brand-orange">${total.toLocaleString('es-AR')}</span>
                                    </div>
                                </div>

                                {/* 3. BOTÓN FINALIZAR CONECTADO AL BACKEND */}
                                <button 
                                    onClick={() => processCheckout()}
                                    className="w-full bg-brand-orange hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    Finalizar Compra
                                </button>

                                <Link to="/" className="block text-center mt-6 text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors">
                                    ← Continuar comprando
                                </Link>
                            </div>
                        </div>

                    </div>
                ) : (
                    /* ESTADO VACÍO */
                    <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-dashed border-gray-200 dark:border-neutral-800">
                        <div className="bg-gray-100 dark:bg-neutral-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="text-gray-400" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white mb-2">Tu carrito está vacío</h2>
                        <p className="text-gray-500 mb-8">¡Parece que aún no has encontrado ningún tesoro!</p>
                        <Link to="/" className="bg-brand-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors">
                            Ir a la tienda
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}