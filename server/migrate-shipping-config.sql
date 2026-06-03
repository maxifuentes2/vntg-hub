-- Ejecutar en TiDB para crear la tabla de configuración de envíos
CREATE TABLE IF NOT EXISTS shipping_config (
    id INT PRIMARY KEY DEFAULT 1,
    envio_normal DECIMAL(12,2) NOT NULL DEFAULT 9426.05,
    envio_prioritario DECIMAL(12,2) NOT NULL DEFAULT 17276.99,
    envio_gratis_desde DECIMAL(12,2) NOT NULL DEFAULT 200000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO shipping_config (id, envio_normal, envio_prioritario, envio_gratis_desde)
VALUES (1, 9426.05, 17276.99, 200000)
ON DUPLICATE KEY UPDATE id=id;
