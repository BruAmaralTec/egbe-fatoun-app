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

// Considera "tradução não funcionou" quando Google devolve o próprio texto
// (acontece em pares low-resource como yo↔pt — o sistema da API às vezes
// não acha rota e ecoa o input).
function googleEchoed(text, translation) {
  if (!translation) return true;
  return translation.trim().toLowerCase() === text.trim().toLowerCase();
}

async function translate({ text, sourceLang, targetLang }) {
  const involvesYoruba = sourceLang === "yo" || targetLang === "yo";
  let nllbError = null;

  // 1) NLLB pros pares com Yorùbá (preserva grafia litúrgica ẹ/ọ/ṣ + tons)
  if (involvesYoruba && process.env.HF_API_TOKEN) {
    try {
      const r = await nllb.translate({ text, sourceLang, targetLang });
      console.log(`[translate] NLLB ok (${sourceLang}→${targetLang}, ${text.length} chars)`);
      return r;
    } catch (err) {
      nllbError = err.message;
      console.warn(`[translate] NLLB falhou (${sourceLang}→${targetLang}):`, err.message);
    }
  }

  // 2) Google com source explícito
  let googleResult;
  try {
    googleResult = await translateViaGoogle({ text, sourceLang, targetLang });
  } catch (err) {
    console.error(`[translate] Google falhou (${sourceLang}→${targetLang}):`, err.message);
    if (nllbError) {
      const e = new Error(`Tradutor indisponível. NLLB: ${nllbError}. Google: ${err.message}`);
      e.code = 503;
      throw e;
    }
    throw err;
  }

  // 3) Se Google ecoou o input, tenta auto-detect (sem forçar source)
  //    — costuma destravar pares low-resource onde o forced source não acha rota
  if (googleEchoed(text, googleResult.translation)) {
    console.warn(`[translate] Google ecoou input (${sourceLang}→${targetLang}) — retry com auto-detect`);
    try {
      const autoResult = await translateViaGoogle({ text, targetLang });
      if (!googleEchoed(text, autoResult.translation)) {
        return { ...autoResult, provider: nllbError ? "google-auto-fallback" : "google-auto" };
      }
      console.warn(`[translate] Auto-detect também ecoou — devolvendo resultado original`);
    } catch (err) {
      console.warn(`[translate] Auto-detect falhou:`, err.message);
    }
  }

  return { ...googleResult, provider: nllbError ? "google-fallback" : "google" };
}

module.exports = { translate };
