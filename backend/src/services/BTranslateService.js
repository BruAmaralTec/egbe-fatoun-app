// ========================================
// src/services/BTranslateService.js
// Tradução via Google Cloud Translation API v2
// Usa ADC do Cloud Run (SA runtime) — sem API key
// ========================================

const { v2 } = require("@google-cloud/translate");

const client = new v2.Translate();

/**
 * Traduz texto via Google Cloud Translation API v2.
 * Códigos suportados: pt, es, en, fr, yo (Yorùbá), etc.
 */
async function translate({ text, sourceLang, targetLang }) {
  const options = { to: targetLang, format: "text" };
  if (sourceLang) options.from = sourceLang;

  const [translation, apiResponse] = await client.translate(text, options);
  const detected = apiResponse?.data?.translations?.[0]?.detectedSourceLanguage;

  return {
    translation,
    sourceLang: detected || sourceLang,
    targetLang,
  };
}

module.exports = { translate };
