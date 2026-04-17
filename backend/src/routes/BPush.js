// ========================================
// src/routes/BPush.js
// Envio de push notifications via Firebase Cloud Messaging
// ========================================

const { Router } = require("express");
const admin = require("firebase-admin");
const { verifyToken, requireRole, db } = require("../middleware/BAuth");

const router = Router();

/**
 * POST /api/push/notify
 * Body: { userIds: [uid...], title, body, link? }
 * Restrito a conselho+midias+admin (pessoal que cria notificações).
 */
router.post(
  "/notify",
  verifyToken,
  requireRole("tecnico", "sacerdote", "conselho", "midias"),
  async (req, res) => {
    try {
      const { userIds, title, body, link } = req.body || {};
      if (!Array.isArray(userIds) || userIds.length === 0 || !title) {
        return res.status(400).json({ error: "Campos obrigatórios: userIds[], title" });
      }

      // Coleta tokens de cada user
      const tokens = [];
      await Promise.all(userIds.map(async (uid) => {
        const snap = await db.collection("users").doc(uid).get();
        const t = snap.data()?.pushTokens;
        if (Array.isArray(t)) tokens.push(...t);
      }));

      if (tokens.length === 0) {
        return res.json({ sent: 0, reason: "Nenhum dispositivo registrado" });
      }

      const message = {
        notification: { title, body: body || "" },
        data: link ? { link: String(link) } : {},
        tokens,
      };

      const result = await admin.messaging().sendEachForMulticast(message);

      // Remove tokens inválidos
      const invalid = [];
      result.responses.forEach((resp, i) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-argument") {
            invalid.push(tokens[i]);
          }
        }
      });
      if (invalid.length > 0) {
        // melhor esforço — tira tokens inválidos de cada user doc
        await Promise.all(userIds.map(async (uid) => {
          const ref = db.collection("users").doc(uid);
          const snap = await ref.get();
          const current = snap.data()?.pushTokens || [];
          const kept = current.filter((t) => !invalid.includes(t));
          if (kept.length !== current.length) await ref.update({ pushTokens: kept });
        }));
      }

      res.json({ sent: result.successCount, failed: result.failureCount, cleaned: invalid.length });
    } catch (error) {
      console.error("Erro ao enviar push:", error.message);
      res.status(500).json({ error: "Erro ao enviar push", details: error.message });
    }
  }
);

module.exports = router;
