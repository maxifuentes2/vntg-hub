// IMPORTACIONES
import { Link } from 'react-router-dom';
import { House } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans transition-colors duration-300">
            <div className="absolute inset-0 w-full h-full">
                <img
                    src="/wallpaper.webp"
                    className="w-full h-full object-cover opacity-20 scale-110 dark:opacity-10"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
                    }}
                    alt=""
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/80 dark:from-brand-dark/80 via-transparent to-transparent"></div>
            <div className="relative z-10 text-center px-4">
                <h1 className="text-6xl max-[400px]:text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-zinc-900 dark:text-white border-b-[6px] border-brand-orange mb-6 inline-block glitch-404">
                    ERROR 404
                </h1>
                <h2 className="text-lg max-[400px]:text-base md:text-2xl font-black italic uppercase mb-8 text-zinc-800 dark:text-zinc-200 flicker-sub">
                    Página no encontrada.
                </h2>
                <Link to="/" className="inline-flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-brand-dark px-6 xs:px-10 py-3 xs:py-5 font-black uppercase italic hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white transition-all shadow-xl rounded-2xl active:scale-95">
                    <House size={20} /> Volver al Inicio
                </Link>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .glitch-404 {
                    position: relative;
                    animation: glitch-shake 3s steps(1) infinite;
                }
                .glitch-404::before,
                .glitch-404::after {
                    content: "ERROR 404";
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    pointer-events: none;
                }
                .glitch-404::before {
                    animation: glitch-cyan 3s steps(1) infinite;
                    clip-path: inset(0 0 70% 0);
                }
                .glitch-404::after {
                    animation: glitch-magenta 3s steps(1) infinite;
                    clip-path: inset(70% 0 0 0);
                }
                @keyframes glitch-shake {
                    0%, 5%, 9%, 13%, 17%, 21%, 25%, 29%, 33%, 37%, 41%, 45%, 49%, 53%, 57%, 61%, 65%, 69%, 73%, 77%, 81%, 85%, 89%, 93%, 97% { transform: translate(0) skewX(0); }
                    1% { transform: translate(-5px, 2px) skewX(3deg); }
                    2% { transform: translate(4px, -1px) skewX(-2deg); }
                    3% { transform: translate(-2px, 3px) skewX(1deg); }
                    4% { transform: translate(0); }
                    6% { transform: translate(6px, -2px) skewX(-4deg); }
                    7% { transform: translate(-4px, 1px) skewX(2deg); }
                    8% { transform: translate(0); }
                    10% { transform: translate(-8px, 3px) skewX(5deg); }
                    11% { transform: translate(3px, -3px) skewX(-3deg); }
                    12% { transform: translate(0); }
                    14% { transform: translate(5px, 2px) skewX(-2deg); }
                    15% { transform: translate(-3px, -1px) skewX(4deg); }
                    16% { transform: translate(0); }
                    18% { transform: translate(-6px, -2px) skewX(-3deg); }
                    19% { transform: translate(2px, 4px) skewX(2deg); }
                    20% { transform: translate(0); }
                    22% { transform: translate(7px, -3px) skewX(4deg); }
                    23% { transform: translate(-5px, 1px) skewX(-5deg); }
                    24% { transform: translate(0); }
                    26% { transform: translate(-4px, -2px) skewX(-1deg); }
                    27% { transform: translate(3px, 3px) skewX(3deg); }
                    28% { transform: translate(0); }
                    30% { transform: translate(6px, 2px) skewX(-3deg); }
                    31% { transform: translate(-2px, -3px) skewX(2deg); }
                    32% { transform: translate(0); }
                    34% { transform: translate(-7px, 1px) skewX(4deg); }
                    35% { transform: translate(4px, -2px) skewX(-2deg); }
                    36% { transform: translate(0); }
                    38% { transform: translate(3px, -4px) skewX(-4deg); }
                    39% { transform: translate(-6px, 2px) skewX(3deg); }
                    40% { transform: translate(0); }
                    42% { transform: translate(-3px, 3px) skewX(2deg); }
                    43% { transform: translate(5px, -1px) skewX(-3deg); }
                    44% { transform: translate(0); }
                    46% { transform: translate(8px, -2px) skewX(-5deg); }
                    47% { transform: translate(-4px, 3px) skewX(4deg); }
                    48% { transform: translate(0); }
                    50% { transform: translate(-5px, -3px) skewX(3deg); }
                    51% { transform: translate(2px, 2px) skewX(-3deg); }
                    52% { transform: translate(0); }
                    54% { transform: translate(4px, -3px) skewX(-2deg); }
                    55% { transform: translate(-6px, 1px) skewX(3deg); }
                    56% { transform: translate(0); }
                    58% { transform: translate(-2px, 4px) skewX(4deg); }
                    59% { transform: translate(3px, -4px) skewX(-2deg); }
                    60% { transform: translate(0); }
                    62% { transform: translate(7px, -1px) skewX(-3deg); }
                    63% { transform: translate(-5px, 3px) skewX(2deg); }
                    64% { transform: translate(0); }
                    66% { transform: translate(-6px, -2px) skewX(3deg); }
                    67% { transform: translate(4px, 2px) skewX(-4deg); }
                    68% { transform: translate(0); }
                    70% { transform: translate(3px, -3px) skewX(-2deg); }
                    71% { transform: translate(-7px, 1px) skewX(4deg); }
                    72% { transform: translate(0); }
                    74% { transform: translate(-4px, 3px) skewX(3deg); }
                    75% { transform: translate(6px, -2px) skewX(-3deg); }
                    76% { transform: translate(0); }
                    78% { transform: translate(5px, -1px) skewX(-4deg); }
                    79% { transform: translate(-3px, 4px) skewX(2deg); }
                    80% { transform: translate(0); }
                    82% { transform: translate(-8px, 2px) skewX(2deg); }
                    83% { transform: translate(2px, -3px) skewX(-4deg); }
                    84% { transform: translate(0); }
                    86% { transform: translate(4px, 2px) skewX(-3deg); }
                    87% { transform: translate(-6px, -1px) skewX(3deg); }
                    88% { transform: translate(0); }
                    90% { transform: translate(-5px, -3px) skewX(4deg); }
                    91% { transform: translate(3px, 2px) skewX(-2deg); }
                    92% { transform: translate(0); }
                    94% { transform: translate(6px, 1px) skewX(-3deg); }
                    95% { transform: translate(-4px, -2px) skewX(3deg); }
                    96% { transform: translate(0); }
                    98% { transform: translate(-3px, 3px) skewX(-1deg); }
                    99% { transform: translate(2px, -4px) skewX(2deg); }
                }
                @keyframes glitch-cyan {
                    0%, 100% { opacity: 0; }
                    1%, 2% { opacity: 0.6; transform: translate(-6px, 3px); clip-path: inset(10% 0 60% 0); }
                    3%, 5% { opacity: 0; }
                    6%, 7% { opacity: 0.7; transform: translate(8px, -4px); clip-path: inset(40% 0 20% 0); }
                    8%, 13% { opacity: 0; }
                    14%, 16% { opacity: 0.5; transform: translate(-10px, 2px); clip-path: inset(60% 0 10% 0); }
                    17%, 21% { opacity: 0; }
                    22%, 23% { opacity: 0.8; transform: translate(5px, -6px); clip-path: inset(20% 0 50% 0); }
                    24%, 33% { opacity: 0; }
                    34%, 35% { opacity: 0.6; transform: translate(-7px, 5px); clip-path: inset(50% 0 30% 0); }
                    36%, 45% { opacity: 0; }
                    46%, 47% { opacity: 0.7; transform: translate(9px, -2px); clip-path: inset(5% 0 70% 0); }
                    48%, 57% { opacity: 0; }
                    58%, 59% { opacity: 0.5; transform: translate(-4px, 7px); clip-path: inset(70% 0 5% 0); }
                    60%, 69% { opacity: 0; }
                    70%, 71% { opacity: 0.8; transform: translate(6px, -5px); clip-path: inset(30% 0 40% 0); }
                    72%, 81% { opacity: 0; }
                    82%, 83% { opacity: 0.6; transform: translate(-8px, 4px); clip-path: inset(45% 0 25% 0); }
                    84%, 93% { opacity: 0; }
                    94%, 95% { opacity: 0.7; transform: translate(7px, -3px); clip-path: inset(15% 0 55% 0); }
                    96%, 99% { opacity: 0; }
                }
                @keyframes glitch-magenta {
                    0%, 100% { opacity: 0; }
                    1%, 2% { opacity: 0.6; transform: translate(5px, -3px); clip-path: inset(30% 0 40% 0); }
                    3%, 5% { opacity: 0; }
                    6%, 7% { opacity: 0.7; transform: translate(-7px, 5px); clip-path: inset(60% 0 10% 0); }
                    8%, 13% { opacity: 0; }
                    14%, 16% { opacity: 0.5; transform: translate(9px, -2px); clip-path: inset(5% 0 65% 0); }
                    17%, 21% { opacity: 0; }
                    22%, 23% { opacity: 0.8; transform: translate(-6px, 4px); clip-path: inset(40% 0 30% 0); }
                    24%, 33% { opacity: 0; }
                    34%, 35% { opacity: 0.6; transform: translate(8px, -5px); clip-path: inset(70% 0 15% 0); }
                    36%, 45% { opacity: 0; }
                    46%, 47% { opacity: 0.7; transform: translate(-10px, 3px); clip-path: inset(15% 0 55% 0); }
                    48%, 57% { opacity: 0; }
                    58%, 59% { opacity: 0.5; transform: translate(5px, -6px); clip-path: inset(80% 0 5% 0); }
                    60%, 69% { opacity: 0; }
                    70%, 71% { opacity: 0.8; transform: translate(-7px, 4px); clip-path: inset(25% 0 45% 0); }
                    72%, 81% { opacity: 0; }
                    82%, 83% { opacity: 0.6; transform: translate(9px, -3px); clip-path: inset(50% 0 20% 0); }
                    84%, 93% { opacity: 0; }
                    94%, 95% { opacity: 0.7; transform: translate(-6px, 5px); clip-path: inset(35% 0 35% 0); }
                    96%, 99% { opacity: 0; }
                }
                @keyframes flicker-sub {
                    0%, 100% { opacity: 1; }
                    92% { opacity: 0.3; }
                    94% { opacity: 1; }
                    96% { opacity: 0.2; }
                    98% { opacity: 1; }
                }
                .flicker-sub {
                    animation: flicker-sub 8s ease-in-out infinite;
                }
            ` }} />
        </div>
    );
}