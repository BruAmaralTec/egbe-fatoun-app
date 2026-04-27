// ========================================
// src/services/BNllbService.js
// Tradução Yorùbá via NLLB-200 (Meta) hospedado no HuggingFace Inference API
// Preserva grafia completa (ẹ/ọ/ṣ + tons). Usa HF_API_TOKEN.
// ========================================

const axios = require("axios");

const HF_MODEL = "facebook/nllb-200-distilled-1.3B";
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Map dos códigos curtos (pt/en/es/fr/yo) -> códigos flores-200 do NLLB
const NLLB_LANG = {
  pt: "por_Latn",
  en: "eng_Latn",
  es: "spa_Latn",
  fr: "fra_Latn",
  yo: "yor_Latn",
};

function toNllb(code) {
  return NLLB_LANG[code] || code;
}

async function translate({ text, sourceLang, targetLang }) {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error("HF_API_TOKEN não configurado");

  const srcLang = toNllb(sourceLang || "pt");
  const tgtLang = toNllb(targetLang);

  const body = {
    inputs: text,
    parameters: { src_lang: srcLang, tgt_lang: tgtLang },
    options: { wait_for_model: true }, // espera cold start em vez de falhar com 503
  };

  const res = await axios.post(HF_URL, body, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    timeout: 90000,
  });

  const data = res.data;
  const out = Array.isArray(data) ? data[0]?.translation_text : data?.translation_text;
  if (!out) {
    const err = new Error("NLLB não retornou tradução");
    err.response = { data };
    throw err;
  }

  return {
    translation: out.normalize("NFC"),
    sourceLang,
    targetLang,
    provider: "nllb",
  };
}

module.exports = { translate };
