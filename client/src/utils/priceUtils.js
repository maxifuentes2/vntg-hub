// IMPORTACIONES
export const calculateDiscountedPrice = (price, discountPercentage) => {
    if (!discountPercentage || discountPercentage <= 0) return price;
    return price * (1 - discountPercentage / 100);
};

export const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
};
