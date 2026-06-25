export const formatArgTime = (dateString, includeTime = true) => {
    if (!dateString) return '';
    // MySQL devuelve fechas sin indicador de zona (ej: "2026-06-25 19:00:00").
    // Si no tiene 'Z' ni '+', lo tratamos como UTC explícitamente para
    // que el browser no lo interprete como hora local del cliente.
    let normalized = String(dateString);
    if (normalized.includes('T')) {
        // Formato ISO sin zona: "2026-06-25T19:00:00" → agregar Z
        if (!normalized.endsWith('Z') && !normalized.includes('+')) {
            normalized = normalized + 'Z';
        }
    } else if (normalized.includes(' ')) {
        // Formato MySQL: "2026-06-25 19:00:00" → convertir a ISO UTC
        normalized = normalized.replace(' ', 'T') + 'Z';
    }
    const date = new Date(normalized);
    const options = {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        options.hour12 = false;
    }
    return date.toLocaleString('es-AR', options);
};
