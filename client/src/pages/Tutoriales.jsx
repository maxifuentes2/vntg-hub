import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Info, Pause, Maximize, Minimize, RotateCcw, RotateCw, Loader2 } from 'lucide-react';

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
  const videoRefs = useRef({});
  const [playingStates, setPlayingStates] = useState({});
  const [progress, setProgress] = useState({});
  const [videoTimes, setVideoTimes] = useState({});
  const [showControls, setShowControls] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const idleTimers = useRef({});

  const idleTimeout = 3000;

  const resetIdleTimer = (id) => {
    clearTimeout(idleTimers.current[id]);
    setShowControls(prev => ({ ...prev, [id]: true }));
    if (playingStates[id]) {
      idleTimers.current[id] = setTimeout(() => {
        setShowControls(prev => ({ ...prev, [id]: false }));
      }, idleTimeout);
    }
  };

  const handleContainerMouseMove = (id) => {
    resetIdleTimer(id);
  };

  const handleControlsMouseEnter = (id) => {
    clearTimeout(idleTimers.current[id]);
    setShowControls(prev => ({ ...prev, [id]: true }));
  };

  const handleControlsMouseLeave = (id) => {
    if (playingStates[id]) {
      idleTimers.current[id] = setTimeout(() => {
        setShowControls(prev => ({ ...prev, [id]: false }));
      }, idleTimeout);
    }
  };

  const formatTime = (t) => {
    if (!t || !isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const setVideoRef = useCallback((id) => (el) => {
    if (el) videoRefs.current[id] = el;
  }, []);

  const togglePlay = (id) => {
    const video = videoRefs.current[id];
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlayingStates(prev => ({ ...prev, [id]: true }));
      setShowControls(prev => ({ ...prev, [id]: true }));
      idleTimers.current[id] = setTimeout(() => {
        setShowControls(prev => ({ ...prev, [id]: false }));
      }, idleTimeout);
    } else {
      video.pause();
      setPlayingStates(prev => ({ ...prev, [id]: false }));
      clearTimeout(idleTimers.current[id]);
      setShowControls(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleTimeUpdate = (id) => {
    const video = videoRefs.current[id];
    if (!video || !video.duration) return;
    setProgress(prev => ({ ...prev, [id]: (video.currentTime / video.duration) * 100 }));
    setVideoTimes(prev => ({ ...prev, [id]: { current: video.currentTime, duration: video.duration } }));
  };

  const handleEnded = (id) => {
    setPlayingStates(prev => ({ ...prev, [id]: false }));
    clearTimeout(idleTimers.current[id]);
    setShowControls(prev => ({ ...prev, [id]: true }));
  };

  const containerRefs = useRef({});
  const [fullscreenVideoId, setFullscreenVideoId] = useState(null);

  const setContainerRef = useCallback((id) => (el) => {
    if (el) containerRefs.current[id] = el;
  }, []);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        setFullscreenVideoId(null);
        try { screen.orientation.unlock(); } catch {}
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const dragData = useRef({ id: null, rect: null });

  const handleSeekByRect = useCallback((id, rect, clientX) => {
    const video = videoRefs.current[id];
    if (!video || !video.duration) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
    setProgress(prev => ({ ...prev, [id]: pct * 100 }));
  }, []);

  const handleTimelineDown = useCallback((id, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    dragData.current = { id, rect };
    handleSeekByRect(id, rect, e.clientX);
  }, [handleSeekByRect]);

  const handleTimelineMove = useCallback((e) => {
    const { id, rect } = dragData.current;
    if (!id) return;
    handleSeekByRect(id, rect, e.clientX);
  }, [handleSeekByRect]);

  const handleTimelineUp = useCallback(() => {
    dragData.current = { id: null, rect: null };
  }, []);

  useEffect(() => {
    const onMove = (e) => handleTimelineMove(e);
    const onUp = () => handleTimelineUp();
    const onTouchMove = (e) => { const { id, rect } = dragData.current; if (!id) return; const clientX = e.touches[0].clientX; handleSeekByRect(id, rect, clientX); };
    const onTouchEnd = () => handleTimelineUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleTimelineMove, handleTimelineUp, handleSeekByRect]);

  const toggleFullscreen = (id) => {
    const container = containerRefs.current[id];
    if (!container) return;
    if (fullscreenVideoId === id) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
      setFullscreenVideoId(id);
      try { screen.orientation.lock('landscape'); } catch {}
    }
  };

  const skip = (id, seconds) => {
    const video = videoRefs.current[id];
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const handleSeek = (id, e) => {
    const video = videoRefs.current[id];
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-brand-dark transition-colors duration-500 relative overflow-hidden">
      
      {/* Efectos de fondo desenfocados (Glows) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-orange/20 blur-[120px] rounded-full pointer-events-none opacity-50 dark:opacity-20"></div>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10 pt-20 sm:pt-32 pb-24">
        
        {/* HEADER DE LA PÁGINA */}
        <div className="text-center mb-20 animate-reveal">
          <div className="inline-flex items-center justify-center p-4 bg-brand-orange/10 dark:bg-brand-orange/5 rounded-3xl mb-8 border border-brand-orange/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
            <Play size={40} className="text-brand-orange animate-pulse" />
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
              className="relative bg-white/80 dark:bg-brand-card/80 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-xl dark:shadow-2xl flex flex-col transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(249,115,22,0.1)] group animate-reveal"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Overlay de borde naranja en toda la card */}
              <div className={`absolute inset-0 border-2 z-50 pointer-events-none rounded-[2rem] transition-all duration-500 ${fullscreenVideoId === tutorial.id ? 'border-transparent' : 'border-transparent group-hover:border-brand-orange'}`}></div>
              {/* ÁREA DEL REPRODUCTOR */}
              <div
                ref={setContainerRef(tutorial.id)}
                className={`relative w-full aspect-video bg-zinc-900 overflow-hidden ${fullscreenVideoId === tutorial.id ? '!aspect-auto' : ''}`}
                onMouseMove={() => handleContainerMouseMove(tutorial.id)}
                onMouseLeave={() => { clearTimeout(idleTimers.current[tutorial.id]); if (playingStates[tutorial.id]) setShowControls(prev => ({ ...prev, [tutorial.id]: false })); }}
                onTouchStart={() => handleContainerMouseMove(tutorial.id)}
                style={{ touchAction: 'manipulation' }}
              >
                {tutorial.type === 'video' ? (
                  <>
                    <video
                      ref={setVideoRef(tutorial.id)}
                      className={`w-full h-full pointer-events-none ${fullscreenVideoId === tutorial.id ? 'object-contain max-h-screen' : 'object-cover'} transition-transform duration-700`}
                      preload="metadata"
                      playsInline
                      onTimeUpdate={() => handleTimeUpdate(tutorial.id)}
                      onEnded={() => handleEnded(tutorial.id)}
                      onWaiting={() => setLoadingStates(prev => ({ ...prev, [tutorial.id]: true }))}
                      onPlaying={() => setLoadingStates(prev => ({ ...prev, [tutorial.id]: false }))}
                      onSeeked={() => setLoadingStates(prev => ({ ...prev, [tutorial.id]: false }))}
                    >
                      <source src={tutorial.videoUrl} type="video/mp4" />
                    </video>

                    {/* Click catcher for video area - only catches taps not on controls */}
                    <div className="absolute inset-0 z-10" onClick={() => togglePlay(tutorial.id)} />

                    {/* Thin progress bar - always visible */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 cursor-pointer z-30"
                      onMouseDown={(e) => { e.stopPropagation(); handleTimelineDown(tutorial.id, e); }}
                      onTouchStart={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); dragData.current = { id: tutorial.id, rect }; handleSeekByRect(tutorial.id, rect, e.touches[0].clientX); }}
                    >
                      <div
                        className="h-full bg-brand-orange relative"
                        style={{ width: `${progress[tutorial.id] || 0}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-brand-orange" />
                      </div>
                    </div>

                    {/* Controls overlay */}
                    <div
                      className={`absolute inset-0 z-20 flex flex-col justify-end transition-opacity duration-300 ${
                        showControls[tutorial.id]
                          ? 'opacity-100 pointer-events-auto'
                          : 'opacity-0 pointer-events-none'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={() => handleControlsMouseEnter(tutorial.id)}
                      onMouseLeave={() => handleControlsMouseLeave(tutorial.id)}
                    >
                      {/* Semi-transparent background */}
                      <div className="absolute inset-0 bg-black/10" />

                      {/* Center controls: skip back | play/pause | skip forward */}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 md:gap-5 -translate-y-10 md:translate-y-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); skip(tutorial.id, -10); }}
                          disabled={loadingStates[tutorial.id]}
                          className={`size-10 md:size-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 transition-all active:scale-95 ${loadingStates[tutorial.id] ? 'opacity-40 cursor-not-allowed' : 'hover:bg-brand-orange hover:text-white hover:scale-110'}`}
                          title="Retroceder 10s"
                        >
                          <span className="relative flex items-center justify-center">
                            <RotateCcw size={24} />
                            <span className="absolute text-[8px] font-black leading-none">10</span>
                          </span>
                        </button>

                        {loadingStates[tutorial.id] ? (
                          <div className="size-14 md:size-[72px] rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                            <Loader2 size={28} className="text-white animate-spin" />
                          </div>
                        ) : (
                        <button
                          onClick={() => togglePlay(tutorial.id)}
                          className="text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-transform"
                        >
                          {playingStates[tutorial.id] ? (
                            <Pause size={56} className="md:w-[72px] md:h-[72px]" fill="white" />
                          ) : (
                            <Play size={56} className="md:w-[72px] md:h-[72px]" fill="white" />
                          )}
                        </button>)}

                        <button
                          onClick={(e) => { e.stopPropagation(); skip(tutorial.id, 10); }}
                          disabled={loadingStates[tutorial.id]}
                          className={`size-10 md:size-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 transition-all active:scale-95 ${loadingStates[tutorial.id] ? 'opacity-40 cursor-not-allowed' : 'hover:bg-brand-orange hover:text-white hover:scale-110'}`}
                          title="Avanzar 10s"
                        >
                          <span className="relative flex items-center justify-center">
                            <RotateCw size={24} />
                            <span className="absolute text-[8px] font-black leading-none">10</span>
                          </span>
                        </button>
                      </div>

                      {/* Bottom control bar */}
                      <div className="relative bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 sm:pt-16 pb-3 px-4 md:px-5">
                        {/* Interactive timeline */}
                        <div
                          className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-3 group/timeline"
                          onMouseDown={(e) => { e.stopPropagation(); handleTimelineDown(tutorial.id, e); }}
                          onTouchStart={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); dragData.current = { id: tutorial.id, rect }; handleSeekByRect(tutorial.id, rect, e.touches[0].clientX); }}
                        >
                          <div
                            className="h-full bg-brand-orange rounded-full relative"
                            style={{ width: `${progress[tutorial.id] || 0}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-brand-orange" />
                          </div>
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); togglePlay(tutorial.id); }}
                              className="bg-black/40 backdrop-blur-sm rounded-full p-2 text-white hover:bg-brand-orange transition-all"
                            >
                              {playingStates[tutorial.id] ? (
                                <Pause size={18} fill="white" />
                              ) : (
                                <Play size={18} fill="white" />
                              )}
                            </button>
                            <span className="text-[11px] font-bold text-white/80 tabular-nums tracking-tight">
                              {formatTime(videoTimes[tutorial.id]?.current)} / {formatTime(videoTimes[tutorial.id]?.duration)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFullscreen(tutorial.id); }}
                              className="bg-black/40 backdrop-blur-sm rounded-full p-2 text-white/80 hover:text-white hover:bg-brand-orange transition-all"
                            >
                              {fullscreenVideoId === tutorial.id ? <Minimize size={16} /> : <Maximize size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <iframe 
                    src={tutorial.videoUrl} 
                    className="w-full h-full border-0 transition-transform duration-700 group-hover:scale-[1.02]"
                    allow="autoplay; fullscreen"
                    title={tutorial.title}
                  ></iframe>
                )}
                
                {/* Badge flotante en el video */}
                <div className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
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
                  <button
                    onClick={() => togglePlay(tutorial.id)}
                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-brand-orange transition-colors duration-300"
                  >
                    {playingStates[tutorial.id] ? (
                      <Pause size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                    ) : (
                      <Play size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                    )}
                  </button>
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
            <span className="mr-2 group-hover:text-brand-orange transition-colors">Contactar Soporte</span>
          </a>
        </div>

      </div>
    </div>
  );
}
