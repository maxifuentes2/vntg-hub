const https = require("https");

const MOCK = process.env.NOWPAYMENTS_MOCK === "true";
const SANDBOX = process.env.NOWPAYMENTS_SANDBOX === "true";
const BASE = SANDBOX ? "https://api-sandbox.nowpayments.io/v1/" : "https://api.nowpayments.io/v1/";
const mockAddress = (currency, orderId) => {
  const seed = orderId.slice(0, 8) + Math.random().toString(36).slice(2, 10);
  if (currency === "usdttrc20" || currency === "usdc") {
    return "0x" + Array.from({ length: 40 }, (_, i) =>
      "0123456789abcdef"[seed.charCodeAt(i % seed.length) % 16],
    ).join("");
  }
  if (currency === "btc") {
    return "bc1q" + seed.replace(/[^0-9a-z]/g, "").slice(0, 35);
  }
  if (currency === "eth") {
    return "0x" + Array.from({ length: 40 }, (_, i) =>
      "0123456789abcdef"[seed.charCodeAt(i % seed.length) % 16],
    ).join("");
  }
  if (currency === "ltc") {
    return "L" + seed.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 33);
  }
  if (currency === "sol") {
    return seed.replace(/[^A-Za-z0-9]/g, "").slice(0, 44);
  }
  return "0x" + Array.from({ length: 40 }, (_, i) =>
    "0123456789abcdef"[seed.charCodeAt(i % seed.length) % 16],
  ).join("");
};

const CURRENCIES = {
  USDTTRC20: "usdttrc20",
  USDC: "usdc",
  BTC: "btc",
  ETH: "eth",
  LTC: "ltc",
  SOL: "sol",
};

const apiFetch = (path, options = {}) =>
  new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = https.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "x-api-key": process.env.NOWPAYMENTS_API_KEY || "",
          "Content-Type": "application/json",
          ...options.headers,
        },
        timeout: 15000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (!res.statusCode.toString().startsWith("2")) {
              reject(new Error(data.message || `HTTP ${res.statusCode}`));
            } else {
              resolve(data);
            }
          } catch {
            reject(new Error(`Invalid JSON: ${body}`));
          }
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });

const createPayment = async ({
  price_amount,
  price_currency = "usd",
  pay_currency = "usdttrc20",
  order_id,
  ipn_callback_url,
}) => {
  if (MOCK) {
    const isStablecoin = pay_currency === "usdttrc20" || pay_currency === "usdc";
    return {
      payment_id: `mock_${order_id}_${Date.now()}`,
      pay_address: mockAddress(pay_currency, order_id),
      pay_amount: isStablecoin ? price_amount.toFixed(8) : (price_amount / 1200).toFixed(8),
      pay_currency,
      price_amount,
      price_currency,
      order_id,
      payment_status: "waiting",
    };
  }
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error("NOWPAYMENTS_API_KEY no configurada");
  }
  return apiFetch("payment", {
    method: "POST",
    body: {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      ipn_callback_url,
      is_fixed_rate: true,
      is_fee_paid_by_user: true,
    },
  });
};

const getPaymentStatus = async (paymentId) => {
  if (MOCK) {
    return {
      payment_id: paymentId,
      payment_status: "finished",
      pay_amount: "0.01",
      actually_paid: "0.01",
    };
  }
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error("NOWPAYMENTS_API_KEY no configurada");
  }
  return apiFetch(`payment/${paymentId}`);
};

const getArsUsdRate = async () => {
  if (MOCK) return 1200;
  return new Promise((resolve, reject) => {
    https.get("https://dolarapi.com/v1/dolares/oficial", (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          resolve(data.venta);
        } catch {
          reject(new Error(`Error obteniendo tasa ARS/USD: ${body}`));
        }
      });
    });
  });
};

const MOCK_MINS = { usdttrc20: 5, usdc: 5, btc: 10, eth: 8, ltc: 7, sol: 6 };

const getMinAmount = async ({ currency_from = "usd", currency_to = "usdttrc20" } = {}) => {
  if (MOCK) {
    return MOCK_MINS[currency_to] || 5;
  }
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error("NOWPAYMENTS_API_KEY no configurada");
  }
  const data = await apiFetch(
    `min-amount?currency_from=${currency_from}&currency_to=${currency_to}`,
  );
  return data.min_amount || 1;
};

const estimatePrice = async ({ amount, currency_from = "usd", currency_to = "usdttrc20" }) => {
  if (MOCK) {
    const isStablecoin = currency_to === "usdttrc20" || currency_to === "usdc";
    return { amount, currency_from, currency_to, estimated_amount: isStablecoin ? amount.toFixed(8) : (amount / 1200).toFixed(8) };
  }
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error("NOWPAYMENTS_API_KEY no configurada");
  }
  return apiFetch(
    `estimate?amount=${amount}&currency_from=${currency_from}&currency_to=${currency_to}`,
  );
};

module.exports = {
  CURRENCIES,
  createPayment,
  getPaymentStatus,
  estimatePrice,
  getArsUsdRate,
  getMinAmount,
};
