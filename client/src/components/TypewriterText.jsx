import { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ phrases: _phrases, speed = 50, deleteSpeed = 25, pause = 2000 }) => {
    const phrases = Array.isArray(_phrases) && _phrases.length > 0
        ? _phrases
        : ["Coleccionismo de Alto Nivel"];

    const [displayText, setDisplayText] = useState('');

    const idxRef = useRef(0);
    const phraseIdxRef = useRef(0);
    const isDeletingRef = useRef(false);
    const speedRef = useRef(speed);
    const deleteSpeedRef = useRef(deleteSpeed);
    const pauseRef = useRef(pause);
    const phrasesRef = useRef(phrases);

    speedRef.current = speed;
    deleteSpeedRef.current = deleteSpeed;
    pauseRef.current = pause;
    phrasesRef.current = phrases;

    const longest = phrases.reduce((a, b) => a.length > b.length ? a : b, '');

    useEffect(() => {
        let timeout;

        const tick = () => {
            const p = phrasesRef.current;
            const current = p[phraseIdxRef.current];
            if (!current) return;

            if (!isDeletingRef.current) {
                if (idxRef.current < current.length) {
                    idxRef.current++;
                    setDisplayText(current.slice(0, idxRef.current));
                    timeout = setTimeout(tick, speedRef.current);
                } else {
                    timeout = setTimeout(() => {
                        isDeletingRef.current = true;
                        tick();
                    }, pauseRef.current);
                }
            } else {
                if (idxRef.current > 0) {
                    idxRef.current--;
                    setDisplayText(current.slice(0, idxRef.current));
                    timeout = setTimeout(tick, deleteSpeedRef.current);
                } else {
                    phraseIdxRef.current = (phraseIdxRef.current + 1) % p.length;
                    isDeletingRef.current = false;
                    timeout = setTimeout(tick, pauseRef.current / 2);
                }
            }
        };

        timeout = setTimeout(tick, 400);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <span className="inline-grid whitespace-nowrap" style={{ gridTemplateColumns: '1fr' }}>
            <span className="invisible col-start-1 row-start-1" aria-hidden="true">{longest}</span>
            <span className="col-start-1 row-start-1 whitespace-nowrap" style={{ justifySelf: 'center' }}>
                {displayText}
            </span>
        </span>
    );
};

export default TypewriterText;
