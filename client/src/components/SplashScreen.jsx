import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function preloadData() {
    await Promise.allSettled([
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/categories`),
    ]);
}

export default function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let progressInterval;
        let done = false;

        progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) { clearInterval(progressInterval); return 90; }
                return prev + Math.random() * 12;
            });
        }, 200);

        preloadData().then(() => {
            done = true;
            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => {
                setPhase(2);
                setTimeout(() => onDone(), 700);
            }, 500);
        });

        const safetyTimeout = setTimeout(() => {
            if (!done) {
                clearInterval(progressInterval);
                setProgress(100);
                setPhase(2);
                setTimeout(() => onDone(), 700);
            }
        }, 5000);

        return () => { clearInterval(progressInterval); clearTimeout(safetyTimeout); };
    }, [onDone]);

    return (
        <>
            <style>{`
                @keyframes vntg-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes vntg-spin-reverse {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(-360deg); }
                }
                @keyframes vntg-pulse {
                    0%, 100% { opacity: 1;   transform: scale(1); }
                    50%       { opacity: 0.8; transform: scale(0.94); }
                }

                /* Contenedor principal */
                .vntg-splash {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: #09090b;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 36px;
                    padding: 16px;
                    box-sizing: border-box;
                }

                /* Wrapper de los anillos: tamaño explícito */
                .vntg-rings {
                    position: relative;
                    width: 240px;
                    height: 240px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .vntg-ring-outer {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 2.5px solid transparent;
                    border-top-color: #f97316;
                    border-right-color: #f97316;
                    animation: vntg-spin 1.2s linear infinite;
                }

                .vntg-ring-inner {
                    position: absolute;
                    inset: 22px;
                    border-radius: 50%;
                    border: 1.5px solid transparent;
                    border-bottom-color: #3b82f6;
                    border-left-color: #3b82f6;
                    animation: vntg-spin-reverse 1.8s linear infinite;
                }

                .vntg-logo {
                    height: 56px;
                    width: auto;
                    object-fit: contain;
                    animation: vntg-pulse 2s ease-in-out infinite;
                    position: relative;
                    z-index: 1;
                }

                /* Barra de progreso: separada del wrapper de anillos */
                .vntg-progress-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    width: min(260px, 80vw);
                }

                .vntg-bar-track {
                    width: 100%;
                    height: 2px;
                    background: #27272a;
                    border-radius: 2px;
                    overflow: hidden;
                }

                .vntg-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #f97316, #fb923c);
                    border-radius: 2px;
                    transition: width 0.3s ease-out;
                    box-shadow: 0 0 8px #f97316aa;
                }

                .vntg-label {
                    font-family: sans-serif;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    font-style: italic;
                    color: #52525b;
                }

                /* ── Responsive ── */
                @media (max-width: 400px) {
                    .vntg-rings { width: 180px; height: 180px; }
                    .vntg-ring-inner { inset: 16px; }
                    .vntg-logo { height: 42px; }
                    .vntg-splash { gap: 28px; }
                }

                @media (max-width: 320px) {
                    .vntg-rings { width: 150px; height: 150px; }
                    .vntg-ring-inner { inset: 14px; }
                    .vntg-logo { height: 36px; }
                    .vntg-splash { gap: 24px; }
                    .vntg-label { font-size: 9px; letter-spacing: 2px; }
                }
            `}</style>

            <div
                className="vntg-splash"
                style={{ opacity: phase === 2 ? 0 : 1, transition: phase === 2 ? 'opacity 0.7s ease' : 'none' }}
            >
                {/* Anillos con logo DENTRO del wrapper de tamaño fijo */}
                <div className="vntg-rings">
                    <div className="vntg-ring-outer" />
                    <div className="vntg-ring-inner" />
                    <img
                        src="/logo-texto-transparente.webp"
                        alt="VNTG HUB"
                        className="vntg-logo"
                    />
                </div>

                {/* Barra de progreso DEBAJO de los anillos, fuera del wrapper */}
                <div className="vntg-progress-wrap">
                    <div className="vntg-bar-track">
                        <div
                            className="vntg-bar-fill"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <span className="vntg-label">
                        {progress < 100 ? 'Preparando tu colección...' : '¡Colección lista!'}
                    </span>
                </div>
            </div>
        </>
    );
}
