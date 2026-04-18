// ========================================
// src/services/BTranslateService.js
// Tradução via Google Cloud Translation API v2
// Usa ADC do Cloud Run (SA runtime) — sem API key
// ========================================

const { v2 } = require("@google-cloud/translate");

const client = new v2.Translate();

// Decode básico de entidades HTML que a API às vezes devolve mesmo com format=text
function decodeHtmlEntities(s) {
  if (!s) return s;
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Traduz texto via Google Cloud Translation API v2.
 * Códigos suportados: pt, es, en, fr, yo (Yorùbá), etc.
 */
async function translate({ text, sourceLang, targetLang }) {
  const options = { to: targetLang, format: "text" };
  if (sourceLang) options.from = sourceLang;

  const [translation, apiResponse] = await client.translate(text, options);
  const detected = apiResponse?.data?.translations?.[0]?.detectedSourceLanguage;

  // Normaliza NFC para garantir que diacríticos (yorùbá: tons + sub-dots) apareçam
  // como um único grafema em vez de base+combining marks separados.
  const normalized = decodeHtmlEntities(translation || "").normalize("NFC");

  return {
    translation: normalized,
    sourceLang: detected || sourceLang,
    targetLang,
  };
}

module.exports = { translate };
