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
                    <div key={toast.id} className={`pointer-events-auto liquid-glass rounded-2xl overflow-hidden flex items-center w-[90vw] sm:w-[340px] h-[85px] transition-all duration-500 ${toast.isExiting ? 'toast-exit' : 'toast-enter'}`}>
                        {toast.product && (
                            <div className="w-[85px] h-[85px] shrink-0 bg-white/5 border-r border-white/10">
                                <img src={toast.product.images} className="w-full h-full object-cover opacity-90" alt="" />
                            </div>
                        )}
                        <div className="flex-1 px-5 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {toast.type === 'error' ? (
                                    <AlertCircle size={14} className="text-red-500" />
                                ) : (
                                    <CheckCircle size={14} className="text-orange-500" />
                                )}
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{toast.type === 'error' ? 'Error' : 'Éxito'}</span>
                            </div>
                            <p className="text-[12px] font-black uppercase italic truncate text-white leading-none mb-0.5">{toast.product?.title || 'Notificación'}</p>
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-tight">{toast.message}</p>
                        </div>
                        <button 
                            onClick={() => removeToast(toast.id)} 
                            className="h-full px-5 text-white/20 hover:text-white transition-colors border-l border-white/10 group"
                        >
                            <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                        <div className={`absolute bottom-0 left-0 h-[3px] animate-progress ${toast.type === 'error' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`} />
                    </div>
                ))}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .toast-enter { animation: slideInRight 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; } 
                .toast-exit { animation: fadeOutRight 0.4s ease-in forwards; } 
                .animate-progress { animation: progress 3.5s linear forwards; } 
                @keyframes slideInRight { 
                    from { transform: translateX(100%) scale(0.9); opacity: 0; } 
                    to { transform: translateX(0) scale(1); opacity: 1; } 
                } 
                @keyframes fadeOutRight { 
                    from { transform: translateX(0) scale(1); opacity: 1; } 
                    to { transform: translateX(120%) scale(0.9); opacity: 0; } 
                } 
                @keyframes progress { from { width: 100%; } to { width: 0%; } }
            ` }} />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);