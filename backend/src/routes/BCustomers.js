// ========================================
// src/routes/customers.js
// Rotas para gerenciar clientes no Asaas
// ========================================

const { Router } = require("express");
const asaas = require("../services/BAsaasService");
const { verifyToken, requireRole, db } = require("../middleware/BAuth");

const router = Router();

/**
 * POST /api/customers
 * Cria ou encontra um cliente no Asaas.
 *
 * Body: { name, cpfCnpj, email, phone }
 *
 * Fluxo:
 * 1. Verifica se já existe cliente com esse CPF no Asaas
 * 2. Se não existe, cria um novo
 * 3. Salva o ID do Asaas no Firestore do usuário
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, cpfCnpj, email, phone } = req.body;

    // Validação básica
    if (!name || !cpfCnpj) {
      return res.status(400).json({
        error: "Campos obrigatórios: name, cpfCnpj",
      });
    }

    // Busca ou cria no Asaas
    const customer = await asaas.findOrCreateCustomer({
      name,
      cpfCnpj: cpfCnpj.replace(/\D/g, ""), // Remove formatação
      email: email || req.user.email,
      phone,
      externalReference: req.user.uid, // Vincula ao Firebase UID
    });

    // Salva o ID do Asaas no perfil do Firestore
    await db.collection("users").doc(req.user.uid).set(
      { asaasCustomerId: customer.id },
      { merge: true }
    );

    res.status(201).json({
      message: "Cliente criado/encontrado com sucesso",
      customer: {
        id: customer.id,
        name: customer.name,
        cpfCnpj: customer.cpfCnpj,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error("Erro ao criar cliente:", error.response?.data || error.message);
    res.status(500).json({
      error: "Erro ao criar cliente no Asaas",
      details: error.response?.data?.errors || error.message,
    });
  }
});

/**
 * GET /api/customers/me
 * Retorna o cliente Asaas vinculado ao usuário logado.
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const asaasId = userDoc.data()?.asaasCustomerId;

    if (!asaasId) {
      return res.status(404).json({ error: "Usuário sem cadastro no Asaas" });
    }

    // Busca cobranças do cliente
    const payments = await asaas.listPayments({ customer: asaasId });

    res.json({
      asaasCustomerId: asaasId,
      payments: payments.data || [],
    });
  } catch (error) {
    console.error("Erro ao buscar cliente:", error.message);
    res.status(500).json({ error: "Erro ao buscar dados do cliente" });
  }
});

module.exports = router;
