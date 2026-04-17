// ========================================
// src/services/BTranslateService.js
// Tradução via Google Cloud Translation API v2
// Usa as credenciais do Cloud Run (ADC) — sem API key extra
// ========================================

const axios = require("axios");
const admin = require("firebase-admin");

/**
 * Obtém access token do service account do Cloud Run.
 */
async function getAccessToken() {
  const credential = admin.app().options.credential;
  const token = await credential.getAccessToken();
  return token.access_token;
}

/**
 * Traduz texto via Google Cloud Translation API v2.
 * Docs: https://cloud.google.com/translate/docs/reference/rest/v2/translations/translate
 *
 * Códigos suportados: pt, es, en, fr, yo (Yorùbá), etc.
 */
async function translate({ text, sourceLang, targetLang }) {
  const token = await getAccessToken();

  const res = await axios.post(
    "https://translation.googleapis.com/language/translate/v2",
    {
      q: text,
      source: sourceLang || "",
      target: targetLang,
      format: "text",
    },
    {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 15000,
    }
  );

  const translations = res.data?.data?.translations;
  if (!translations || translations.length === 0) {
    throw new Error("Google Translate não retornou resultado");
  }

  return {
    translation: translations[0].translatedText,
    sourceLang: translations[0].detectedSourceLanguage || sourceLang,
    targetLang,
  };
}

module.exports = { translate };
