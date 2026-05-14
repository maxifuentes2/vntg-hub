import { createContext, useState, useContext } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (product, message, type = 'success') => {
        const id = Date.now() + Math.random(); 
        setToasts((prev) => [...prev, { id, product, message, type, isExiting: false }]);
        setTimeout(() => setToasts((prev) => prev.map(t => t.id === id ? { ...t, isExiting: true } : t)), 3500);
        setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3900);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
        setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 400); 
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            
            {/* Renderizado de los Toasts (Copiado de tu CartContext original) */}
            <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-4 items-end pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`pointer-events-auto bg-zinc-950 text-white border border-white/10 shadow-2xl flex items-center w-[340px] h-[85px] transition-all duration-500 ${toast.isExiting ? 'toast-exit' : 'toast-enter'}`}>
                        {toast.product && <div className="w-[85px] h-[85px] shrink-0 bg-zinc-800 border-r border-white/5"><img src={toast.product.images} className="w-full h-full object-cover opacity-80" alt="" /></div>}
                        <div className="flex-1 px-4 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {toast.type === 'error' ? <AlertCircle size={12} className="text-red-500" /> : <CheckCircle size={12} className="text-emerald-500" />}
                                <span className="text-[8px] font-black uppercase tracking-widest">{toast.type === 'error' ? 'Error' : 'Éxito'}</span>
                            </div>
                            <p className="text-[11px] font-black uppercase italic truncate">{toast.product?.title}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="h-full px-4 text-zinc-600 hover:text-white transition-colors border-l border-white/5"><X size={16} /></button>
                        <div className={`absolute bottom-0 left-0 h-[2px] animate-progress ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    </div>
                ))}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.toast-enter { animation: slideInRight 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; } .toast-exit { animation: fadeOutRight 0.4s ease-in forwards; } .animate-progress { animation: progress 3.5s linear forwards; } @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes fadeOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } } @keyframes progress { from { width: 100%; } to { width: 0%; } }` }} />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);