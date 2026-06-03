import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Calendar, Pencil, Check, X, MapPin, Smartphone, ChevronRight, Plus, Star, Trash2, Heart, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MiCuenta() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]); 
    const { formatPrice } = useCurrency();
    const [categories, setCategories] = useState([]);
    const [interests, setInterests] = useState([]);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [editField, setEditField] = useState(null); 
    const [tempValue, setTempValue] = useState('');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(null);
    const { addToast } = useToast();

    const fetchAddresses = async (token) => {
        try {
            const res = await fetch(`${API_URL}/api/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error al cargar direcciones:", err);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('vntg_user');
        if (!stored) return navigate('/login');
        
        const parsed = JSON.parse(stored);
        const token = localStorage.getItem('vntg_token');
        setUser(parsed);

        fetchAddresses(token);

        fetch(`${API_URL}/api/orders/${parsed.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        fetch(`${API_URL}/api/categories`)
            .then(res => res.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(console.error);

        // Cargar intereses desde la DB (con fallback a localStorage)
        fetch(`${API_URL}/api/auth/interests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && Array.isArray(data)) {
                    setInterests(data);
                    localStorage.setItem('vntg_interests', JSON.stringify(data));
                } else {
                    const storedInterests = localStorage.getItem('vntg_interests');
                    if (storedInterests) {
                        try {
                            setInterests(JSON.parse(storedInterests));
                        } catch (e) {
                            console.error("Error parsing interests");
                        }
                    }
                }
            })
            .catch(() => {
                const storedInterests = localStorage.getItem('vntg_interests');
                if (storedInterests) {
                    try {
                        setInterests(JSON.parse(storedInterests));
                    } catch (e) {
                        console.error("Error parsing interests");
                    }
                }
            });
    }, [navigate]);

    const startEdit = (field, value) => {
        setEditField(field);
        setTempValue(value || '');
    };

    const cancelEdit = () => {
        setEditField(null);
        setTempValue('');
    };

    const saveEdit = async (field) => {
        try {
            const updatedUser = { ...user, [field]: tempValue };
            
            const token = localStorage.getItem('vntg_token');
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    userId: user.id, 
                    field: field, 
                    value: tempValue 
                })
            });
            
            if (res.ok) {
                localStorage.setItem('vntg_user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setEditField(null);
                addToast(null, 'Perfil actualizado correctamente');
            } else {
                addToast(null, "Error al actualizar los datos", "error");
            }
        } catch (err) {
            console.error("Error:", err);
            addToast(null, "Error de red al actualizar", "error");
        }
    };

    const toggleInterest = (catId) => {
        const strId = String(catId);
        const newInterests = interests.includes(strId)
            ? interests.filter(id => id !== strId)
            : [...interests, strId];

        setInterests(newInterests);
        localStorage.setItem('vntg_interests', JSON.stringify(newInterests));

        const token = localStorage.getItem('vntg_token');
        fetch(`${API_URL}/api/auth/interests`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ categoryIds: newInterests })
        }).catch(err => console.error("Error al guardar intereses en DB:", err));
    };

    const token = localStorage.getItem('vntg_token');

    const handleAddAddress = () => {
        setCurrentAddress({ id: 'new', tag: '', address: '', city: '', province: '', zip_code: '', phone: '' });
        setIsEditingAddress(true);
    };

    const handleEditAddress = (address) => {
        setCurrentAddress({ ...address });
        setIsEditingAddress(true);
    };

    const handleSaveAddress = async () => {
        const body = {
            tag: currentAddress.tag,
            address: currentAddress.address,
            city: currentAddress.city,
            province: currentAddress.province,
            zip_code: currentAddress.zip_code,
            phone: currentAddress.phone
        };

        try {
            if (currentAddress.id && currentAddress.id !== 'new') {
                const res = await fetch(`${API_URL}/api/addresses/${currentAddress.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body)
                });
                if (!res.ok) throw new Error('Error al actualizar');
                addToast(null, 'Dirección editada correctamente');
            } else {
                const res = await fetch(`${API_URL}/api/addresses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body)
                });
                if (!res.ok) throw new Error('Error al crear');
                addToast(null, 'Dirección agregada correctamente');
            }
            await fetchAddresses(token);
            setIsEditingAddress(false);
            setCurrentAddress(null);
        } catch (err) {
            console.error("Error al guardar dirección:", err);
            addToast(null, 'Error al guardar la dirección', 'error');
        }
    };

    const handleSetDefaultAddress = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/addresses/${id}/default`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                await fetchAddresses(token);
                addToast(null, 'Dirección predeterminada actualizada');
            } else {
                addToast(null, data.error || 'Error al establecer como predeterminada', 'error');
            }
        } catch (err) {
            console.error("Error al establecer default:", err);
            addToast(null, 'Error de conexión al establecer predeterminada', 'error');
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('¿Seguro que quieres eliminar esta dirección?')) return;
        try {
            const res = await fetch(`${API_URL}/api/addresses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchAddresses(token);
                addToast(null, 'Dirección eliminada');
            } else {
                addToast(null, 'Error al eliminar la dirección', 'error');
            }
        } catch (err) {
            console.error("Error al eliminar dirección:", err);
            addToast(null, 'Error de conexión al eliminar', 'error');
        }
    };

    if (!user) return null;

    const UserDataField = ({ label, field, value }) => (
         <div className="p-4 bg-zinc-100 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center group">
            <div>
                <p className="text-[9px] font-black uppercase text-zinc-500">{label}</p>
                 {editField === field ? (
                    <input autoFocus value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="w-full bg-transparent text-sm font-bold border-b border-brand-orange outline-none py-1 dark:text-white" />
                ) : (
                    <p className="text-sm font-bold italic">{value}</p>
                )}
            </div>
             <div className="flex items-center gap-2">
                {editField === field ? (
                    <>
                        <button onClick={() => saveEdit(field)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg"><Check size={16}/></button>
                        <button onClick={cancelEdit} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><X size={16}/></button>
                    </>
                ) : (
                    <button onClick={() => startEdit(field, value)} className="p-2 text-zinc-400 group-hover:text-brand-orange opacity-0 group-hover:opacity-100 transition-all"><Pencil size={14}/></button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-zinc-50 dark:bg-brand-dark min-h-screen pt-32 pb-20 px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[800px] mx-auto space-y-12">
                
                {/* SECCIÓN DATOS DE USUARIO */}
                <section>
                    <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-3">
                        <User size={14} className="text-brand-orange" /> Perfil de Usuario
                    </h2>
                    <div className="grid grid-cols-1 gap-px bg-zinc-50 dark:bg-brand-card shadow-lg overflow-hidden rounded-2xl">
                        <UserDataField label="Nombre" field="name" value={user.name} />
                        <UserDataField label="Email" field="email" value={user.email} />
                        <UserDataField label="DNI" field="dni" value={user.dni || ''} />
                        
                        {/* TARJETA VISIBLE DE PUNTOS ACUMULADOS */}
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black uppercase text-brand-orange tracking-wider flex items-center gap-2">
                                    Mis Puntos VNTG
                                    <Link to="/puntos" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-brand-orange hover:text-white transition-all" title="Cómo funcionan los puntos">
                                        <Info size={10} strokeWidth={3} />
                                    </Link>
                                </p>
                                <p className="text-2xl font-black italic text-zinc-900 dark:text-white mt-1">
                                    {(user.points || 0).toLocaleString('es-AR')} <span className="text-sm text-zinc-500">PTS</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="bg-brand-orange/10 text-brand-orange text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-brand-orange/20">
                                    Beneficio Activo
                                </span>
                                <p className="text-[9px] text-zinc-400 mt-1.5 italic font-medium">1 PTS = {formatPrice(10)} de descuento</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* NUEVA SECCIÓN LIBRETA DE DIRECCIONES */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                            <MapPin size={14} className="text-brand-orange" /> Mis Direcciones
                        </h2>
                        <button onClick={handleAddAddress} className="flex items-center gap-2 text-[10px] font-black uppercase italic text-brand-orange hover:text-white transition-colors">
                            <Plus size={14} /> Nueva Dirección
                        </button>
                    </div>

                    {isEditingAddress ? (
                        <div className="bg-white dark:bg-brand-card p-6 rounded-2xl border border-brand-orange shadow-lg">
                            <h3 className="text-sm font-black italic uppercase mb-4">{currentAddress.id === 'new' ? 'Nueva Dirección' : 'Editar Dirección'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Etiqueta (Ej. Casa, Trabajo)</label>
                                    <input value={currentAddress.tag} onChange={e => setCurrentAddress({...currentAddress, tag: e.target.value})} className="w-full bg-zinc-100 dark:bg-black p-2 rounded text-sm dark:text-white border border-zinc-200 dark:border-zinc-800" placeholder="Mi Casa" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Calle y Número</label>
                                    <input value={currentAddress.address} onChange={e => setCurrentAddress({...currentAddress, address: e.target.value})} className="w-full bg-zinc-100 dark:bg-black p-2 rounded text-sm dark:text-white border border-zinc-200 dark:border-zinc-800" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Ciudad</label>
                                    <input value={currentAddress.city} onChange={e => setCurrentAddress({...currentAddress, city: e.target.value})} className="w-full bg-zinc-100 dark:bg-black p-2 rounded text-sm dark:text-white border border-zinc-200 dark:border-zinc-800" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Provincia</label>
                                    <input value={currentAddress.province} onChange={e => setCurrentAddress({...currentAddress, province: e.target.value})} className="w-full bg-zinc-100 dark:bg-black p-2 rounded text-sm dark:text-white border border-zinc-200 dark:border-zinc-800" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Código Postal</label>
                                    <input value={currentAddress.zip_code} onChange={e => setCurrentAddress({...currentAddress, zip_code: e.target.value.replace(/\D/g, '')})} className="w-full bg-zinc-100 dark:bg-black p-2 rounded text-sm dark:text-white border border-zinc-200 dark:border-zinc-800" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Teléfono</label>
                                    <input value={currentAddress.phone} onChange={e => setCurrentAddress({...currentAddress, phone: e.target.value.replace(/\D/g, '')})} className="w-full bg-zinc-100 dark:bg-black p-2 rounded text-sm dark:text-white border border-zinc-200 dark:border-zinc-800" />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button onClick={handleSaveAddress} className="bg-brand-orange text-white px-6 py-2 rounded text-xs font-black uppercase italic hover:bg-orange-600 transition-colors">Guardar Dirección</button>
                                <button onClick={() => setIsEditingAddress(false)} className="text-zinc-500 hover:text-white text-xs font-black uppercase italic transition-colors">Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.length > 0 ? addresses.map((addr) => (
                                <div key={addr.id} className={`p-6 rounded-2xl border transition-all ${addr.is_default ? 'bg-brand-orange/5 border-brand-orange' : 'bg-white dark:bg-brand-card border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black italic uppercase">{addr.tag || 'Dirección'}</h3>
                                            {addr.is_default ? <span className="bg-brand-orange text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Default</span> : null}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditAddress(addr)} className="text-zinc-400 hover:text-brand-orange"><Pencil size={14}/></button>
                                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 mb-4">
                                        <p>{addr.address}</p>
                                        <p>{addr.city}, {addr.province} - {addr.zip_code}</p>
                                        <p className="flex items-center gap-1 mt-2"><Smartphone size={12}/> {addr.phone}</p>
                                    </div>
                                    {!addr.is_default && (
                                        <button onClick={() => handleSetDefaultAddress(addr.id)} className="text-[10px] font-black uppercase italic text-zinc-500 hover:text-brand-orange flex items-center gap-1 transition-colors">
                                            <Star size={12}/> Establecer como predeterminada
                                        </button>
                                    )}
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-600 rounded-2xl text-zinc-500 font-bold italic text-sm">
                                    No tienes direcciones guardadas.
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* SECCIÓN INTERESES */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                            <Heart size={14} className="text-brand-orange" /> Mis Intereses
                        </h2>
                    </div>
                    <div className="bg-zinc-50 dark:bg-brand-card rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl relative overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-brand-orange via-orange-400 to-brand-orange"></div>
                        <div className="p-8">
                        <div className="mb-8">
                            <h3 className="text-lg font-black italic uppercase text-zinc-900 dark:text-white mb-2">Personaliza tu Experiencia</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Selecciona las franquicias y categorías que más te apasionan. Usaremos esta información para curar una selección de piezas exclusivas para ti.</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {categories.length > 0 ? (
                                <>
                                    {(showAllCategories ? categories : categories.slice(0, 6)).map(cat => {
                                        const isSelected = interests.includes(String(cat.id));
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => toggleInterest(cat.id)}
                                                className={`px-5 py-3 rounded-2xl text-xs font-black italic uppercase tracking-tight border-2 transition-all duration-200 active:scale-95 ${
                                                    isSelected
                                                        ? 'bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20'
                                                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-brand-orange/50 hover:text-brand-orange'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {cat.name}
                                                    {isSelected && <Check size={14} className="stroke-[3]" />}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {categories.length > 6 && (
                                        <button
                                            onClick={() => setShowAllCategories(!showAllCategories)}
                                            className="px-5 py-3 rounded-2xl text-xs font-black italic uppercase tracking-tight border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:border-brand-orange hover:text-brand-orange transition-all duration-200"
                                        >
                                            {showAllCategories ? 'Ver menos' : `+${categories.length - 6} más`}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm italic text-zinc-400">Cargando categorías...</p>
                            )}
                        </div>

                        {interests.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">SELECCIONADOS</p>
                                <div className="flex flex-wrap gap-2">
                                    {interests.map(id => {
                                        const cat = categories.find(c => String(c.id) === id);
                                        if (!cat) return null;
                                        return (
                                            <div key={id} className="bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-4 py-2 rounded-full text-[10px] font-black uppercase italic flex items-center gap-2 shadow-lg">
                                                {cat.name}
                                                <button onClick={() => toggleInterest(id)} className="text-zinc-400 hover:text-red-500 transition-colors"><X size={12} /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </section>

                {/* SECCIÓN MIS COMPRAS */}
                <section>
                    <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-3">
                        <Package size={14} className="text-brand-orange" /> Mis Compras
                    </h2>
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.length > 0 ? orders.map(order => (
                                <Link 
                                    to={`/pedido/${order.id}`} 
                                    key={order.id} 
                                    className="bg-white dark:bg-brand-card p-6 max-[360px]:p-4 rounded-2xl flex max-[360px]:flex-col justify-between items-start max-[360px]:items-start hover:border-brand-orange/50 transition-all cursor-pointer group shadow-sm border border-transparent dark:hover:border-zinc-700"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 mb-1">
                                            <Calendar size={12}/> {new Date(order.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })} (Hora ARG)
                                        </div>
                                        <p className="font-bold italic uppercase text-sm group-hover:text-brand-orange transition-colors">Orden #{order.id.slice(0,8)}</p>
                                    </div>
                                    <div className="flex items-center gap-6 max-[360px]:w-full max-[360px]:justify-between max-[360px]:mt-2">
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black uppercase italic px-3 py-1 rounded-full ${
                                                order.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                order.status === 'preparing' ? 'bg-brand-orange/10 text-brand-orange' :
                                                order.status === 'ready' ? 'bg-cyan-500/10 text-cyan-500' :
                                                order.status === 'shipped' ? 'bg-blue-500/10 text-blue-500' :
                                                order.status === 'delivered' ? 'bg-purple-500/10 text-purple-500' :
                                                'bg-zinc-500/10 text-zinc-500'
                                            }`}>
                                                {order.status === 'approved' ? 'Aprobado' : order.status === 'preparing' ? 'En Preparación' : order.status === 'ready' ? 'Listo para Retirar' : order.status === 'shipped' ? 'Enviado' : order.status === 'delivered' ? 'Entregado' : 'Pendiente'}
                                            </span>
                                            <p className="text-xl max-[360px]:text-base font-black italic mt-1">{formatPrice(order.total)}</p>
                                        </div>
                                        <ChevronRight className="text-zinc-300 dark:text-zinc-600 group-hover:text-brand-orange group-hover:translate-x-1 transition-all max-[360px]:hidden" />
                                    </div>
                                </Link>
                            )) : (
                                <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-600 rounded-2xl text-zinc-500 font-bold italic text-sm">
                                    Aún no has realizado ninguna compra con éxito.
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}