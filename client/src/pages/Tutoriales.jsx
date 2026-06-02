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
    <div className="min-h-screen bg-zinc-50 dark:bg-brand-dark pt-24 pb-20 px-4 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        
        {/* HEADER DE LA PÁGINA */}
        <div className="text-center mb-16 animate-reveal">
          <div className="inline-flex items-center justify-center p-3 bg-brand-orange/10 rounded-2xl mb-6">
            <PlayCircle size={32} className="text-brand-orange" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-zinc-900 dark:text-white mb-6 tracking-tight">
            Nuestros <span className="text-brand-orange">Tutoriales</span>
          </h1>
          <p className="text-lg md:text-xl font-medium italic text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Aprende a sacarle el máximo provecho a VNTG Hub. Aquí encontrarás guías paso a paso para realizar tus compras y usar nuestra plataforma.
          </p>
        </div>

        {/* GRID DE VIDEOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutoriales.map((tutorial, index) => (
            <div 
              key={tutorial.id}
              className="bg-white dark:bg-brand-card rounded-3xl overflow-hidden shadow-lg border border-zinc-100 dark:border-zinc-800 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-brand-orange/50 group animate-reveal"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* ÁREA DEL REPRODUCTOR */}
              <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
                {tutorial.type === 'video' ? (
                  <video 
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  >
                    <source src={tutorial.videoUrl} type="video/mp4" />
                    Tu navegador no soporta el elemento de video.
                  </video>
                ) : (
                  <iframe 
                    src={tutorial.videoUrl} 
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen"
                    title={tutorial.title}
                  ></iframe>
                )}
              </div>

              {/* CONTENIDO DEL TUTORIAL */}
              <div className="p-6 md:p-8 flex-grow flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl md:text-2xl font-black italic uppercase text-zinc-900 dark:text-white group-hover:text-brand-orange transition-colors">
                    {tutorial.title}
                  </h3>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base font-medium leading-relaxed mb-6 flex-grow">
                  {tutorial.description}
                </p>

                {/* FOOTER DE LA CARD */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center text-[10px] font-black uppercase italic tracking-widest text-zinc-400">
                  <Info size={14} className="mr-2" />
                  VNTG Hub Guide
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MENSAJE FINAL / AYUDA EXTRA */}
        <div className="mt-20 text-center animate-reveal" style={{ animationDelay: '400ms' }}>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic mb-4">
            ¿No encontraste lo que buscabas?
          </p>
          <a href="/contacto" className="inline-flex items-center justify-center px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-black italic uppercase text-sm hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl">
            Contactar Soporte
          </a>
        </div>

      </div>
    </div>
  );
}
