import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Package, RefreshCw, Plus, Edit2, Trash2, X, Tag, ClipboardList, ChevronDown, AlertTriangle, MessageSquare, Home } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminPanel() {
    const { addToast } = useToast();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState(new Set());

    const getOrderShippingType = (order) => {
        try {
            const info = JSON.parse(order.shipping_info || '{}');
            return info.shippingType;
        } catch { return null; }
    };

    const getStatusOptions = (order) => {
        if (getOrderShippingType(order) === 'retiro') {
            return [
                { value: 'pending', label: 'Pendiente' },
                { value: 'approved', label: 'Aprobado' },
                { value: 'preparing', label: 'En Preparación' },
                { value: 'ready', label: 'Listo para Retirar' },
            ];
        }
        return [
            { value: 'pending', label: 'Pendiente' },
            { value: 'approved', label: 'Aprobado' },
            { value: 'preparing', label: 'En Preparación' },
            { value: 'shipped', label: 'Enviado' },
            { value: 'delivered', label: 'Entregado' },
        ];
    };

    const toggleOrderSelection = (orderId) => {
        setSelectedOrders(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === orders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(orders.map(o => o.id)));
        }
    };
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
        categoryId: '', price: 0, stock: 0, images: '', gallery: '',
        escala: '', fabricante: '', anio: '', material: '', estado: ''
    });
    const [categoryForm, setCategoryForm] = useState({ id: '', name: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('vntg_user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        if (user.role !== 'admin') {
            navigate('/');
        } else {
            fetchData();
        }
    }, [navigate]);

    const fetchData = () => {
        const token = localStorage.getItem('vntg_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        fetch(`${API_URL}/api/admin/products`, { headers })
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error(err));

        fetch(`${API_URL}/api/admin/categories`, { headers })
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error(err));

        fetch(`${API_URL}/api/admin/orders`, { headers })
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
                try { galStr = JSON.parse(galStr).join(', '); } catch (e) { }
            }
            setProductForm({
                ...product,
                gallery: galStr || '',
                images: product.images || ''
            });
        } else {
            setEditingItem(null);
            setProductForm({
                id: '', title: '', description: '', franchise: '',
                categoryId: '', price: 0, stock: 0, images: '', gallery: '',
                escala: '', fabricante: '', anio: '', material: '', estado: ''
            });
        }
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `${API_URL}/api/admin/products/${editingItem.id}` : `${API_URL}/api/admin/products`;
        const finalGallery = productForm.gallery.split(',').map(s => s.trim()).filter(s => s);

        const token = localStorage.getItem('vntg_token');
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...productForm, gallery: finalGallery })
            });
            if (res.ok) {
                addToast({ title: productForm.title }, editingItem ? 'Producto actualizado' : 'Producto creado', 'success');
                setIsProductModalOpen(false);
                fetchData();
            } else {
                addToast({}, 'Error al guardar producto', 'error');
            }
        } catch (error) { 
            addToast({}, 'Error de conexión', 'error');
            console.error("Error al guardar:", error); 
        }
    };

    // --- MANEJO DE ELIMINACIÓN ESTÉTICA ---
    const openConfirmDelete = (id, title, type) => {
        setConfirmDelete({ isOpen: true, id, ids: null, title, type });
    };

    const executeDelete = async () => {
        const { id, ids, type, title } = confirmDelete;
        const token = localStorage.getItem('vntg_token');

        if (type === 'orders' && ids?.length) {
            try {
                await Promise.all(ids.map(orderId =>
                    fetch(`${API_URL}/api/admin/orders/${orderId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ));
                addToast({ title: `Se eliminaron ${ids.length} órdenes` }, 'Órdenes eliminadas', 'success');
                setConfirmDelete({ isOpen: false, id: null, ids: null, title: '', type: '' });
                setSelectedOrders(new Set());
                fetchData();
            } catch (error) {
                addToast({}, 'Error al eliminar órdenes', 'error');
            }
            return;
        }

        let endpoint, label;
        if (type === 'product') { endpoint = `products/${id}`; label = 'Producto'; }
        else if (type === 'category') { endpoint = `categories/${id}`; label = 'Categoría'; }
        else if (type === 'order') { endpoint = `orders/${id}`; label = 'Orden'; }

        try {
            const res = await fetch(`${API_URL}/api/admin/${endpoint}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                addToast({ title }, `${label} eliminado correctamente`, 'success');
                setConfirmDelete({ isOpen: false, id: null, ids: null, title: '', type: '' });
                fetchData();
            } else {
                addToast({}, `Error al eliminar ${label}`, 'error');
            }
        } catch (error) { 
            addToast({}, 'Error de conexión', 'error');
            console.error("Error al eliminar:", error); 
        }
    };

    // --- MANEJO DE CATEGORÍAS ---
    const handleOpenCategoryModal = (category = null) => {
        if (category) {
            // Si pasamos una categoría, la cargamos para editar
            setCategoryForm({ id: category.id, name: category.name || category.id });
        } else {
            // Si no, vaciamos el form para crear una nueva
            setCategoryForm({ id: '', name: '' });
        }
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        const method = categoryForm.id ? 'PUT' : 'POST';
        const url = categoryForm.id 
            ? `${API_URL}/api/admin/categories/${categoryForm.id}` 
            : `${API_URL}/api/admin/categories`;

        const token = localStorage.getItem('vntg_token');
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(categoryForm)
            });
            if (res.ok) {
                addToast({ title: categoryForm.name || 'Categoría' }, categoryForm.id ? 'Categoría actualizada' : 'Categoría creada', 'success');
                setIsCategoryModalOpen(false);
                fetchData();
            } else {
                addToast({}, 'Error al guardar categoría', 'error');
            }
        } catch (error) { 
            addToast({}, 'Error de conexión', 'error');
            console.error("Error al guardar categoría:", error); 
        }
    };

    // --- MANEJO DE ÓRDENES ---
    // Estados para búsqueda y filtros en órdenes
    const [orderSearch, setOrderSearch] = useState('');
    const [orderFilter, setOrderFilter] = useState('all');

    const filteredOrders = orders.filter(o => {
        const matchesFilter = orderFilter === 'all' || o.status === orderFilter;
        const searchLower = orderSearch.toLowerCase();
        const matchesSearch = !searchLower ||
            (o.id && o.id.toLowerCase().includes(searchLower)) ||
            (o.user_name && o.user_name.toLowerCase().includes(searchLower)) ||
            (o.user_email && o.user_email.toLowerCase().includes(searchLower));
        return matchesFilter && matchesSearch;
    });

    const metrics = {
        procesando: orders.filter(o => o.status === 'preparing').length,
        pendientes: orders.filter(o => o.status === 'pending').length,
        entregados: orders.filter(o => o.status === 'delivered').length,
        ingresos: orders
            .filter(o => o.status !== 'pending' && o.status !== 'cancelled')
            .reduce((sum, o) => sum + Number(o.total), 0),
        total: orders.length,
        ...['approved', 'shipped', 'ready', 'cancelled'].reduce((acc, s) => {
            acc[s] = orders.filter(o => o.status === s).length;
            return acc;
        }, {})
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        const token = localStorage.getItem('vntg_token');
        try {
            const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                addToast({ title: `Orden ${orderId}` }, `Estado cambiado a ${statusLabels[newStatus] || newStatus}`, 'success');
                fetchData();
            } else {
                addToast({}, 'Error al actualizar estado', 'error');
            }
        } catch (error) {
            addToast({}, 'Error de conexión', 'error');
            console.error("Error actualizando estado de la orden:", error);
        }
    };

    const statusLabels = {
        pending: 'Pendiente', approved: 'Aprobado',
        preparing: 'En Preparación', ready: 'Listo para Retirar',
        shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado'
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-brand-dark p-4 md:p-8">
            <div className="max-w-[1700px] mx-auto pt-24 md:pt-28">
                <div className="flex gap-8">

                    {/* ─── SIDEBAR IZQUIERDO ─── */}
                    <aside className="w-56 shrink-0">
                        <div className="sticky top-28 flex flex-col bg-zinc-50 dark:bg-brand-card rounded-xl p-1 gap-1 shadow-sm">
                            <Link
                                to="/"
                                className="flex items-center gap-2 px-4 py-3 text-sm font-black uppercase italic rounded-lg transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            >
                                <Home size={16} /> Volver a Tienda
                            </Link>
                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-1 mt-1">
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-black uppercase italic rounded-lg transition-all mt-1 w-full text-left ${activeTab === 'products' ? 'bg-brand-orange text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                >
                                    <Package size={16} /> Productos
                                </button>
                            <button
                                onClick={() => setActiveTab('categories')}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-black uppercase italic rounded-lg transition-all ${activeTab === 'categories' ? 'bg-brand-orange text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <Tag size={16} /> Categorías
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-black uppercase italic rounded-lg transition-all ${activeTab === 'orders' ? 'bg-brand-orange text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <ClipboardList size={16} /> Órdenes
                            </button>
                            </div>
                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-1 mt-2">
                                <button
                                    onClick={() => navigate('/soporte')}
                                    className="flex items-center gap-2 px-4 py-3 text-sm font-black uppercase italic rounded-lg transition-all w-full text-left text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                >
                                    <MessageSquare size={16} /> Soporte
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* ─── CONTENEDOR PRINCIPAL ─── */}
                    <main className="flex-1 min-w-0">

                        {/* HEADER GLOBAL */}
                        <div className="flex justify-between items-center mb-8 gap-4 border-b border-zinc-200 dark:border-white/5 pb-6">
                            <div>
                                <h1 className="text-4xl font-black italic text-zinc-900 dark:text-white uppercase tracking-tighter">
                                    {activeTab === 'products' ? 'Productos' : activeTab === 'categories' ? 'Categorías' : 'Órdenes'}
                                </h1>
                                <p className="text-brand-orange text-[10px] font-bold uppercase tracking-widest mt-1">
                                    {activeTab === 'products' ? 'Gestión de Inventario' : activeTab === 'categories' ? 'Clasificación de Productos' : `Total: ${metrics.total} pedidos`}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTab === 'products' && (
                                    <button onClick={() => handleOpenProductModal()} className="flex items-center gap-2 bg-brand-orange text-white px-4 py-3 rounded-xl text-xs font-black uppercase italic hover:bg-orange-600 transition-colors shadow-lg active:scale-95">
                                        <Plus size={16} /> Agregar Producto
                                    </button>
                                )}
                                {activeTab === 'categories' && (
                                    <button onClick={handleOpenCategoryModal} className="flex items-center gap-2 bg-brand-orange text-white px-4 py-3 rounded-xl text-xs font-black uppercase italic hover:bg-orange-600 transition-colors shadow-lg active:scale-95">
                                        <Plus size={16} /> Agregar Categoría
                                    </button>
                                )}
                                <button onClick={fetchData} className="p-3 bg-zinc-50 dark:bg-brand-card rounded-2xl text-brand-orange hover:rotate-180 transition-all duration-500 shadow-sm">
                                    <RefreshCw size={24} />
                                </button>
                            </div>
                        </div>

                        {/* ─── VISTA PRODUCTOS ─── */}
                        {activeTab === 'products' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {products.map(p => (
                                    <div key={p.id} className="bg-zinc-50 dark:bg-brand-card p-5 relative group shadow-sm hover:shadow-md hover:border-brand-orange/30 transition-all duration-300 rounded-2xl overflow-hidden">
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
                                                <button onClick={() => handleOpenProductModal(p)} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-brand-orange hover:text-white transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => openConfirmDelete(p.id, p.title, 'product')} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ─── VISTA CATEGORÍAS ─── */}
                        {activeTab === 'categories' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {categories.map(c => (
                                    <div key={c.id} className="bg-zinc-50 dark:bg-brand-card p-5 flex justify-between items-center group rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div>
                                            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase">{c.name || c.id}</h3>
                                            <p className="text-[10px] text-zinc-500 uppercase mt-1">ID: {c.id}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenCategoryModal(c)} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-brand-orange hover:text-white transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => openConfirmDelete(c.id, c.name || c.id, 'category')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ─── VISTA ÓRDENES ─── */}
                        {activeTab === 'orders' && (
                            <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
                                {/* COLUMNA PRINCIPAL */}
                                <div className="space-y-6">

                                    {/* MÉTRICAS */}
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-zinc-50 dark:bg-brand-card p-4 rounded-2xl shadow-sm">
                                            <p className="text-[9px] font-black uppercase text-brand-orange italic tracking-wider mb-1">Procesando</p>
                                            <p className="text-3xl font-black italic text-zinc-900 dark:text-white">{metrics.procesando}</p>
                                        </div>
                                        <div className="bg-zinc-50 dark:bg-brand-card p-4 rounded-2xl shadow-sm">
                                            <p className="text-[9px] font-black uppercase text-yellow-500 italic tracking-wider mb-1">Pendientes</p>
                                            <p className="text-3xl font-black italic text-zinc-900 dark:text-white">{metrics.pendientes}</p>
                                        </div>
                                        <div className="bg-zinc-50 dark:bg-brand-card p-4 rounded-2xl shadow-sm">
                                            <p className="text-[9px] font-black uppercase text-purple-500 italic tracking-wider mb-1">Entregados</p>
                                            <p className="text-3xl font-black italic text-zinc-900 dark:text-white">{metrics.entregados}</p>
                                        </div>
                                        <div className="bg-zinc-50 dark:bg-brand-card p-4 rounded-2xl shadow-sm">
                                            <p className="text-[9px] font-black uppercase text-green-500 italic tracking-wider mb-1">Ingresos</p>
                                            <p className="text-3xl font-black italic text-zinc-900 dark:text-white">${Number(metrics.ingresos).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* BUSCADOR Y FILTROS */}
                                    <div className="bg-zinc-50 dark:bg-brand-card p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Buscar por ID, cliente o email..."
                                                value={orderSearch}
                                                onChange={(e) => setOrderSearch(e.target.value)}
                                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 pl-10 pr-4 py-2.5 rounded-xl outline-none text-[11px] font-bold text-zinc-900 dark:text-white focus:border-brand-orange transition-all placeholder:text-zinc-400"
                                            />
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {['all', 'pending', 'approved', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setOrderFilter(f)}
                                                    className={`px-2.5 py-1.5 text-[9px] font-black uppercase italic rounded-lg border transition-all ${orderFilter === f ? 'bg-brand-orange text-white border-brand-orange shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-600 text-zinc-500 hover:border-brand-orange'}`}
                                                >
                                                    {f === 'all' ? 'Todos' : statusLabels[f]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* LISTA DE ÓRDENES */}
                                    <div className="space-y-4">
                                        {filteredOrders.length > 0 && (
                                            <div className="flex items-center justify-between gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-zinc-500 uppercase italic">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrders.size === filteredOrders.length}
                                                        onChange={toggleSelectAll}
                                                        className="w-4 h-4 accent-brand-orange cursor-pointer"
                                                    />
                                                    Seleccionar todos
                                                </label>
                                                {selectedOrders.size > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            const ids = Array.from(selectedOrders);
                                                            setConfirmDelete({
                                                                isOpen: true,
                                                                id: null,
                                                                ids,
                                                                title: `${ids.length} órdenes`,
                                                                type: 'orders'
                                                            });
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase italic tracking-wider"
                                                    >
                                                        <Trash2 size={14} /> Eliminar seleccionadas ({selectedOrders.size})
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {filteredOrders.length === 0 && (
                                            <p className="text-center text-zinc-500 dark:text-zinc-400 italic py-10">No hay órdenes que coincidan con los filtros.</p>
                                        )}
                                        {filteredOrders.map(order => {
                                            const statusOptions = getStatusOptions(order);
                                            return (
                                            <div key={order.id} className="bg-zinc-50 dark:bg-brand-card p-5 flex flex-col md:flex-row justify-between gap-4 md:items-center rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrders.has(order.id)}
                                                        onChange={() => toggleOrderSelection(order.id)}
                                                        className="w-4 h-4 accent-brand-orange cursor-pointer mt-1 shrink-0"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase">Orden: {order.id.slice(0, 8)}...</h3>
                                                            <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded ${order.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                                    order.status === 'preparing' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' :
                                                                        order.status === 'ready' ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' :
                                                                            order.status === 'shipped' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                                                order.status === 'delivered' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                                                                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                                                        'bg-red-500/10 text-red-500 border border-red-500/20'
                                                                }`}>
                                                                {order.status === 'approved' ? 'Aprobado' :
                                                                    order.status === 'preparing' ? 'En Preparación' :
                                                                        order.status === 'ready' ? 'Listo para Retirar' :
                                                                            order.status === 'shipped' ? 'Enviado' :
                                                                                order.status === 'delivered' ? 'Entregado' :
                                                                                    order.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-zinc-500">
                                                            <strong className="dark:text-zinc-300">Cliente:</strong> {order.user_name || 'N/A'} ({order.user_email || 'N/A'})
                                                        </p>
                                                        <p className="text-[11px] text-zinc-500 mt-1">
                                                            <strong className="dark:text-zinc-300">Fecha:</strong> {new Date(order.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })} (Hora ARG)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 ml-7 md:ml-0">
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
                                                                className="appearance-none w-36 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg p-2.5 pr-8 text-[11px] font-black uppercase italic text-zinc-900 dark:text-white outline-none focus:border-brand-orange cursor-pointer transition-colors"
                                                            >
                                                                {statusOptions.map(opt => (
                                                                    <option key={opt.value} value={opt.value} className="bg-zinc-50 dark:bg-brand-card text-zinc-900 dark:text-white font-black italic">{opt.label}</option>
                                                                ))}
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-brand-orange">
                                                                <ChevronDown size={14} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => openConfirmDelete(order.id, `Orden ${order.id}`, 'order')}
                                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                        title="Eliminar orden permanentemente"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* COLUMNA LATERAL - RESUMEN / SOPORTE */}
                                <div className="space-y-6">
                                    <div className="bg-zinc-50 dark:bg-brand-card rounded-2xl shadow-sm p-6">
                                        <h3 className="text-xs font-black uppercase italic text-brand-orange tracking-wider mb-4">Resumen de Pedidos</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-bold text-zinc-500 uppercase italic">Total Pedidos</span>
                                                <span className="font-black text-zinc-900 dark:text-white">{metrics.total}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-bold text-zinc-500 uppercase italic">Pendientes</span>
                                                <span className="font-black text-yellow-500">{metrics.pendientes}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-bold text-zinc-500 uppercase italic">Procesando</span>
                                                <span className="font-black text-brand-orange">{metrics.procesando}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-bold text-zinc-500 uppercase italic">Enviados</span>
                                                <span className="font-black text-blue-500">{metrics.shipped}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-bold text-zinc-500 uppercase italic">Entregados</span>
                                                <span className="font-black text-purple-500">{metrics.entregados}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-bold text-zinc-500 uppercase italic">Aprobados</span>
                                                <span className="font-black text-green-500">{metrics.approved}</span>
                                            </div>
                                            {metrics.ready > 0 && (
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="font-bold text-zinc-500 uppercase italic">Listos para Retirar</span>
                                                    <span className="font-black text-cyan-500">{metrics.ready}</span>
                                                </div>
                                            )}
                                            {metrics.cancelled > 0 && (
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="font-bold text-zinc-500 uppercase italic">Cancelados</span>
                                                    <span className="font-black text-red-500">{metrics.cancelled}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-black uppercase italic text-zinc-900 dark:text-white">Ingresos Totales</span>
                                                    <span className="font-black italic text-green-500">${Number(metrics.ingresos).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* MODAL DE PRODUCTOS */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[999] flex justify-center items-start p-4 pt-24 md:pt-32 overflow-y-auto">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[80vh] shadow-2xl flex flex-col overflow-hidden">
                        {/* Header Estático */}
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900 z-10">
                            <h2 className="text-xl font-black italic uppercase text-brand-orange">
                                {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Área Scrolleable Interna */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">

                                {/* NUEVO: ID (Solo lectura) y Nombre del Producto (Title) */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {editingItem && (
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">ID (Auto)</label>
                                            <input type="text" disabled value={productForm.id} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-zinc-500 cursor-not-allowed" />
                                        </div>
                                    )}
                                    <div className={editingItem ? "md:col-span-3" : "md:col-span-4"}>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nombre del Producto *</label>
                                        <input type="text" required value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })} placeholder="Ej: Remera Vintage Oversize" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white focus:border-brand-orange/50 transition-all placeholder:text-zinc-600" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Escala</label>
                                        <input type="text" value={productForm.escala} onChange={e => setProductForm({ ...productForm, escala: e.target.value })} placeholder="Ej: 1/6, 1:10" className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white placeholder:text-zinc-600" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Fabricante</label>
                                        <input type="text" value={productForm.fabricante} onChange={e => setProductForm({ ...productForm, fabricante: e.target.value })} placeholder="Ej: Hot Toys, Hasbro" className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white placeholder:text-zinc-600" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Año</label>
                                        <input type="text" value={productForm.anio} onChange={e => setProductForm({ ...productForm, anio: e.target.value })} placeholder="Ej: 2024" className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white placeholder:text-zinc-600" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Material</label>
                                        <input type="text" value={productForm.material} onChange={e => setProductForm({ ...productForm, material: e.target.value })} placeholder="Ej: PVC, Resina" className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white placeholder:text-zinc-600" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Estado</label>
                                        <input type="text" value={productForm.estado} onChange={e => setProductForm({ ...productForm, estado: e.target.value })} placeholder="Ej: Mint, Loose, Nuevo" className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white placeholder:text-zinc-600" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Categoría</label>
                                        <div className="relative">
                                            <select 
                                                required 
                                                value={productForm.categoryId} 
                                                onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })} 
                                                className={`appearance-none w-full bg-zinc-900 border border-zinc-800 p-3 pr-10 rounded-xl outline-none text-sm font-bold uppercase italic focus:border-brand-orange transition-all cursor-pointer ${!productForm.categoryId ? 'text-zinc-500' : 'text-white'}`}
                                            >
                                                <option value="" className="bg-zinc-950">Seleccionar...</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id} className="bg-zinc-950">
                                                        {c.name || c.id}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-orange">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Precio ($)</label>
                                        <input type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Stock</label>
                                        <input type="number" required value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Imagen Principal (URL)</label>
                                    <input type="text" required value={productForm.images} onChange={e => setProductForm({ ...productForm, images: e.target.value })} placeholder="https://vntg-hub.com/img.jpg" className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white placeholder:text-zinc-600" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Franquicia (Ej: Marvel, Star Wars)</label>
                                    <input type="text" value={productForm.franchise} onChange={e => setProductForm({ ...productForm, franchise: e.target.value })} className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Descripción</label>
                                    <textarea rows="3" value={productForm.description} onChange={setProductForm ? e => setProductForm({ ...productForm, description: e.target.value }) : undefined} className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Galería (URLs separadas por coma)</label>
                                    <textarea rows="2" value={productForm.gallery} onChange={e => setProductForm({ ...productForm, gallery: e.target.value })} placeholder="https://img1.jpg, https://img2.jpg" className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white border border-transparent focus:border-brand-orange placeholder:text-zinc-600" />
                                </div>

                                <button type="submit" className="w-full bg-brand-orange text-white font-black italic uppercase py-4 rounded-xl mt-4 hover:bg-orange-600 transition-all shadow-lg active:scale-95">
                                    Guardar Producto
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CATEGORÍAS */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900">
                            <h2 className="text-xl font-black italic uppercase text-brand-orange">
                                {categoryForm.id ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                            {categoryForm.id && (
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">ID (Auto)</label>
                                    <input type="text" disabled value={categoryForm.id} className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white/50 cursor-not-allowed" />
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nombre Visible (Ej: Remeras Oversize)</label>
                                <input type="text" required value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} className=" w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm text-white focus:border-brand-orange transition-all" />
                            </div>
                            <button type="submit" className="w-full bg-brand-orange text-white font-black italic uppercase py-4 rounded-xl mt-4 hover:bg-orange-600 transition-all shadow-lg active:scale-95">
                                {categoryForm.id ? 'Guardar Cambios' : 'Crear Categoría'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE CONFIRMACIÓN ESTÉTICO --- */}
            {confirmDelete.isOpen && (
                <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-center items-start p-4 pt-24 md:pt-40 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-brand-orange/30 p-4 sm:p-8 md:p-10 max-w-md w-full shadow-2xl relative overflow-hidden rounded-3xl group">

                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50"></div>

                        <div className="flex flex-col items-center text-center">
                            <div className="bg-brand-orange/10 p-4 rounded-full mb-6">
                                <AlertTriangle className="text-brand-orange" size={40} />
                            </div>

                            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 dark:text-white">
                                {confirmDelete.type === 'order' || confirmDelete.type === 'orders' ? '¿Eliminar Orden?' : '¿Confirmar Eliminación?'}
                            </h3>

                            {confirmDelete.type === 'orders' ? (
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic leading-relaxed mb-8">
                                    Estás a punto de eliminar <strong className="text-brand-orange not-italic">{confirmDelete.ids?.length}</strong> órdenes permanentemente.
                                    <span className="block mt-3 text-zinc-600 dark:text-zinc-400">
                                        Se restaurará el stock de los productos y las órdenes desaparecerán del sistema. <strong className="text-red-500 not-italic">Esta acción no se puede deshacer.</strong>
                                    </span>
                                </p>
                            ) : confirmDelete.type === 'order' ? (
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic leading-relaxed mb-8">
                                    Estás a punto de eliminar completamente la orden: <br />
                                    <span className="text-brand-orange font-black not-italic block mt-2 text-base tracking-widest">
                                        {confirmDelete.title}
                                    </span>
                                    <span className="block mt-3 text-zinc-600 dark:text-zinc-400">
                                        Se restaurará el stock de los productos y la orden desaparecerá del sistema. <strong className="text-red-500 not-italic">Esta acción no se puede deshacer.</strong>
                                    </span>
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic leading-relaxed mb-8">
                                    Estás a punto de eliminar permanentemente: <br />
                                    <span className="text-brand-orange font-black not-italic uppercase block mt-2 text-base">
                                        "{confirmDelete.title}"
                                    </span>
                                    Esta acción es irreversible y afectará a la base de datos de VNTG HUB.
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setConfirmDelete({ isOpen: false, id: null, ids: null, title: '', type: '' })}
                                    className="px-6 py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all border border-transparent rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={executeDelete}
                                    className="px-6 py-4 bg-brand-orange text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-900 transition-all shadow-lg active:scale-95 rounded-xl"
                                >
                                    {confirmDelete.type === 'order' ? 'Eliminar Orden' : 'Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}