import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, Calendar, Pencil, Check, X, MapPin, Smartphone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MiCuenta() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [editField, setEditField] = useState(null); 
    const [tempValue, setTempValue] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('vntg_user');
        if (!stored) return navigate('/login');
        
        const parsed = JSON.parse(stored);
        setUser(parsed);

        fetch(`${API_URL}/api/orders/${parsed.id}`)
            .then(res => res.json())
            .then(data => {
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [navigate]);

    const startEdit = (field, value) => {
        setEditField(field);
        setTempValue(value || '');
    };

    const cancelEdit = () => {
        setEditField(null);
        setTempValue('');
    };

    // ESTA ES LA FUNCIÓN QUE FALTABA PARA EL TICK VERDE
    const saveEdit = async (field) => {
        try {
            const updatedUser = { ...user, [field]: tempValue };
            
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id, 
                    field: field, 
                    value: tempValue 
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                // Actualizamos el storage para que el Checkout vea los cambios
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

    if (!user) return null;

    const DataRow = ({ label, field, value, icon: Icon }) => (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/5 group">
            <div className="flex items-center gap-4 flex-1">
                <div className="w-8 h-8 flex items-center justify-center text-brand-orange/50"><Icon size={18} /></div>
                <div className="flex-1">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{label}</p>
                    {editField === field ? (
                        <input 
                            autoFocus 
                            value={tempValue} 
                            onChange={(e) => setTempValue(e.target.value)} 
                            className="w-full bg-zinc-100 dark:bg-black text-sm font-bold border-b border-brand-orange outline-none py-1 dark:text-white" 
                        />
                    ) : (
                        <p className="text-sm font-bold dark:text-white italic uppercase">{value || 'No definido'}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
                {editField === field ? (
                    <>
                        <button onClick={() => saveEdit(field)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"><Check size={18}/></button>
                        <button onClick={cancelEdit} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><X size={18}/></button>
                    </>
                ) : (
                    <button onClick={() => startEdit(field, value)} className="p-2 text-zinc-400 group-hover:text-brand-orange transition-colors"><Pencil size={16}/></button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-zinc-50 dark:bg-brand-dark min-h-screen pt-32 pb-20 px-4 font-sans text-zinc-900 dark:text-white">
            <div className="max-w-[800px] mx-auto space-y-12">
                <section>
                    <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-3">
                        <User size={14} className="text-brand-orange" /> Perfil de Usuario
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 dark:bg-white/5 border border-zinc-200 dark:border-white/5 shadow-xl overflow-hidden rounded-xl">
                        <div className="p-4 bg-zinc-100 dark:bg-[#111] border-b border-zinc-200 dark:border-white/5">
                            <p className="text-[9px] font-black uppercase text-zinc-500">Nombre</p>
                            <p className="text-sm font-bold italic uppercase">{user.name}</p>
                        </div>
                        <div className="p-4 bg-zinc-100 dark:bg-[#111] border-b border-zinc-200 dark:border-white/5">
                            <p className="text-[9px] font-black uppercase text-zinc-500">Email</p>
                            <p className="text-sm font-bold italic">{user.email}</p>
                        </div>
                        <DataRow label="Dirección" field="address" value={user.address} icon={MapPin} />
                        <DataRow label="Ciudad" field="city" value={user.city} icon={MapPin} />
                        <DataRow label="Provincia" field="province" value={user.province} icon={MapPin} />
                        <DataRow label="Código Postal" field="zip_code" value={user.zip_code} icon={MapPin} />
                        <DataRow label="Teléfono" field="phone" value={user.phone} icon={Smartphone} />
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-3">
                        <Package size={14} className="text-brand-orange" /> Mis Compras
                    </h2>
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-24 bg-zinc-200 dark:bg-white/5 rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.length > 0 ? orders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-[#1a1a1a] p-6 border border-zinc-200 dark:border-white/5 rounded-xl flex justify-between items-center hover:border-brand-orange/30 transition-all">
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 mb-1">
                                            <Calendar size={12}/> {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                        <p className="font-bold italic uppercase text-sm">Orden #{order.id.slice(0,8)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black uppercase italic bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">Aprobado</span>
                                        <p className="text-xl font-black italic mt-1">${parseFloat(order.total).toLocaleString('es-AR')}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-white/5 text-zinc-500 font-bold italic text-sm">
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