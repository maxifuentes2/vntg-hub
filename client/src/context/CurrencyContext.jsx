// IMPORTACIONES
import { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

const CurrencyContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(() => {
        return localStorage.getItem('vntg_currency') || 'ARS';
    });
    const [tasaUSD, setTasaUSD] = useState(null);

    useEffect(() => {
        localStorage.setItem('vntg_currency', currency);
    }, [currency]);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch(`${API_URL}/api/tasa-usd`);
                const data = await res.json();
                if (data.tasa_ars) setTasaUSD(data.tasa_ars);
            } catch (e) {
                console.error("Error fetching rate:", e);
            }
        };
        fetchRate();
        const interval = setInterval(fetchRate, 60000);
        return () => clearInterval(interval);
    }, []);

    const toggleCurrency = useCallback(() => {
        setCurrency(prev => prev === 'ARS' ? 'USD' : 'ARS');
    }, []);

    const convertPrice = useCallback((arsPrice) => {
        if (currency === 'USD' && tasaUSD) {
            return arsPrice / tasaUSD;
        }
        return arsPrice;
    }, [currency, tasaUSD]);

    const formatPrice = useCallback((arsPrice) => {
        const num = Number(arsPrice) || 0;
        if (currency === 'USD' && tasaUSD) {
            const usd = num / tasaUSD;
            return `USD ${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$${num.toLocaleString('es-AR')}`;
    }, [currency, tasaUSD]);

    const value = useMemo(() => ({
        currency, tasaUSD, toggleCurrency, convertPrice, formatPrice, setCurrency,
    }), [currency, tasaUSD, toggleCurrency, convertPrice, formatPrice]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
