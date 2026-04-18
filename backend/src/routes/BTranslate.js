// ========================================
// src/routes/BTranslate.js
// Endpoint de tradução via Google Cloud Translation API (ADC)
// ========================================

const { Router } = require("express");
const { verifyToken } = require("../middleware/BAuth");
const translate = require("../services/BTranslateService");

const router = Router();

/**
 * POST /api/translate
 * Body: { text, sourceLang, targetLang }
 * Qualquer usuário autenticado pode chamar.
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body || {};
    if (!text || !targetLang) {
      return res.status(400).json({ error: "Campos obrigatórios: text, targetLang" });
    }
    const result = await translate.translate({ text, sourceLang, targetLang });
    res.json(result);
  } catch (error) {
    const gErr = error?.errors?.[0] || error?.response?.data?.error;
    const reason = gErr?.reason || gErr?.status || "";
    const msg = gErr?.message || error.message;
    console.error("Erro ao traduzir:", msg, reason || "");
    res.status(error.code || 500).json({ error: msg, details: reason });
  }
});

module.exports = router;
