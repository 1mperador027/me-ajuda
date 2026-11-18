const SOURCES = {
  mercadolivre: { name: "Mercado Livre", env: ["ML_ACCESS_TOKEN"], mode: "oauth_required" },
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
  const token = process.env.ML_ACCESS_TOKEN;
  if (!token) {
    return res.status(200).json({
      query: q, total: 0, products: [], sources: statuses, errors: [{
        source: "Mercado Livre",
        code: "ML_ACCESS_TOKEN_MISSING",
        message: "Configure ML_ACCESS_TOKEN nas variáveis de ambiente da Vercel."
      }],
      note: "A busca do Mercado Livre requer uma aplicação autorizada e um access token válido."
    });
  }

  try {
    const url = new URL("https://api.mercadolibre.com/sites/MLB/search");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "30");
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json", Authorization: "Bearer " + token }
    });
    const bodyText = await response.text();
    let payload;
    try { payload = JSON.parse(bodyText); } catch { payload = { message: bodyText.slice(0, 300) }; }

    if (!response.ok) {
      const requestId = response.headers.get("x-request-id") || response.headers.get("x-ml-request-id") || null;
      const detail = payload.message || payload.error || "A API recusou a requisição.";
      return res.status(200).json({
        query: q, total: 0, products: [], sources: statuses,
        errors: [{
          source: "Mercado Livre",
          code: payload.code || payload.error || "HTTP_" + response.status,
          httpStatus: response.status,
          requestId,
          message: response.status === 401
            ? "Token inválido ou expirado. Gere um novo access token."
            : response.status === 403
              ? "A API recusou o acesso (403). Verifique autorização da aplicação, permissões, status da conta e eventual restrição de IP/endpoint no DevCenter."
              : "Falha na API: " + detail
        }],
        note: "Nenhuma oferta foi simulada. Diagnóstico baseado na resposta oficial da API."
      });
    }

    const products = (payload.results || []).map(normalizeMercadoLivre)
      .filter((p) => Number.isFinite(p.price) && p.price > 0 && p.url);
    return res.status(200).json({
      query: q, total: products.length, products, sources: statuses, errors: [],
      note: "Resultados obtidos pela API do Mercado Livre. Preços e disponibilidade podem mudar."
    });
  } catch (error) {
    return res.status(200).json({
      query: q, total: 0, products: [], sources: statuses,
      errors: [{ source: "Mercado Livre", code: "NETWORK_ERROR", message: error.message || "Falha de conexão com a API." }]
    });
  }
};
