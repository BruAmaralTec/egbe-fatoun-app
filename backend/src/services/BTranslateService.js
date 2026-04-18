// ========================================
// src/services/BTranslateService.js
// Roteia tradução entre providers:
//  - Yorùbá (src=yo ou tgt=yo): NLLB-200 via HuggingFace (preserva ẹ/ọ/ṣ)
//  - Outros pares: Google Cloud Translation v2 via ADC
// ========================================

const { v2 } = require("@google-cloud/translate");
const nllb = require("./BNllbService");

const googleClient = new v2.Translate();

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

async function translateViaGoogle({ text, sourceLang, targetLang }) {
  const options = { to: targetLang, format: "text" };
  if (sourceLang) options.from = sourceLang;

  const [translation, apiResponse] = await googleClient.translate(text, options);
  const detected = apiResponse?.data?.translations?.[0]?.detectedSourceLanguage;
  const normalized = decodeHtmlEntities(translation || "").normalize("NFC");

  return {
    translation: normalized,
    sourceLang: detected || sourceLang,
    targetLang,
    provider: "google",
  };
}

async function translate({ text, sourceLang, targetLang }) {
  const involvesYoruba = sourceLang === "yo" || targetLang === "yo";

  // Pra pares com Yorùbá, NLLB preserva grafia litúrgica (ẹ/ọ/ṣ + tons)
  if (involvesYoruba && process.env.HF_API_TOKEN) {
    try {
      return await nllb.translate({ text, sourceLang, targetLang });
    } catch (err) {
      // Fallback pro Google se NLLB falhar (cold start estourou timeout, 429, etc.)
      console.warn("NLLB falhou, usando Google:", err.message);
      const result = await translateViaGoogle({ text, sourceLang, targetLang });
      return { ...result, provider: "google-fallback" };
    }
  }

  return translateViaGoogle({ text, sourceLang, targetLang });
}

module.exports = { translate };
