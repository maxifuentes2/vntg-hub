import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Calendar, Pencil, Check, X, MapPin, Smartphone, ChevronRight, Plus, Star, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MiCuenta() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    // --- NUEVO ESTADO PARA DIRECCIONES ---
    const [addresses, setAddresses] = useState([]); 
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [editField, setEditField] = useState(null); 
    const [tempValue, setTempValue] = useState('');
    // --- ESTADOS PARA GESTIÓN DE DIRECCIONES ---
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('vntg_user');
        if (!stored) return navigate('/login');
        
        const parsed = JSON.parse(stored);
        const token = localStorage.getItem('vntg_token');
        setUser(parsed);

        // --- SIMULACIÓN DE DATOS (MOCK) PARA EL FRONT-END ---
        // Hasta que el backend se actualice, simulamos que el usuario tiene direcciones
        // usando los datos antiguos, o creando un array de prueba.
        const mockAddresses = [
             {
                 id: '1',
                 tag: 'Mi Casa',
                 isDefault: true,
                 address: parsed.address || 'Calle Falsa 123',
                 city: parsed.city || 'Springfield',
                 province: parsed.province || 'Mendoza',
                 zip_code: parsed.zip_code || '5500',
                 phone: parsed.phone || '2615555555'
             }
         ];
        setAddresses(mockAddresses);
        // ----------------------------------------------------

        fetch(`${API_URL}/api/orders/${parsed.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [navigate]);

    // ... (Mantén las funciones startEdit, cancelEdit y saveEdit para Nombre y Email) ...
     const startEdit = (field, value) => {
        setEditField(field);
        setTempValue(value || '');
    };

    const cancelEdit = () => {
        setEditField(null);
        setTempValue('');
    };

    const saveEdit = async (field) => {
        // ... (Tu lógica original para guardar cambios en el usuario) ...
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
                //const data = await res.json();
                localStorage.setItem('vntg_user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setEditField(null);
            } else {
                alert("Error al actualizar los datos");
            }
        } catch (err) {
            console.error("Error:", err);
        }
    };


    // --- NUEVAS FUNCIONES PARA DIRECCIONES (SIMULADAS EN FRONT-END POR AHORA) ---
    const handleAddAddress = () => {
        setCurrentAddress({ id: Date.now().toString(), tag: '', address: '', city: '', province: '', zip_code: '', phone: '', isDefault: addresses.length === 0 });
        setIsEditingAddress(true);
    };

    const handleEditAddress = (address) => {
        setCurrentAddress({ ...address });
        setIsEditingAddress(true);
    };

    const handleSaveAddress = () => {
        if (addresses.some(a => a.id === currentAddress.id)) {
            // Actualizar existente
            setAddresses(addresses.map(a => a.id === currentAddress.id ? currentAddress : a));
        } else {
            // Agregar nueva
            setAddresses([...addresses, currentAddress]);
        }
        setIsEditingAddress(false);
        setCurrentAddress(null);
        // TODO: Aquí enviarías la nueva lista de direcciones al Back-end
    };

    const handleSetDefaultAddress = (id) => {
        setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
        // TODO: Notificar al Back-end del cambio de default
    };

    const handleDeleteAddress = (id) => {
        if(window.confirm('¿Seguro que quieres eliminar esta dirección?')){
             setAddresses(addresses.filter(a => a.id !== id));
             // TODO: Notificar al Back-end
        }
    };
    // -----------------------------------------------------------------------------

    if (!user) return null;

    // Componente interno simplificado para no repetir código
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-50 dark:bg-brand-card shadow-lg overflow-hidden rounded-2xl">
                        <UserDataField label="Nombre" field="name" value={user.name} />
                        <UserDataField label="Email" field="email" value={user.email} />
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
                            <h3 className="text-sm font-black italic uppercase mb-4">{currentAddress.id.length > 5 ? 'Nueva Dirección' : 'Editar Dirección'}</h3>
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
                                    <input value={currentAddress.zip_code} onChange={e => setCurrentAddress({...currentAddress, zip_code: e.target.value})} className="w-full bg-zinc-100 dark:bg-black p-2 rounded text-sm dark:text-white border border-zinc-200 dark:border-zinc-800" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Teléfono</label>
                                    <input value={currentAddress.phone} onChange={e => setCurrentAddress({...currentAddress, phone: e.target.value})} className="w-full bg-zinc-100 dark:bg-black p-2 rounded text-sm dark:text-white border border-zinc-200 dark:border-zinc-800" />
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
                                <div key={addr.id} className={`p-6 rounded-2xl border transition-all ${addr.isDefault ? 'bg-brand-orange/5 border-brand-orange' : 'bg-white dark:bg-brand-card border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black italic uppercase">{addr.tag || 'Dirección'}</h3>
                                            {addr.isDefault && <span className="bg-brand-orange text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Default</span>}
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
                                    {!addr.isDefault && (
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

                {/* SECCIÓN MIS COMPRAS (Mantenida igual) */}
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
                                    className="bg-white dark:bg-brand-card p-6 rounded-2xl flex justify-between items-center hover:border-brand-orange/50 transition-all cursor-pointer group shadow-sm border border-transparent dark:hover:border-zinc-700"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 mb-1">
                                            <Calendar size={12}/> {new Date(order.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })} (Hora ARG)
                                        </div>
                                        <p className="font-bold italic uppercase text-sm group-hover:text-brand-orange transition-colors">Orden #{order.id.slice(0,8)}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
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
                                            <p className="text-xl font-black italic mt-1">${parseFloat(order.total).toLocaleString('es-AR')}</p>
                                        </div>
                                        <ChevronRight className="text-zinc-300 dark:text-zinc-600 group-hover:text-brand-orange group-hover:translate-x-1 transition-all" />
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