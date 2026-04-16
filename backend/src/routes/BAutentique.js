// ========================================
// src/routes/BAutentique.js
// Proxy da API Autentique — mantém o token no backend
// ========================================

const { Router } = require("express");
const { verifyToken, requireRole } = require("../middleware/BAuth");
const autentique = require("../services/BAutentiqueService");

const router = Router();

/**
 * POST /api/autentique/documents
 * Body: { name, pdfBase64, signers: [{name, email, action?}], folderId? }
 */
router.post(
  "/documents",
  verifyToken,
  requireRole("tecnico", "conselho", "sacerdote"),
  async (req, res) => {
    try {
      const { name, pdfBase64, signers, folderId } = req.body;

      if (!name || !pdfBase64 || !Array.isArray(signers) || signers.length === 0) {
        return res.status(400).json({ error: "Campos obrigatórios: name, pdfBase64, signers[]" });
      }

      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const doc = await autentique.createDocument({ name, pdfBuffer, signers, folderId });
      res.status(201).json({ document: doc });
    } catch (error) {
      console.error("Erro ao criar documento Autentique:", error.message);
      res.status(500).json({ error: "Erro ao criar documento", details: error.message });
    }
  }
);

/**
 * GET /api/autentique/documents/:id
 */
router.get(
  "/documents/:id",
  verifyToken,
  requireRole("tecnico", "conselho", "sacerdote"),
  async (req, res) => {
    try {
      const data = await autentique.getDocument(req.params.id);
      res.json(data);
    } catch (error) {
      console.error("Erro ao buscar documento Autentique:", error.message);
      res.status(500).json({ error: "Erro ao buscar documento", details: error.message });
    }
  }
);

module.exports = router;
