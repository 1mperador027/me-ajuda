const SOURCES = {
  mercadolivre: { name: "Mercado Livre", env: [], mode: "live" },
  amazon: { name: "Amazon", env: ["AMAZON_PARTNER_TAG", "AMAZON_CREDENTIAL_ID", "AMAZON_CREDENTIAL_SECRET"], mode: "credentials_required" },
  magalu: { name: "Magalu", env: ["MAGALU_API_BASE_URL", "MAGALU_API_TOKEN"], mode: "partner_access_required" },
  shopee: { name: "Shopee", env: ["SHOPEE_APP_ID", "SHOPEE_APP_SECRET"], mode: "affiliate_api_access_required" }
};

function statusFor(source) {
  const missing = source.env.filter((key) => !process.env[key]);
  return { name: source.name, status: missing.length ? "needs_setup" : "configured", missing };
}

function normalizeMercadoLivre(item) {
  return {
    id: "ML-" + item.id,
    source: "Mercado Livre",
    sourceKey: "mercadolivre",
    title: item.title,
    price: Number(item.price),
    currency: item.currency_id || "BRL",
    image: item.thumbnail ? item.thumbnail.replace(/^http:\/\//, "https://") : null,
    url: item.permalink,
    condition: item.condition || null,
    seller: item.seller?.nickname || null,
    availableQuantity: item.available_quantity ?? null,
    shippingFree: item.shipping?.free_shipping === true,
    installments: item.installments ? {
      quantity: item.installments.quantity,
      amount: item.installments.amount,
      currency: item.installments.currency_id || "BRL"
    } : null
  };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const q = String(req.query.q || "").trim().slice(0, 120);
  if (q.length < 2) return res.status(400).json({ error: "Digite pelo menos 2 caracteres." });

  const statuses = Object.fromEntries(Object.entries(SOURCES).map(([key, value]) => [key, statusFor(value)]));
  let products = [];
  let errors = [];

  try {
    const url = new URL("https://api.mercadolibre.com/sites/MLB/search");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "30");
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": "MeAjuda/1.0 (price comparison)" }
    });
    if (!response.ok) throw new Error("Mercado Livre respondeu HTTP " + response.status);
    const payload = await response.json();
    products = (payload.results || []).map(normalizeMercadoLivre)
      .filter((p) => Number.isFinite(p.price) && p.price > 0 && p.url);
  } catch (error) {
    errors.push({ source: "Mercado Livre", message: error.message || "Falha na consulta." });
  }

  return res.status(200).json({
    query: q,
    total: products.length,
    products,
    sources: statuses,
    errors,
    note: "Somente ofertas retornadas por integrações ativas são exibidas. Outras lojas serão ativadas após habilitação das respectivas APIs."
  });
};
