// ========================================
// src/routes/BTranslate.js
// Endpoint de tradução via SerpAPI
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
    console.error("Erro ao traduzir:", error.message);
    res.status(500).json({ error: "Erro ao traduzir", details: error.message });
  }
});

module.exports = router;
