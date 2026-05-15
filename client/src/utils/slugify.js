/**
 * Convierte un texto en un slug URL-friendly.
 * Ej: "Series y Películas" → "series-y-peliculas"
 */
export const slugify = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')                          // descompone caracteres con tilde: á → a + ́
        .replace(/[\u0300-\u036f]/g, '')          // elimina los diacríticos
        .replace(/[^a-z0-9\s-]/g, '')             // elimina caracteres especiales
        .trim()
        .replace(/\s+/g, '-')                      // espacios → guiones
        .replace(/-+/g, '-');                      // múltiples guiones → uno
};
