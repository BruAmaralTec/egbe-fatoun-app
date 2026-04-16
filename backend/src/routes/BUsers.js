// ========================================
// src/routes/BUsers.js
// Rotas administrativas para gerenciar usuários
// ========================================

const { Router } = require("express");
const admin = require("firebase-admin");
const { verifyToken, requireRole, db } = require("../middleware/BAuth");

const router = Router();

/**
 * DELETE /api/users/:uid
 * Remove o usuário do Firebase Auth e do Firestore.
 * Permitido apenas para tecnico e conselho.
 */
router.delete("/:uid", verifyToken, requireRole("tecnico", "conselho"), async (req, res) => {
  const { uid } = req.params;

  if (uid === req.user.uid) {
    return res.status(400).json({ error: "Você não pode remover seu próprio usuário" });
  }

  try {
    try {
      await admin.auth().deleteUser(uid);
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }

    await db.collection("users").doc(uid).delete();

    res.json({ message: "Usuário removido com sucesso", uid });
  } catch (error) {
    console.error("Erro ao remover usuário:", error.message);
    res.status(500).json({ error: "Erro ao remover usuário", details: error.message });
  }
});

module.exports = router;
