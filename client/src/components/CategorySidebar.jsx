// IMPORTACIONES
import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, Tag, ChevronRight, LayoutGrid, CarFront, Film, 
    BookOpen, Bot, Gamepad2, Package, Mail, MapPin, Info, ShieldCheck, Truck, ChevronDown, Trophy, House, Star,
    Palette, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import SidebarWrapper from './SidebarWrapper';
import { slugify } from '../utils/slugify';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getCategoryIcon = (categoryName) => {
    if (!categoryName) return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>;
    
    const name = categoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (name.includes('auto') || name.includes('vehiculo')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
        </svg>
    );
    
    if (name.includes('pelicula') || name.includes('cine')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
            <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/>
            <line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/>
            <line x1="17" y1="7" x2="22" y2="7"/>
        </svg>
    );
    
    if (name.includes('comic') || name.includes('manga')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
    );

    if (name.includes('figura') || name.includes('funko')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="12" rx="2"/>
            <path d="M12 2v4"/><path d="M8 2h8"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
        </svg>
    );
    
    if (name.includes('juego') || name.includes('gamer')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
            <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
            <rect x="2" y="6" width="20" height="12" rx="2"/>
        </svg>
    );

    if (name.includes('caja') || name.includes('sellado')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
    );
    
    if (name.includes('futbol') || name.includes('deporte')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 12l3-3"/><path d="M12 12l-3-3"/><path d="M12 12v4"/>
        </svg>
    );

    if (name.includes('arte')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.16-.62-1.57A1.55 1.55 0 0 1 14.3 17H17c3.31 0 6-2.69 6-6 0-4.97-4.93-9-11-9z"/>
            <circle cx="6.5" cy="10.5" r="1.5"/><circle cx="10.5" cy="5.5" r="1.5"/><circle cx="15.5" cy="6.5" r="1.5"/>
        </svg>
    );
    
    if (name.includes('carta')) return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="14" height="18" rx="2" ry="2"/>
            <path d="M18 7v14H6"/>
            <path d="M22 11v10h-4"/>
        </svg>
    );

    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
    );
};

export default function CategorySidebar({ categories = [] }) { 
    const { isCategoryOpen, closeAll } = useSidebar();
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [expandedCat, setExpandedCat] = useState(null);
    const [categoryFranchises, setCategoryFranchises] = useState({});

    const fetchFranchises = useCallback(async (catId) => {
        if (categoryFranchises[catId]) return;
        try {
            const res = await fetch(`${API_URL}/api/products?categoryId=${catId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                const franchises = [...new Set(data.map(p => p.franchise).filter(f => f))];
                setCategoryFranchises(prev => ({ ...prev, [catId]: franchises }));
            }
        } catch (err) {
            console.error('Error fetching franchises:', err);
        }
    }, [categoryFranchises]);

    const toggleCategory = (catId) => {
        if (expandedCat === catId) {
            setExpandedCat(null);
        } else {
            setExpandedCat(catId);
            fetchFranchises(catId);
        }
    };

    // Resetear el estado cuando se cierra la sidebar
    useEffect(() => {
        if (!isCategoryOpen) {
            const timer = setTimeout(() => setShowAllCategories(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isCategoryOpen]);

    // Definimos qué categorías mostrar
    const visibleCategories = showAllCategories ? categories : categories.slice(0, 3);
    const hasMoreCategories = categories.length > 3;

    return (
        <SidebarWrapper 
            isOpen={isCategoryOpen} 
            onClose={closeAll} 
            title="Categorías" 
            side="left"
        >
            <style>
                {`
                @keyframes revealItem {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-reveal {
                    animation: revealItem 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                `}
            </style>
            <div className="flex flex-col h-full">
                {/* LISTADO DE CATEGORÍAS */}
                <div className="space-y-2 flex-1">
                    <Link
                        to="/"
                        onClick={closeAll}
                        className="flex items-center gap-3 px-4 py-3 bg-brand-orange/10 text-brand-orange font-black text-[11px] uppercase italic hover:bg-brand-orange hover:text-white transition-all rounded-xl mb-4"
                    >
                        <House size={16} /> Volver al inicio
                    </Link>
                    {categories.length > 0 ? (
                        <>
                            {visibleCategories.map((cat, index) => {
                                // Aplicamos animación solo a las categorías que aparecen después de presionar el botón
                                const isNew = showAllCategories && index >= 3;
                                return (
                                    <div 
                                        key={cat.id} 
                                        className={isNew ? 'animate-reveal opacity-0' : ''}
                                        style={isNew ? { animationDelay: `${(index - 3) * 60}ms` } : {}}
                                    >
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl shadow-sm mb-2 overflow-hidden">
                                            <div className="flex items-center">
                                                    <Link
                                                        to={`/categoria/${cat.slug || slugify(cat.name)}`}
                                                        onClick={closeAll}
                                                        className="flex items-center gap-3 xs:gap-4 flex-1 px-3 xs:px-4 py-3 xs:py-4 dark:text-white group"
                                                    >
                                                    <div className="text-brand-blue group-hover:text-brand-orange transition-colors">
                                                        {getCategoryIcon(cat.name)}
                                                    </div>
                                                    <span className="text-sm font-black uppercase italic tracking-tight group-hover:text-brand-orange transition-colors">{cat.name}</span>
                                                </Link>
                                                <button
                                                    onClick={() => toggleCategory(cat.id)}
                                                    className={`p-4 text-zinc-300 hover:text-brand-orange transition-all shrink-0 ${expandedCat === cat.id ? 'rotate-90' : ''}`}
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                            {expandedCat === cat.id && categoryFranchises[cat.id] && (
                                                <div className="px-4 pb-3 space-y-1 overflow-hidden animate-reveal" style={{ animationDelay: '0ms' }}>
                                                    {categoryFranchises[cat.id].length > 0 ? (
                                                        categoryFranchises[cat.id].map((f, fi) => (
                                                            <Link
                                                                key={f}
                                                                to={`/categoria/${cat.slug || slugify(cat.name)}?franquicia=${encodeURIComponent(f)}`}
                                                                onClick={closeAll}
                                                                className="block px-4 py-2 text-[10px] font-bold uppercase italic text-zinc-500 hover:text-brand-orange hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-lg transition-all opacity-0 animate-reveal"
                                                                style={{ animationDelay: `${fi * 60}ms` }}
                                                            >
                                                                {f}
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        <p className="px-4 py-2 text-[10px] italic text-zinc-400">Sin franquicias</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Botón para mostrar el resto si hay más de 3 y no están mostradas */}
                            {hasMoreCategories && !showAllCategories && (
                                <button 
                                    onClick={() => setShowAllCategories(true)}
                                    className="flex items-center justify-between group w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800/50  hover:border-brand-orange dark:hover:border-brand-orange transition-all rounded-xl shadow-sm mb-4"
                                >
                                    <span className="text-sm font-black uppercase italic tracking-tight dark:text-white group-hover:text-brand-orange transition-colors">Mostrar todas las categorías</span>
                                    <ChevronDown size={16} className="text-zinc-300 group-hover:text-brand-orange group-hover:translate-y-1 transition-all" />
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <p className="text-xs text-zinc-500 italic uppercase font-bold">Sin categorías disponibles</p>
                        </div>
                    )}

                    <Link
                        to="/categoria/all"
                        onClick={closeAll}
                        className="flex items-center gap-3 px-4 py-4 bg-brand-blue/5 text-brand-blue font-black text-[11px] uppercase italic hover:bg-brand-blue hover:text-white transition-all rounded-xl mb-8"
                    >
                        <LayoutGrid size={16} /> Ver todo el catálogo
                    </Link>

                    {/* SECCIÓN ADICIONAL (INFO DEL FOOTER) */}
                    <div className="space-y-8 pt-8 border-t dark:border-zinc-700 pb-10">
                        {/* Enlaces Útiles */}
                        <div>
                            <h3 className="text-brand-orange font-black uppercase italic tracking-widest text-[9px] mb-4 flex items-center gap-2">
                                <Info size={12} /> Información útil
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                <Link to="/guia-autenticidad" onClick={closeAll} className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase italic text-zinc-600 dark:text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 transition-all border border-transparent hover:border-brand-orange/20">
                                    <ShieldCheck size={14} className="text-brand-orange" /> Guía de Autenticidad
                                </Link>
                                <Link to="/envios" onClick={closeAll} className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase italic text-zinc-600 dark:text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 transition-all border border-transparent hover:border-brand-orange/20">
                                    <Truck size={14} className="text-brand-orange" /> Envíos Seguros
                                </Link>
                                <Link to="/tutoriales" onClick={closeAll} className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase italic text-zinc-600 dark:text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 transition-all border border-transparent hover:border-brand-orange/20">
                                    <BookOpen size={14} className="text-brand-orange" /> Tutoriales
                                </Link>
                                <Link to="/puntos" onClick={closeAll} className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase italic text-zinc-600 dark:text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 transition-all border border-transparent hover:border-brand-orange/20">
                                    <Star size={14} className="text-brand-orange" /> Puntos VNTG
                                </Link>
                                <Link to="/contacto" onClick={closeAll} className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase italic text-zinc-600 dark:text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 transition-all border border-transparent hover:border-brand-orange/20">
                                    <Mail size={14} className="text-brand-orange" /> Contacto
                                </Link>
                            </div>
                        </div>

                        {/* Contacto y Redes */}
                        <div>
                            <h3 className="text-brand-blue font-black uppercase italic tracking-widest text-[9px] mb-4">Ubicación y Contacto</h3>
                            <div className="px-4 space-y-3">
                                <p className="flex items-center gap-2 text-[10px] font-bold italic text-zinc-500 uppercase">
                                    <MapPin size={12} className="text-brand-blue" /> Mendoza, Argentina
                                </p>
                                <p className="flex items-center gap-2 text-[10px] font-bold italic text-zinc-500 lowercase">
                                    <Mail size={12} className="text-brand-blue" /> hubvntg@gmail.com
                                </p>
                            </div>

                            <div className="flex gap-3 px-4 mt-6">
                                <a href="https://www.instagram.com/gaspo0.0" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-brand-orange hover:text-white transition-all rounded-xl ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                                    </svg>
                                </a>
                                <a href="https://x.com/LoboLocura33" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-brand-blue hover:text-white transition-all rounded-xl ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                                    </svg>
                                </a>
                                <a href="https://wa.me/5492611234567" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-green-500 hover:text-white transition-all rounded-xl ">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.411 0 .01 5.403.007 12.04c0 2.123.543 4.197 1.57 6.068l-1.67 6.095 6.236-1.636a11.79 11.79 0 005.904 1.564h.005c6.637 0 12.039-5.404 12.042-12.041a11.8 11.8 0 00-3.535-8.529z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarWrapper>
    );
}