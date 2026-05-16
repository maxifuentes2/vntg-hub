import React from 'react';

export default function WhatsAppButton({ isSidebarOpen }) {
    const phoneNumber = "5492617100686";
    const message = "Hola! Vengo desde el Hub y necesito asistencia.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 left-3 sm:left-6 transition-all duration-500 z-[90] flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-2xl active:scale-90 backdrop-blur-3xl border border-white/20 bg-[#25D366]/40 hover:bg-[#25D366]/80 hover:scale-110 group"
        >
            <svg 
                viewBox="0 0 24 24" 
                className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-current transition-transform group-hover:scale-110"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.411 0 .01 5.403.007 12.04c0 2.123.543 4.197 1.57 6.068l-1.67 6.095 6.236-1.636a11.79 11.79 0 005.904 1.564h.005c6.637 0 12.039-5.404 12.042-12.041a11.8 11.8 0 00-3.535-8.529z"/>
            </svg>
        </a>
    );
}
