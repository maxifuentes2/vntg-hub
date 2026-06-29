// IMPORTACIONES
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Package, RefreshCw, Plus, Pen, Trash2, X, Tag, ClipboardList, ChevronDown, TriangleAlert, MessageSquare, House, Truck, Save, Loader, Landmark, CircleCheck, Eye, Download, Bitcoin, LayoutDashboard, ShieldCheck, Box, List, FileText, Settings, Settings2, Users, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { slugify } from '../utils/slugify';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

import { formatArgTime } from '../utils/dateUtils';

export default function AdminPanel() {
    const { addToast } = useToast();
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [shippingConfig, setShippingConfig] = useState({ envio_normal: 9426.05, envio_prioritario: 17276.99, envio_gratis_desde: 200000 });
    const [savingShipping, setSavingShipping] = useState(false);
    const [pendingPayments, setPendingPayments] = useState([]);
    
    // NUEVO: Estado de carga copiado del panel de soporte
    const [loading, setLoading] = useState(true);

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
    const [supportMessages, setSupportMessages] = useState([]);
    const [supportFilter, setSupportFilter] = useState('pending'); // pending, in_progress, resolved

    const supportThreads = useMemo(() => {
        const sorted = [...supportMessages].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
        const groups = new Map();
        for(const m of sorted){
            let key = m.thread_id || m.id;
            const root = supportMessages.find(x => x.id == key);
            if(root && root.thread_id) key = root.thread_id;
            if(!groups.has(key)) groups.set(key, []);
            groups.get(key).push(m);
        }
        
        return Array.from(groups.values()).map(msgs => {
            const lastMsg = msgs[msgs.length - 1];
            // Buscar el primer mensaje que sea de un cliente (no nuestro correo)
            const firstUserMsg = msgs.find(m => m.email && m.email.toLowerCase() !== 'hubvntg@gmail.com');
            
            if (!firstUserMsg) return null; // Si no hay mensajes de clientes reales en el hilo, lo ignoramos

            return {
                id: firstUserMsg.id,
                nombre: firstUserMsg.nombre,
                email: firstUserMsg.email,
                mensaje: firstUserMsg.mensaje,
                motivo: firstUserMsg.motivo || 'No especificado',
                status: lastMsg.status || 'pending',
                fecha: lastMsg.created_at,
                assignment: lastMsg.assignment || 'IA'
            }
        }).filter(Boolean).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    }, [supportMessages]);

    const supportCounts = useMemo(() => {
        return supportThreads.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, { pending: 0, replied: 0, finished: 0 });
    }, [supportThreads]);

    const navigate = useNavigate();

    // Estados para Modales
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isCategoryProductsOpen, setIsCategoryProductsOpen] = useState(false);
    const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState(null);
    const [productFilterCategory, setProductFilterCategory] = useState('all');
    const [productFilterFranchise, setProductFilterFranchise] = useState('all');
    const [productSortOrder, setProductSortOrder] = useState('none');
    const [categorySortOrder, setCategorySortOrder] = useState('none');
    const [editingItem, setEditingItem] = useState(null);

    // Estado para el Modal de Confirmación Estético
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
        escala: '', fabricante: '', anio: '', material: '', estado: '', discount_percentage: 0
    });
    const [categoryForm, setCategoryForm] = useState({ id: '', name: '', banner_url: '' });

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

    // Función modificada para soportar estado de "loading" igual que en SupportPanel
    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('vntg_token');
            if (!token) {
                navigate('/login');
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const handleResponse = async (url, setter) => {
                try {
                    const res = await fetch(url, { headers });
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('vntg_token');
                        localStorage.removeItem('vntg_user');
                        navigate('/login');
                        return;
                    }
                    const data = await res.json();
                    if (Array.isArray(data)) setter(data);
                } catch (err) {
                    console.error(err);
                }
            };

            await Promise.all([
                handleResponse(`${API_URL}/api/admin/products`, setProducts),
                handleResponse(`${API_URL}/api/admin/categories`, setCategories),
                handleResponse(`${API_URL}/api/admin/orders`, setOrders),
                handleResponse(`${API_URL}/api/support/messages`, setSupportMessages),
                fetch(`${API_URL}/api/admin/orders`, { headers })
                    .then(r => r.ok ? r.json() : [])
                    .then(data => {
                        const arr = Array.isArray(data) ? data : [];
                        setPendingPayments(arr.filter(o =>
                            o.status === 'pending' &&
                            (o.payment_method === 'transfer' || o.payment_method === 'crypto') &&
                            o.crypto_info && (() => { try { const info = JSON.parse(o.crypto_info); return info.proofUrl || info.proofData; } catch { return false; } })()
                        ));
                    })
                    .catch(() => {}),
                fetch(`${API_URL}/api/admin/shipping-config`, { headers })
                    .then(r => r.ok ? r.json() : null)
                    .then(d => { if (d) setShippingConfig(d); })
                    .catch(() => {})
            ]);
        } finally {
            setLoading(false);
        }
    };

    // MANEJO DE PRODUCTOS ---
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
                escala: '', fabricante: '', anio: '', material: '', estado: '', discount_percentage: 0
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
                window.dispatchEvent(new CustomEvent('vntg-categories-update'));
            } else {
                addToast({}, 'Error al guardar producto', 'error');
            }
        } catch (error) { 
            addToast({}, 'Error de conexión', 'error');
            console.error("Error al guardar:", error); 
        }
    };

    const handleSaveShipping = async () => {
        const token = localStorage.getItem('vntg_token');
        setSavingShipping(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/shipping-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(shippingConfig),
            });
            if (res.ok) {
                addToast({}, 'Configuración de envío actualizada', 'success');
                fetchData();
            } else {
                addToast({}, 'Error al guardar configuración', 'error');
            }
        } catch {
            addToast({}, 'Error de conexión', 'error');
        }
        setSavingShipping(false);
    };

    // MANEJO DE ELIMINACIÓN ESTÉTICA ---
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
        else if (type === 'support') { endpoint = `../support/messages/${id}`; label = 'Ticket'; }

        try {
            const res = await fetch(`${API_URL}/api/admin/${endpoint}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                addToast({ title }, `${label} eliminado correctamente`, 'success');
                setConfirmDelete({ isOpen: false, id: null, ids: null, title: '', type: '' });
                fetchData();
                if (type === 'product' || type === 'category') {
                    window.dispatchEvent(new CustomEvent('vntg-categories-update'));
                }
            } else {
                addToast({}, `Error al eliminar ${label}`, 'error');
            }
        } catch (error) { 
            addToast({}, 'Error de conexión', 'error');
            console.error("Error al eliminar:", error); 
        }
    };

    // MANEJO DE CATEGORÍAS ---
    const handleOpenCategoryModal = (category = null) => {
        if (category) {
            setCategoryForm({ id: category.id, name: category.name || category.id, banner_url: category.banner_url || '' });
        } else {
            setCategoryForm({ id: '', name: '', banner_url: '' });
        }
        setIsCategoryModalOpen(true);
    };

    const handleViewCategoryProducts = (category) => {
        setSelectedCategoryForProducts(category);
        setIsCategoryProductsOpen(true);
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
                window.dispatchEvent(new CustomEvent('vntg-categories-update'));
            } else {
                addToast({}, 'Error al guardar categoría', 'error');
            }
        } catch (error) { 
            addToast({}, 'Error de conexión', 'error');
            console.error("Error al guardar categoría:", error); 
        }
    };

    const handleRemoveCategoryBanner = async () => {
        if (!categoryForm.id) return;
        const token = localStorage.getItem('vntg_token');
        try {
            const res = await fetch(`${API_URL}/api/admin/categories/${categoryForm.id}/banner`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCategoryForm(prev => ({ ...prev, banner_url: '' }));
                addToast({}, 'Banner eliminado', 'success');
                fetchData();
            } else {
                addToast({}, 'Error al eliminar banner', 'error');
            }
        } catch (error) {
            addToast({}, 'Error de conexión', 'error');
        }
    };

    // MANEJO DE ÓRDENES ---
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

    const uniqueFranchises = useMemo(() => {
        const fr = products.map(p => p.franchise).filter(f => f);
        return [...new Set(fr)];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (productFilterCategory !== 'all' && (p.categoryId || '') !== productFilterCategory) return false;
            if (productFilterFranchise !== 'all' && (p.franchise || '') !== productFilterFranchise) return false;
            return true;
        }).sort((a, b) => {
            if (productSortOrder === 'asc') return (a.title || '').localeCompare(b.title || '');
            if (productSortOrder === 'desc') return (b.title || '').localeCompare(a.title || '');
            return 0;
        });
    }, [products, productFilterCategory, productFilterFranchise, productSortOrder]);

    return (
        <div className="max-w-[1500px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 items-start">
            
            {/* --- SIDEBAR DE NAVEGACIÓN --- */}
            <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl sticky top-24">
                <div className="px-2 mb-6 mt-2">
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck size={28} className="text-brand-orange" />
                        Admin
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-widest">Panel de Control</p>
                </div>

                <nav className="flex flex-col gap-1">
                    {[
                        { id: 'products', label: 'Productos', icon: Box },
                        { id: 'categories', label: 'Categorías', icon: List },
                        { id: 'orders', label: 'Órdenes', icon: FileText },
                        { id: 'support', label: 'Soporte', icon: MessageSquare },
                        { id: 'shipping', label: 'Envíos', icon: Truck },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-black uppercase italic tracking-widest ${isActive ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-[1.02]' : 'text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1 min-w-0 w-full space-y-8">
                
                {/* CABECERA DE LA PESTAÑA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl">
                    <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter dark:text-white">
                            {activeTab === 'products' ? 'Gestión de Productos' :
                             activeTab === 'categories' ? 'Categorías y Colecciones' :
                             activeTab === 'orders' ? 'Órdenes y Pagos' :
                             activeTab === 'support' ? 'Tickets de Soporte' :
                             'Configuración de Envíos'}
                        </h2>
                        <p className="text-xs text-zinc-500 uppercase font-bold mt-1 tracking-widest">
                            {activeTab === 'products' && `${products.length} productos en catálogo`}
                            {activeTab === 'categories' && `${categories.length} categorías registradas`}
                            {activeTab === 'orders' && `${orders.length} transacciones totales`}
                            {activeTab === 'support' && `${supportMessages.length} mensajes en historial`}
                        </p>
                    </div>
                    
                    {/* Botón de Acción Principal */}
                    {activeTab === 'products' && (
                        <button onClick={() => handleOpenProductModal()} className="flex items-center gap-2 px-5 py-3 bg-brand-orange text-white text-[11px] font-black uppercase italic rounded-2xl hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-zinc-900 transition-all shadow-md">
                            <Plus size={16} /> Nuevo Producto
                        </button>
                    )}
                    {activeTab === 'categories' && (
                        <button onClick={() => handleOpenCategoryModal()} className="flex items-center gap-2 px-5 py-3 bg-brand-orange text-white text-[11px] font-black uppercase italic rounded-2xl hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-zinc-900 transition-all shadow-md">
                            <Plus size={16} /> Nueva Categoría
                        </button>
                    )}
                    {activeTab === 'shipping' && (
                        <button onClick={handleSaveShipping} disabled={savingShipping} className="flex items-center gap-2 px-5 py-3 bg-brand-orange text-white text-[11px] font-black uppercase italic rounded-2xl hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-zinc-900 transition-all shadow-md disabled:opacity-50">
                            {savingShipping ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} Guardar
                        </button>
                    )}
                </div>

                {/* --- CONTENIDO POR PESTAÑA --- */}
                
                {/* ====== PRODUCTOS ====== */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        {/* Filtros */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl flex flex-wrap gap-3">
                            <select value={productFilterCategory} onChange={e => setProductFilterCategory(e.target.value)} className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl outline-none text-[11px] uppercase font-bold text-zinc-900 dark:text-white transition-all cursor-pointer">
                                <option value="all">Todas las categorías</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                            </select>
                            <select value={productFilterFranchise} onChange={e => setProductFilterFranchise(e.target.value)} className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl outline-none text-[11px] uppercase font-bold text-zinc-900 dark:text-white transition-all cursor-pointer">
                                <option value="all">Todas las franquicias</option>
                                {uniqueFranchises.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <select value={productSortOrder} onChange={e => setProductSortOrder(e.target.value)} className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl outline-none text-[11px] uppercase font-bold text-zinc-900 dark:text-white transition-all cursor-pointer">
                                <option value="none">Sin orden</option>
                                <option value="asc">A-Z ↑</option>
                                <option value="desc">Z-A ↓</option>
                            </select>
                        </div>

                        {/* Tabla de Productos */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                    <thead className="bg-zinc-100 dark:bg-zinc-950/50 text-[10px] font-black uppercase italic tracking-widest border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-3xl">Producto</th>
                                            <th className="px-6 py-4">ID / Cat</th>
                                            <th className="px-6 py-4">Precio</th>
                                            <th className="px-6 py-4">Stock</th>
                                            <th className="px-6 py-4 text-right rounded-tr-3xl">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {loading ? (
                                            <tr><td colSpan="5" className="p-8 text-center"><Loader className="animate-spin mx-auto text-brand-orange" /></td></tr>
                                        ) : filteredProducts.length === 0 ? (
                                            <tr><td colSpan="5" className="p-8 text-center text-zinc-500 italic">No se encontraron productos.</td></tr>
                                        ) : (
                                            filteredProducts.map(p => (
                                                <tr key={p.id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group">
                                                    <td className="px-6 py-4 flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                                                            {p.images ? (
                                                                <img src={p.images} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none' }} />
                                                            ) : <Box className="m-auto mt-3 opacity-20" size={24}/>}
                                                        </div>
                                                        <span className="font-black uppercase text-zinc-900 dark:text-white max-w-[200px] truncate block" title={p.title}>{p.title}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider">{p.id}</p>
                                                        <p className="text-[9px] uppercase mt-0.5">{p.categoryId || '-'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 font-black italic text-brand-orange">
                                                        {formatPrice(p.price)}
                                                        {p.discount_percentage > 0 && (
                                                            <span className="ml-2 text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full not-italic">-{p.discount_percentage}%</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                            {p.stock}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleOpenProductModal(p)} className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange rounded-xl transition-colors">
                                                                <Pen size={14} />
                                                            </button>
                                                            <button onClick={() => openConfirmDelete(p.id, p.title, 'product')} className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-xl transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== CATEGORÍAS ====== */}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {categories.map(c => (
                                <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                                    <div className="h-32 bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden">
                                        {c.banner_url ? (
                                            <img src={c.banner_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center"><Box className="text-zinc-400" size={32} /></div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                        <h3 className="absolute bottom-4 left-5 text-xl font-black italic uppercase tracking-widest text-white">{c.name || c.id}</h3>
                                    </div>
                                    <div className="p-5 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                                        <button onClick={() => handleViewCategoryProducts(c)} className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500 hover:text-brand-orange transition-colors flex items-center gap-1.5">
                                            <Eye size={14} /> Ver Productos
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenCategoryModal(c)} className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange rounded-xl transition-colors">
                                                <Pen size={14} />
                                            </button>
                                            <button onClick={() => openConfirmDelete(c.id, c.name || c.id, 'category')} className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-xl transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ====== ÓRDENES ====== */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        {/* Selector masivo de órdenes */}
                        {selectedOrders.size > 0 && (
                            <div className="bg-brand-orange/10 border border-brand-orange/30 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                                <span className="text-brand-orange font-black italic uppercase tracking-widest text-sm flex items-center gap-2">
                                    <CircleCheck size={18} /> {selectedOrders.size} {selectedOrders.size === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}
                                </span>
                                <button
                                    onClick={() => {
                                    const ids = [...selectedOrders];
                                    setConfirmDelete({ isOpen: true, id: null, ids, title: '', type: 'orders' });
                                }}
                                    className="px-5 py-2.5 bg-red-500 text-white font-black italic uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-600 transition-colors shadow-md"
                                >
                                    Eliminar Seleccionadas
                                </button>
                            </div>
                        )}

                        {/* Tabla de Órdenes */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                    <thead className="bg-zinc-100 dark:bg-zinc-950/50 text-[10px] font-black uppercase italic tracking-widest border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-3xl w-12 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={orders.length > 0 && selectedOrders.size === orders.length}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 accent-brand-orange rounded cursor-pointer"
                                                />
                                            </th>
                                            <th className="px-6 py-4">Orden / Fecha</th>
                                            <th className="px-6 py-4">Cliente</th>
                                            <th className="px-6 py-4">Monto</th>
                                            <th className="px-6 py-4">Estado</th>
                                            <th className="px-6 py-4 text-right rounded-tr-3xl">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {orders.map(order => {
                                            let cryptoInfo = {};
                                            try { cryptoInfo = order.crypto_info ? JSON.parse(order.crypto_info) : {}; } catch(e){}

                                            const pm = order.payment_method;
                                            const paymentLabel = pm === 'transfer' ? 'Transf.' : pm === 'crypto' ? 'Crypto' : 'Mercado Pago';
                                            const paymentColor = pm === 'transfer'
                                                ? 'text-blue-500 bg-blue-100 dark:bg-blue-500/10'
                                                : pm === 'crypto'
                                                    ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/10'
                                                    : 'text-sky-600 bg-sky-100 dark:bg-sky-500/10';

                                            return (
                                                <tr key={order.id} className={`hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group ${selectedOrders.has(order.id) ? 'bg-brand-orange/5 dark:bg-brand-orange/10' : ''}`}>
                                                    <td className="px-6 py-4 text-center">
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedOrders.has(order.id)}
                                                            onChange={() => toggleOrderSelection(order.id)}
                                                            className="w-4 h-4 accent-brand-orange rounded cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-black uppercase tracking-wider text-zinc-900 dark:text-white">#{order.id.slice(0,8)}</p>
                                                        <p className="text-[10px] font-bold text-zinc-500 mt-1">{formatArgTime(order.created_at)}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-zinc-700 dark:text-zinc-300">{order.user_name || 'N/A'}</p>
                                                        <p className="text-[10px] text-zinc-500 truncate max-w-[150px]" title={order.user_email}>{order.user_email}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-black italic text-brand-orange block">{formatPrice(order.total)}</span>
                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${paymentColor}`}>
                                                            {paymentLabel}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 min-w-[220px]">
                                                        <div className="flex flex-col gap-2">
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                                className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold uppercase outline-none focus:border-brand-orange transition-all cursor-pointer"
                                                            >
                                                                <option value="pending">Pendiente de pago</option>
                                                                <option value="approved">Aprobado / Pagado</option>
                                                                <option value="preparing">En preparación</option>
                                                                <option value="shipped">Enviado</option>
                                                                <option value="delivered">Entregado</option>
                                                            </select>
                                                            {cryptoInfo.proofData && (
                                                                <a 
                                                                    href={cryptoInfo.proofUrl || '#'} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="text-[10px] flex items-center gap-1 font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline"
                                                                >
                                                                    <Eye size={12}/> Ver Comprobante
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => openConfirmDelete(order.id, `Orden #${order.id.slice(0,8)}`, 'order')} className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== SOPORTE ====== */}
                {activeTab === 'support' && (
                    <div className="space-y-6">
                        {/* Filtros de Soporte */}
                        <div className="flex flex-wrap gap-2">
                            {['pending', 'replied', 'finished'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSupportFilter(f)}
                                    className={`px-5 py-2.5 text-[11px] font-black uppercase italic rounded-2xl border transition-all ${supportFilter === f ? 'bg-brand-orange text-white border-brand-orange shadow-md scale-105' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-brand-orange'}`}
                                >
                                    {f === 'pending' ? 'Sin Respuesta' : f === 'replied' ? 'En Progreso' : 'Resueltos'} 
                                    <span className="ml-2 bg-black/10 px-1.5 py-0.5 rounded-md">{supportCounts[f]}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {(() => {
                                const allThreads = supportThreads.filter(t => t.status === supportFilter);

                                if(allThreads.length === 0) {
                                    return (
                                        <div className="col-span-full py-16 text-center text-zinc-500 italic font-bold">
                                            No hay tickets en esta categoría.
                                        </div>
                                    );
                                }

                                return allThreads.map(t => (
                                    <div key={t.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between group hover:border-brand-orange/30 transition-all">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase">{t.nombre}</h3>
                                                    <a href={`mailto:${t.email}`} className="text-[10px] text-zinc-500 font-bold hover:underline">{t.email}</a>
                                                </div>
                                                <span className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black uppercase tracking-widest rounded-lg">{t.motivo}</span>
                                            </div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 italic line-clamp-3 mb-4">"{t.mensaje}"</p>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                                            <p className="text-[10px] text-zinc-400 font-bold">{formatArgTime(t.fecha)}</p>
                                            
                                            <div className="flex gap-2">
                                                <select
                                                    value={t.assignment}
                                                    onChange={async (e) => {
                                                        const newVal = e.target.value;
                                                        const token = localStorage.getItem('vntg_token');
                                                        try {
                                                            const res = await fetch(`${API_URL}/api/support/messages/${t.id}/assign`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                body: JSON.stringify({ assignment: newVal })
                                                            });
                                                            if(res.ok) {
                                                                fetchData();
                                                                addToast({title: 'Soporte'}, 'Asignación actualizada', 'success');
                                                            }
                                                        } catch(err) {}
                                                    }}
                                                    className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-1.5 rounded-xl text-[10px] font-bold uppercase outline-none"
                                                >
                                                    <option value="IA">Robot</option>
                                                    <option value="HUMANO">Humano</option>
                                                </select>
                                                
                                                <select
                                                    value={t.status}
                                                    onChange={async (e) => {
                                                        const newVal = e.target.value;
                                                        const token = localStorage.getItem('vntg_token');
                                                        try {
                                                            const res = await fetch(`${API_URL}/api/support/messages/${t.id}/status`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                body: JSON.stringify({ status: newVal })
                                                            });
                                                            if(res.ok) {
                                                                fetchData();
                                                                addToast({title: 'Soporte'}, 'Estado actualizado', 'success');
                                                            }
                                                        } catch(err) {}
                                                    }}
                                                    className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-1.5 rounded-xl text-[10px] font-bold uppercase outline-none"
                                                >
                                                    <option value="pending">Pdte.</option>
                                                    <option value="replied">En Prog.</option>
                                                    <option value="finished">Resuelto</option>
                                                </select>
                                                
                                                <button
                                                    onClick={() => openConfirmDelete(t.id, `Ticket de ${t.nombre}`, 'support')}
                                                    className="p-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                )}

                {/* ====== ENVÍOS ====== */}
                {activeTab === 'shipping' && (
                    <div className="max-w-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase italic tracking-widest text-zinc-900 dark:text-white mb-2">Costo Envío Normal (ARS)</label>
                                <input
                                    type="number"
                                    value={shippingConfig.envio_normal}
                                    onChange={(e) => setShippingConfig({ ...shippingConfig, envio_normal: Number(e.target.value) })}
                                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange transition-colors text-zinc-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase italic tracking-widest text-zinc-900 dark:text-white mb-2">Costo Envío Prioritario (ARS)</label>
                                <input
                                    type="number"
                                    value={shippingConfig.envio_prioritario}
                                    onChange={(e) => setShippingConfig({ ...shippingConfig, envio_prioritario: Number(e.target.value) })}
                                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange transition-colors text-zinc-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase italic tracking-widest text-zinc-900 dark:text-white mb-2">Envío Gratis Desde (ARS)</label>
                                <input
                                    type="number"
                                    value={shippingConfig.envio_gratis_desde}
                                    onChange={(e) => setShippingConfig({ ...shippingConfig, envio_gratis_desde: Number(e.target.value) })}
                                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-brand-orange transition-colors text-zinc-900 dark:text-white"
                                />
                                <p className="text-[10px] text-zinc-500 italic mt-2">Los pedidos que superen este monto tendrán envío normal gratuito.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODALES QUE YA ESTABAN --- */}
            {/* Modal Producto */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-brand-dark p-6 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border border-brand-orange/20 shadow-2xl">
                        <button onClick={() => setIsProductModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-brand-orange transition-colors"><X size={24} /></button>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 dark:text-white">
                            {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Título del Producto</label>
                                        <input placeholder="Título del producto" required className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Descripción</label>
                                        <textarea placeholder="Descripción" required rows={3} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all resize-none" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Precio</label>
                                            <input type="number" placeholder="Precio" required className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.price === 0 ? 0 : productForm.price || ''} onChange={e => setProductForm({ ...productForm, price: e.target.value === '' ? '' : Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Descuento</label>
                                            <input type="number" placeholder="Descuento (%)" required className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.discount_percentage === 0 ? 0 : productForm.discount_percentage || ''} onChange={e => setProductForm({ ...productForm, discount_percentage: e.target.value === '' ? '' : Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Stock</label>
                                            <input type="number" placeholder="Stock" required className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.stock === 0 ? 0 : productForm.stock || ''} onChange={e => setProductForm({ ...productForm, stock: e.target.value === '' ? '' : Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Categoría</label>
                                            <select className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}>
                                                <option value="">Sin Categoría</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Franquicia</label>
                                            <input placeholder="Ej. Star Wars" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.franchise} onChange={e => setProductForm({ ...productForm, franchise: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Escala</label>
                                            <input placeholder="Escala" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.escala} onChange={e => setProductForm({ ...productForm, escala: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Fabricante</label>
                                            <input placeholder="Fabricante" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.fabricante} onChange={e => setProductForm({ ...productForm, fabricante: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Año</label>
                                            <input placeholder="Año" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.anio} onChange={e => setProductForm({ ...productForm, anio: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Material</label>
                                            <input placeholder="Material" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.material} onChange={e => setProductForm({ ...productForm, material: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Estado</label>
                                        <input placeholder="Ej. Nuevo en caja" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.estado} onChange={e => setProductForm({ ...productForm, estado: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Imagen Principal (URL)</label>
                                        <input placeholder="URL Imagen Principal" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all" value={productForm.images} onChange={e => setProductForm({ ...productForm, images: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1 ml-2 uppercase tracking-wider">Galería (URLs por coma)</label>
                                        <textarea placeholder="URLs Galería (separadas por coma)" rows={2} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-brand-orange transition-all resize-none" value={productForm.gallery} onChange={e => setProductForm({ ...productForm, gallery: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-brand-orange text-white py-4 rounded-xl font-black italic tracking-widest uppercase hover:bg-zinc-900 transition-colors shadow-lg active:scale-95">Guardar Producto</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Categoría */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-brand-dark p-6 rounded-3xl max-w-sm w-full relative border border-brand-orange/20 shadow-2xl">
                        <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-brand-orange transition-colors"><X size={24} /></button>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 dark:text-white">
                            {categoryForm.id ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h2>
                        <form onSubmit={handleSaveCategory} className="space-y-4">
                            {!categoryForm.id && (
                                <input placeholder="ID (ej. star-wars)" required className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white focus:border-brand-orange transition-all border border-transparent" value={categoryForm.id} onChange={e => setCategoryForm({ ...categoryForm, id: slugify(e.target.value) })} />
                            )}
                            <input placeholder="Nombre visible" required className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white focus:border-brand-orange transition-all border border-transparent" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                            <input placeholder="URL del Banner (opcional)" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none dark:text-white focus:border-brand-orange transition-all border border-transparent" value={categoryForm.banner_url} onChange={e => setCategoryForm({ ...categoryForm, banner_url: e.target.value })} />
                            
                            <button type="submit" className="w-full bg-brand-orange text-white py-4 rounded-xl font-black italic tracking-widest uppercase hover:bg-zinc-900 transition-colors shadow-lg active:scale-95">Guardar Categoría</button>
                            {categoryForm.id && categoryForm.banner_url && (
                                <button type="button" onClick={() => handleRemoveCategoryBanner()} className="w-full text-red-500 py-3 rounded-xl font-black italic tracking-widest uppercase hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-2 text-xs">Eliminar Banner</button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Productos de Categoría */}
            {isCategoryProductsOpen && selectedCategoryForProducts && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-brand-dark p-6 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col relative border border-brand-orange/20 shadow-2xl">
                        <button onClick={() => setIsCategoryProductsOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-brand-orange transition-colors"><X size={24} /></button>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 dark:text-white">
                            {selectedCategoryForProducts.name || selectedCategoryForProducts.id}
                        </h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Productos asociados a la categoría</p>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {(() => {
                                const cats = products.filter(p => p.categoryId === selectedCategoryForProducts.id);
                                if (cats.length === 0) return <p className="text-zinc-500 italic text-sm py-4">No hay productos en esta categoría.</p>;
                                return cats.map(p => (
                                    <div key={p.id} className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-2xl">
                                        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                                            {p.images && <img src={p.images} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase truncate">{p.title}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase">ID: {p.id}</span>
                                                <span className={`text-[10px] font-bold ${p.stock > 0 ? 'text-green-500' : 'text-red-500'} uppercase`}>Stock: {p.stock}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black italic text-brand-orange shrink-0">{formatPrice(p.price)}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DE CONFIRMACIÓN ESTÉTICO --- */}
            {confirmDelete.isOpen && (
                <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-zinc-950 border border-brand-orange/30 p-8 max-w-sm w-full shadow-2xl relative overflow-hidden rounded-3xl text-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50"></div>
                        <div className="bg-red-500/10 p-4 rounded-full mx-auto w-fit mb-4">
                            <TriangleAlert className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2 dark:text-white">¿Confirmar?</h3>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic mb-6">
                            {confirmDelete.type === 'orders' ? `Se eliminarán ${confirmDelete.ids?.length} órdenes permanentemente.` :
                             confirmDelete.type === 'order' ? `Se eliminará la ${confirmDelete.title} permanentemente.` :
                             `Estás a punto de eliminar "${confirmDelete.title}".`}
                        </p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setConfirmDelete({ isOpen: false, id: null, ids: null, title: '', type: '' })} className="flex-1 px-4 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase italic text-xs tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all rounded-xl">
                                Cancelar
                            </button>
                            <button onClick={executeDelete} className="flex-1 px-4 py-3 bg-red-500 text-white font-black uppercase italic text-xs tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95 rounded-xl">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
