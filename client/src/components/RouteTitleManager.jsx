// IMPORTACIONES
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RouteTitleManager = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Mapeo de rutas estáticas
        const staticTitles = {
            '/': 'VNTG HUB - Tienda de Coleccionables y Figuras de Colección',
            '/checkout': 'VNTG HUB - Finalizar Compra',
            '/mi-cuenta': 'VNTG HUB - Mi Cuenta',
            '/login': 'VNTG HUB - Iniciar Sesión',
            '/register': 'VNTG HUB - Crear Cuenta',
            '/recuperar-password': 'VNTG HUB - Recuperar Contraseña',
            '/reset-password': 'VNTG HUB - Restablecer Contraseña',
            '/admin': 'VNTG HUB - Panel de Control',
            '/soporte': 'VNTG HUB - Panel de Soporte',
            '/guia-autenticidad': 'VNTG HUB - Guía de Autenticidad',
            '/envios': 'VNTG HUB - Guía de Envíos',
            '/contacto': 'VNTG HUB - Contacto',
            '/terminos': 'VNTG HUB - Términos y Condiciones',
            '/privacidad': 'VNTG HUB - Políticas de Privacidad',
        };

        // Si es una ruta estática, establecer el título de inmediato.
        // Si es una ruta dinámica, poner un placeholder temporal hasta que el componente resuelva sus datos.
        if (staticTitles[pathname]) {
            document.title = staticTitles[pathname];
        } else if (pathname.startsWith('/categoria/')) {
            document.title = 'VNTG HUB - Cargando Colección...';
        } else if (pathname.startsWith('/producto/')) {
            document.title = 'VNTG HUB - Cargando Producto...';
        } else if (pathname.startsWith('/pedido/')) {
            document.title = 'VNTG HUB - Cargando Detalle de Pedido...';
        } else {
            // Manejador genérico (NotFound o rutas personalizadas)
            document.title = 'VNTG HUB - Página no encontrada';
        }
    }, [pathname]);

    return null;
};

export default RouteTitleManager;
