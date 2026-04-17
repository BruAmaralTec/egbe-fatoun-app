// ========================================
// src/services/BTranslateService.js
// Tradução via SerpAPI — engine google_translate
// ========================================

const axios = require("axios");
const admin = require("firebase-admin");

/**
 * Busca a API key do SerpAPI em settings/integrations (Firestore)
 * ou como fallback em process.env.SERPAPI_KEY.
 */
async function getApiKey() {
  const snap = await admin.firestore().doc("settings/integrations").get();
  const key = snap.exists ? snap.data().serpapi?.apiKey : null;
  return key || process.env.SERPAPI_KEY || null;
}

/**
 * Traduz texto via SerpAPI google_translate engine.
 * https://serpapi.com/google-translate
 */
async function translate({ text, sourceLang, targetLang }) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("SerpAPI key não configurada");

  const res = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google_translate",
      q: text,
      sl: sourceLang || "auto",
      tl: targetLang,
      api_key: apiKey,
    },
    timeout: 20000,
  });

  const data = res.data;
  const translation = data.translation?.translated_text
    || data.translation?.target
    || data.translations?.[0]?.translated_text
    || null;
  if (!translation) throw new Error("SerpAPI não retornou tradução");

  return {
    translation,
    sourceLang: data.translation?.source_language || sourceLang,
    targetLang: data.translation?.target_language || targetLang,
  };
}

module.exports = { translate };
