import { useState, useEffect } from 'react';
import { X, Tag, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CategorySidebar({ isOpen, onClose }) {
    const [dbCategories, setDbCategories] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/categories')
            .then(res => res.json())
            .then(data => setDbCategories(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error cargando categorías:", err));
    }, []);

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-brand-dark z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-zinc-800">
                    <span className="font-black dark:text-white text-xl">VNTG <span className="text-brand-orange">MENU</span></span>
                    <button onClick={onClose} className="dark:text-white"><X size={24} /></button>
                </div>

                <nav className="p-4 space-y-1">
                    {dbCategories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/categorias/${cat.id}`}
                            onClick={onClose}
                            className="flex items-center justify-between p-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-brand-blue"><Tag size={20} /></span>
                                <span className="font-bold">{cat.name}</span>
                            </div>
                            <ChevronRight size={16} />
                        </Link>
                    ))}
                </nav>
            </aside>
        </>
    );
}