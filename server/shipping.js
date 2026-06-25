let cached = null;

const loadConfig = async (db) => {
  try {
    const [rows] = await db.query("SELECT envio_normal, envio_prioritario, envio_gratis_desde FROM shipping_config WHERE id = 1");
    if (rows.length > 0) {
      cached = {
        COSTO_NORMAL: Number(rows[0].envio_normal),
        COSTO_PRIORITARIO: Number(rows[0].envio_prioritario),
        ENVIO_GRATIS_DESDE: Number(rows[0].envio_gratis_desde),
      };
    }
  } catch {}
  if (!cached) {
    cached = {
      COSTO_NORMAL: parseFloat(process.env.ENVIO_NORMAL) || 9426.05,
      COSTO_PRIORITARIO: parseFloat(process.env.ENVIO_PRIORITARIO) || 17276.99,
      ENVIO_GRATIS_DESDE: parseFloat(process.env.ENVIO_GRATIS_DESDE) || 250000,
    };
  }
  return cached;
};

const getConfig = () => {
  if (!cached) {
    cached = {
      COSTO_NORMAL: parseFloat(process.env.ENVIO_NORMAL) || 9426.05,
      COSTO_PRIORITARIO: parseFloat(process.env.ENVIO_PRIORITARIO) || 17276.99,
      ENVIO_GRATIS_DESDE: parseFloat(process.env.ENVIO_GRATIS_DESDE) || 250000,
    };
  }
  return cached;
};

const invalidateCache = () => { cached = null; };

module.exports = { loadConfig, getConfig, invalidateCache };
