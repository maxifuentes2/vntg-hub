import React from 'react';
import { PlayCircle, Info } from 'lucide-react';

// MOCK DATA: Aquí puedes ir agregando los videos que subas a Cloudinary o Google Drive
const tutoriales = [
  {
    id: 1,
    title: "Cómo utilizar el Chat Bot",
    description: "Aprende paso a paso cómo utilizar el chat bot para encontrar lo que buscas.",
    // Ejemplo de un video MP4 directo (como Cloudinary)
    videoUrl: "https://res.cloudinary.com/dhg3jbifk/video/upload/v1780415226/CHATBOT_VNTG_nfduei.mp4", 
    type: "video" // puede ser 'video' para Cloudinary/directo o 'iframe' para Drive/YouTube
  },
  {
    id: 2,
    title: "Cómo utlizar los Filtros de busqueda",
    description: "Te mostramos en detalle cómo utilizar los filtros para encontrar lo que buscas.",
    // Ejemplo de iframe (como Google Drive)
    // videoUrl: "https://drive.google.com/file/d/ID_DEL_VIDEO/preview",
    videoUrl: "https://res.cloudinary.com/dhg3jbifk/video/upload/v1780415243/FILTROS_VNTG_noajcp.mp4",
    type: "video"
  },
  {
    id: 3,
    title: "Cómo gestionar tus intereses",
    description: "Descubre cómo agregar productos a tu lista de intereses y cómo se utilizan las notificaciones.",
    videoUrl: "https://res.cloudinary.com/dhg3jbifk/video/upload/v1780415225/CAT_INTERES_VNTG_u7issh.mp4",
    type: "video"
  },
  {
    id: 4,
    title: "Cómo guardar tus direcciones",
    description: "Te mostramos cómo guardar tus direcciones de envío para que puedas realizar tus compras de forma rápida.",
    videoUrl: "https://res.cloudinary.com/dhg3jbifk/video/upload/v1780415234/DIRECCIONES_VNTG_mxpl4b.mp4",
    type: "video"
  }
];

export default function Tutoriales() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-brand-dark transition-colors duration-500 relative overflow-hidden">
      
      {/* Efectos de fondo desenfocados (Glows) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-orange/20 blur-[120px] rounded-full pointer-events-none opacity-50 dark:opacity-20"></div>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10 pt-32 pb-24">
        
        {/* HEADER DE LA PÁGINA */}
        <div className="text-center mb-20 animate-reveal">
          <div className="inline-flex items-center justify-center p-4 bg-brand-orange/10 dark:bg-brand-orange/5 rounded-3xl mb-8 border border-brand-orange/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
            <PlayCircle size={40} className="text-brand-orange animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase text-zinc-900 dark:text-white mb-6 tracking-tighter drop-shadow-sm">
            VNTG <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">Tutoriales</span>
          </h1>
          <p className="text-lg md:text-2xl font-medium italic text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Domina nuestra plataforma en minutos. Seleccionamos estas guías exclusivas para que tu experiencia sea rápida, segura y sin complicaciones.
          </p>
        </div>

        {/* GRID DE VIDEOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {tutoriales.map((tutorial, index) => (
            <div 
              key={tutorial.id}
              className="bg-white/80 dark:bg-brand-card/80 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-xl dark:shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(249,115,22,0.1)] hover:border-brand-orange/30 group animate-reveal"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* ÁREA DEL REPRODUCTOR */}
              <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden group">
                {/* Overlay de diseño para el borde interior */}
                <div className="absolute inset-0 border-[4px] border-transparent group-hover:border-brand-orange/20 transition-all duration-500 z-10 pointer-events-none rounded-t-[2rem]"></div>
                
                {tutorial.type === 'video' ? (
                  <video 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    controls
                    preload="metadata"
                  >
                    <source src={tutorial.videoUrl} type="video/mp4" />
                    Tu navegador no soporta el elemento de video.
                  </video>
                ) : (
                  <iframe 
                    src={tutorial.videoUrl} 
                    className="w-full h-full border-0 transition-transform duration-700 group-hover:scale-[1.02]"
                    allow="autoplay; fullscreen"
                    title={tutorial.title}
                  ></iframe>
                )}
                
                {/* Badge flotante en el video */}
                <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Tutorial</span>
                </div>
              </div>

              {/* CONTENIDO DEL TUTORIAL */}
              <div className="p-8 md:p-10 flex-grow flex flex-col relative bg-gradient-to-b from-transparent to-zinc-50/50 dark:to-zinc-900/50">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-2xl md:text-3xl font-black italic uppercase text-zinc-900 dark:text-white group-hover:text-brand-orange transition-colors duration-300">
                    {tutorial.title}
                  </h3>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg font-medium leading-relaxed mb-8 flex-grow">
                  {tutorial.description}
                </p>

                {/* FOOTER DE LA CARD */}
                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center text-[11px] font-black uppercase italic tracking-[0.2em] text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    <Info size={16} className="mr-2 text-brand-orange" />
                    VNTG Hub Guide
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-brand-orange transition-colors duration-300">
                    <PlayCircle size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SECCIÓN "PRÓXIMAMENTE" ANIMADA */}
        <div className="mt-24 text-center animate-reveal relative flex justify-center" style={{ animationDelay: '600ms' }}>
          <div className="relative group cursor-default">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-orange via-orange-400 to-brand-orange rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative px-8 py-4 bg-white dark:bg-brand-card rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-lg">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-orange"></span>
              </span>
              <h2 className="text-lg md:text-xl font-black italic uppercase text-zinc-900 dark:text-white tracking-[0.2em]">
                Próximamente más guías
              </h2>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        </div>
        
        {/* MENSAJE FINAL / AYUDA EXTRA */}
        <div className="mt-28 text-center animate-reveal relative" style={{ animationDelay: '600ms' }}>
          <div className="absolute inset-0 bg-brand-orange/5 blur-3xl rounded-full -z-10"></div>
          <h2 className="text-2xl md:text-3xl font-black italic uppercase text-zinc-900 dark:text-white mb-4">
            ¿Aún tienes dudas?
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic mb-8 max-w-xl mx-auto">
            Nuestro equipo de soporte está listo para ayudarte con cualquier consulta que tengas sobre la plataforma.
          </p>
          <a href="/contacto" className="inline-flex items-center justify-center px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-black italic uppercase text-sm hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl hover:shadow-brand-orange/20 group">
            <span className="mr-2 group-hover:text-brand-orange transition-colors">Contactar Soporte VIP</span>
          </a>
        </div>

      </div>
    </div>
  );
}
