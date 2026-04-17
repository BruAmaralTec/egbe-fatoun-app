// ========================================
// src/services/BTranslateService.js
// Tradução via SerpAPI — engine google_translate
// https://serpapi.com/google-translate
// ========================================

const axios = require("axios");
const admin = require("firebase-admin");

async function getApiKey() {
  const snap = await admin.firestore().doc("settings/integrations").get();
  const key = snap.exists ? snap.data().serpapi?.apiKey : null;
  return key || process.env.SERPAPI_KEY || null;
}

async function translate({ text, sourceLang, targetLang }) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("SerpAPI key não configurada. Vá em Integrações e salve a API Key do SerpAPI.");

  const res = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google_translate",
      q: text,
      hl: "pt",
      sl: sourceLang || "auto",
      tl: targetLang,
      api_key: apiKey,
    },
    timeout: 20000,
  });

  const data = res.data;

  if (data.error) {
    throw new Error("SerpAPI: " + data.error);
  }

  // SerpAPI retorna em diferentes formatos dependendo da versão
  const translated =
    data.translation_results?.translation ||
    data.translation_results?.translated_text ||
    data.translation?.translated_text ||
    data.translation?.target_text ||
    null;

  if (!translated) {
    console.error("SerpAPI resposta inesperada:", JSON.stringify(data).slice(0, 500));
    throw new Error("SerpAPI não retornou tradução. Verifique se a key está ativa em serpapi.com/dashboard");
  }

  return {
    translation: translated,
    sourceLang: data.translation_results?.source_language || data.translation?.source_language || sourceLang,
    targetLang: data.translation_results?.target_language || data.translation?.target_language || targetLang,
  };
}

module.exports = { translate };
