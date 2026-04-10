// ========================================
// src/middleware/auth.js
// Verifica o token JWT do Firebase Auth
// ========================================

const admin = require("firebase-admin");

// Inicializa o Firebase Admin SDK uma única vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

/**
 * Middleware que verifica se o request tem um token válido
 * do Firebase Auth no header Authorization.
 *
 * Uso: router.post("/rota", verifyToken, handler)
 *
 * Após a verificação, req.user contém os dados do usuário:
 * - req.user.uid (ID do Firebase)
 * - req.user.email
 * - req.user.role (perfil: sacerdote, tecnico, conselho, filho, cliente)
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token não fornecido. Envie no header: Authorization: Bearer <token>",
    });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Verifica e decodifica o token JWT do Firebase
    const decoded = await admin.auth().verifyIdToken(token);

    // Busca o perfil do usuário no Firestore
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: userDoc.exists ? userDoc.data().role : "cliente",
    };

    next();
  } catch (error) {
    console.error("Erro ao verificar token:", error.message);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

/**
 * Middleware que verifica se o usuário tem um dos perfis permitidos.
 *
 * Uso: router.post("/rota", verifyToken, requireRole("sacerdote", "tecnico"), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Perfis permitidos: ${roles.join(", ")}`,
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, db };
