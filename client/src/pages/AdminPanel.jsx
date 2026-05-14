import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, RefreshCw, Plus, Edit2, Trash2, X, Tag, ClipboardList, ChevronDown, AlertTriangle } from 'lucide-react'; // Añadido AlertTriangle

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminPanel() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]); 
    const [activeTab, setActiveTab] = useState('products'); 
    const navigate = useNavigate();

    // Estados para Modales
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null); 

    // NUEVO: Estado para el Modal de Confirmación Estético
    const [confirmDelete, setConfirmDelete] = useState({
        isOpen: false,
        id: null,
        title: '',
        type: '' // 'product' o 'category'
    });

    // Formularios
    const [productForm, setProductForm] = useState({ 
        id: '', title: '', description: '', franchise: '', 
        categoryId: '', price: 0, stock: 0, images: '', gallery: '' 
    });
    const [categoryForm, setCategoryForm] = useState({ id: '', name: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('vntg_user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        if (user.email !== 'hubvntg@gmail.com') {
            navigate('/'); 
        } else {
            fetchData();
        }
    }, [navigate]);

    const fetchData = () => {
        fetch(`${API_URL}/api/admin/products`)
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error(err));

        fetch(`${API_URL}/api/admin/categories`)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error(err));

        fetch(`${API_URL}/api/admin/orders`)
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error(err));
    };

    // --- MANEJO DE PRODUCTOS ---
    const handleOpenProductModal = (product = null) => {
        if (product) {
            setEditingItem(product);
            let galStr = product.gallery;
            if (Array.isArray(galStr)) galStr = galStr.join(', ');
            else if (typeof galStr === 'string' && galStr.startsWith('[')) {
                try { galStr = JSON.parse(galStr).join(', '); } catch(e){}
            }
            setProductForm({ 
                ...product, 
                gallery: galStr || '', 
                images: product.images || '' 
            });
        } else {
            setEditingItem(null);
            setProductForm({ id: '', title: '', description: '', franchise: '', categoryId: '', price: 0, stock: 0, images: '', gallery: '' });
        }
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `${API_URL}/api/admin/products/${editingItem.id}` : `${API_URL}/api/admin/products`;
        const finalGallery = productForm.gallery.split(',').map(s => s.trim()).filter(s => s);
        
        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...productForm, gallery: finalGallery })
            });
            setIsProductModalOpen(false);
            fetchData();
        } catch (error) { console.error("Error al guardar:", error); }
    };

    // --- MANEJO DE ELIMINACIÓN ESTÉTICA ---
    const openConfirmDelete = (id, title, type) => {
        setConfirmDelete({ isOpen: true, id, title, type });
    };

    const executeDelete = async () => {
        const { id, type } = confirmDelete;
        const endpoint = type === 'product' ? 'products' : 'categories';
        try {
            await fetch(`${API_URL}/api/admin/${endpoint}/${id}`, { method: 'DELETE' });
            setConfirmDelete({ isOpen: false, id: null, title: '', type: '' });
            fetchData();
        } catch (error) { console.error("Error al eliminar:", error); }
    };

    // --- MANEJO DE CATEGORÍAS ---
    const handleOpenCategoryModal = () => {
        setCategoryForm({ id: '', name: '' });
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/api/admin/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryForm)
            });
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (error) { console.error("Error al guardar categoría:", error); }
    };

    // --- MANEJO DE ÓRDENES ---
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchData(); 
        } catch (error) {
            console.error("Error actualizando estado de la orden:", error);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] p-4 md:p-8">
            <div className="max-w-7xl mx-auto pt-6">
                
                {/* HEADER Y PESTAÑAS */}
                <div className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-4 border-b border-zinc-200 dark:border-white/5 pb-6">
                    <div>
                        <h1 className="text-4xl font-black italic text-zinc-900 dark:text-white uppercase tracking-tighter">Consola Admin</h1>
                        <p className="text-brand-orange text-[10px] font-bold uppercase tracking-widest mt-1">Control Total de Base de Datos</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 rounded-xl p-1 gap-1">
                        <button 
                            onClick={() => setActiveTab('products')} 
                            className={`flex items-center gap-2 px-6 py-2 text-sm font-black uppercase italic rounded-lg transition-all ${activeTab === 'products' ? 'bg-brand-orange text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            <Package size={16} /> Productos
                        </button>
                        <button 
                            onClick={() => setActiveTab('categories')} 
                            className={`flex items-center gap-2 px-6 py-2 text-sm font-black uppercase italic rounded-lg transition-all ${activeTab === 'categories' ? 'bg-brand-orange text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            <Tag size={16} /> Categorías
                        </button>
                        <button 
                            onClick={() => setActiveTab('orders')} 
                            className={`flex items-center gap-2 px-6 py-2 text-sm font-black uppercase italic rounded-lg transition-all ${activeTab === 'orders' ? 'bg-brand-orange text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            <ClipboardList size={16} /> Órdenes
                        </button>
                    </div>

                    <button onClick={fetchData} className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl text-brand-orange hover:rotate-180 transition-all duration-500">
                        <RefreshCw size={24} />
                    </button>
                </div>

                {/* VISTA PRODUCTOS */}
                {activeTab === 'products' && (
                    <>
                        <div className="flex justify-end mb-6">
                            <button onClick={() => handleOpenProductModal()} className="flex items-center gap-2 bg-brand-orange text-white px-4 py-3 rounded text-xs font-black uppercase italic hover:bg-orange-600 transition-colors">
                                <Plus size={16} /> Agregar Producto
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products.map(p => (
                                <div key={p.id} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 p-5 relative group">
                                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase truncate mb-1">{p.title}</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">ID: {p.id} | Cat: {p.categoryId}</p>
                                    
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-brand-orange font-black italic text-lg mb-1">${Number(p.price).toLocaleString()}</div>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-black uppercase">Stock: {p.stock}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenProductModal(p)} className="p-2 bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded hover:bg-brand-orange hover:text-white transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => openConfirmDelete(p.id, p.title, 'product')} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* VISTA CATEGORÍAS */}
                {activeTab === 'categories' && (
                    <>
                        <div className="flex justify-end mb-6">
                            <button onClick={handleOpenCategoryModal} className="flex items-center gap-2 bg-brand-orange text-white px-4 py-3 rounded text-xs font-black uppercase italic hover:bg-orange-600 transition-colors">
                                <Plus size={16} /> Agregar Categoría
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.map(c => (
                                <div key={c.id} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 p-5 flex justify-between items-center group">
                                    <div>
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase">{c.name || c.id}</h3>
                                        <p className="text-[10px] text-zinc-500 uppercase mt-1">ID: {c.id}</p>
                                    </div>
                                    <button onClick={() => openConfirmDelete(c.id, c.name || c.id, 'category')} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* VISTA ÓRDENES */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {orders.length === 0 && (
                            <p className="text-center text-zinc-500 dark:text-zinc-400 italic py-10">No hay órdenes registradas.</p>
                        )}
                        {orders.map(order => (
                            <div key={order.id} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 p-5 flex flex-col md:flex-row justify-between gap-4 md:items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase">Orden: {order.id.slice(0, 8)}...</h3>
                                        <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded ${
                                            order.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                            order.status === 'preparing' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' :
                                            order.status === 'shipped' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                            order.status === 'delivered' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                            order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                            'bg-red-500/10 text-red-500 border border-red-500/20'
                                        }`}>
                                            {order.status === 'approved' ? 'Aprobado' :
                                             order.status === 'preparing' ? 'En Preparación' :
                                             order.status === 'shipped' ? 'Enviado' :
                                             order.status === 'delivered' ? 'Entregado' :
                                             order.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500">
                                        <strong className="dark:text-zinc-300">Cliente:</strong> {order.user_name || 'N/A'} ({order.user_email || 'N/A'})
                                    </p>
                                    <p className="text-[11px] text-zinc-500 mt-1">
                                        <strong className="dark:text-zinc-300">Fecha:</strong> {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Total</p>
                                        <p className="text-brand-orange font-black italic text-lg">${Number(order.total).toLocaleString()}</p>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Cambiar Estado:</label>
                                        <div className="relative">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                className="appearance-none w-36 bg-zinc-100 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/10 rounded-lg p-2.5 pr-8 text-[11px] font-black uppercase italic text-zinc-900 dark:text-white outline-none focus:border-brand-orange cursor-pointer transition-colors"
                                            >
                                                <option value="pending" className="bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white font-black italic">Pendiente</option>
                                                <option value="approved" className="bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white font-black italic">Aprobado</option>
                                                <option value="preparing" className="bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white font-black italic">En Preparación</option>
                                                <option value="shipped" className="bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white font-black italic">Enviado</option>
                                                <option value="delivered" className="bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white font-black italic">Entregado</option>
                                                <option value="cancelled" className="bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white font-black italic">Cancelado</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-brand-orange">
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL DE PRODUCTOS */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-white/5 sticky top-0 bg-white dark:bg-[#111] z-10">
                            <h2 className="text-xl font-black italic uppercase text-brand-orange">
                                {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">ID (Slug Único)</label>
                                    <input type="text" required disabled={!!editingItem} value={productForm.id} onChange={e => setProductForm({...productForm, id: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Título</label>
                                    <input type="text" required value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Categoría</label>
                                    <select required value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white">
                                        <option value="">Seleccionar...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Precio ($)</label>
                                    <input type="number" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Stock</label>
                                    <input type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Imagen Principal (URL)</label>
                                <input type="text" required value={productForm.images} onChange={e => setProductForm({...productForm, images: e.target.value})} placeholder="https://vntg-hub.com/img.jpg" className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Franquicia (Ej: Marvel, Star Wars)</label>
                                <input type="text" value={productForm.franchise} onChange={e => setProductForm({...productForm, franchise: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Descripción</label>
                                <textarea rows="3" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Galería (URLs separadas por coma)</label>
                                <textarea rows="2" value={productForm.gallery} onChange={e => setProductForm({...productForm, gallery: e.target.value})} placeholder="https://img1.jpg, https://img2.jpg" className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                            </div>

                            <button type="submit" className="w-full bg-brand-orange text-white font-black italic uppercase py-4 rounded mt-4 hover:bg-orange-600 transition-colors">
                                Guardar Producto
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CATEGORÍAS */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 rounded-xl w-full max-w-sm">
                        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-white/5">
                            <h2 className="text-xl font-black italic uppercase text-brand-orange">Nueva Categoría</h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">ID (Ej: remeras)</label>
                                <input type="text" required value={categoryForm.id} onChange={e => setCategoryForm({...categoryForm, id: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nombre Visible (Ej: Remeras Oversize)</label>
                                <input type="text" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full bg-zinc-100 dark:bg-white/5 p-3 rounded outline-none text-sm dark:text-white" />
                            </div>
                            <button type="submit" className="w-full bg-brand-orange text-white font-black italic uppercase py-4 rounded mt-4 hover:bg-orange-600 transition-colors">
                                Crear Categoría
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- NUEVO: MODAL DE CONFIRMACIÓN ESTÉTICO --- */}
            {confirmDelete.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0a] border border-brand-orange/30 p-8 md:p-10 max-w-md w-full shadow-2xl relative overflow-hidden group">
                        
                        {/* Decoración estética de VNTG HUB */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50"></div>
                        
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-brand-orange/10 p-4 rounded-full mb-6">
                                <AlertTriangle className="text-brand-orange" size={40} />
                            </div>
                            
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 dark:text-white">
                                ¿Confirmar Eliminación?
                            </h3>
                            
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic leading-relaxed mb-8">
                                Estás a punto de eliminar permanentemente: <br/>
                                <span className="text-brand-orange font-black not-italic uppercase block mt-2 text-base">
                                    "{confirmDelete.title}"
                                </span>
                                Esta acción es irreversible y afectará a la base de datos de VNTG HUB.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button 
                                    onClick={() => setConfirmDelete({ isOpen: false, id: null, title: '', type: '' })}
                                    className="px-6 py-4 bg-zinc-200 dark:bg-white/5 text-zinc-900 dark:text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-300 dark:hover:bg-white/10 transition-all border border-transparent"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={executeDelete}
                                    className="px-6 py-4 bg-brand-orange text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-900 transition-all shadow-lg active:scale-95"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}