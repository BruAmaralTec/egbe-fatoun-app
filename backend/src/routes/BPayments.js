// ========================================
// src/routes/payments.js
// Rotas para criar e consultar cobranças
// ========================================

const { Router } = require("express");
const asaas = require("../services/BAsaasService");
const { verifyToken, requireRole, db } = require("../middleware/BAuth");

const router = Router();

/**
 * POST /api/payments
 * Cria uma nova cobrança no Asaas.
 *
 * Body:
 * {
 *   billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED",
 *   value: 150.00,
 *   description: "Inscrição Festival Odún Ọ̀ṣun",
 *   eventId: "abc123" (opcional - ID do evento no Firestore),
 *   courseId: "xyz789" (opcional - ID do curso no Firestore),
 *   creditCard: { ... } (obrigatório se billingType = CREDIT_CARD)
 * }
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { billingType, value, description, eventId, courseId, creditCard } = req.body;

    // Validação
    if (!value || value <= 0) {
      return res.status(400).json({ error: "Valor deve ser maior que zero" });
    }

    // Busca o ID do cliente no Asaas a partir do Firestore
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const customerId = userDoc.data()?.asaasCustomerId;

    if (!customerId) {
      return res.status(400).json({
        error: "Usuário sem cadastro no Asaas. Chame POST /api/customers primeiro.",
      });
    }

    // Calcula data de vencimento (3 dias a partir de hoje)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Monta referência externa para rastrear no Firestore
    const externalRef = eventId
      ? `event:${eventId}`
      : courseId
        ? `course:${courseId}`
        : `user:${req.user.uid}`;

    // Cria a cobrança no Asaas
    const payment = await asaas.createPayment({
      customer: customerId,
      billingType: billingType || "UNDEFINED",
      value,
      dueDate: dueDateStr,
      description: description || "Pagamento Ẹgbẹ́ Fátọ́ún",
      externalReference: externalRef,
      creditCard,
    });

    // Monta resposta com dados de pagamento
    const result = {
      paymentId: payment.id,
      status: payment.status,
      value: payment.value,
      dueDate: payment.dueDate,
      billingType: payment.billingType,
      invoiceUrl: payment.invoiceUrl, // URL da fatura
      bankSlipUrl: payment.bankSlipUrl || null, // URL do boleto
    };

    // Se for Pix, busca o QR Code
    if (payment.billingType === "PIX") {
      const pixData = await asaas.getPixQrCode(payment.id);
      result.pixQrCode = {
        encodedImage: pixData.encodedImage, // Base64 da imagem QR
        payload: pixData.payload, // Código Pix copia-e-cola
        expirationDate: pixData.expirationDate,
      };
    }

    // Registra a cobrança no Firestore para tracking
    await db.collection("payments").doc(payment.id).set({
      asaasPaymentId: payment.id,
      userId: req.user.uid,
      eventId: eventId || null,
      courseId: courseId || null,
      value: payment.value,
      status: payment.status,
      billingType: payment.billingType,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "Cobrança criada com sucesso",
      payment: result,
    });
  } catch (error) {
    console.error("Erro ao criar cobrança:", error.response?.data || error.message);
    res.status(500).json({
      error: "Erro ao criar cobrança no Asaas",
      details: error.response?.data?.errors || error.message,
    });
  }
});

/**
 * GET /api/payments/:id
 * Consulta o status de uma cobrança.
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const payment = await asaas.getPayment(req.params.id);
    res.json(payment);
  } catch (error) {
    console.error("Erro ao consultar cobrança:", error.message);
    res.status(500).json({ error: "Erro ao consultar cobrança" });
  }
});

/**
 * GET /api/payments/:id/pix
 * Retorna o QR Code Pix de uma cobrança.
 */
router.get("/:id/pix", verifyToken, async (req, res) => {
  try {
    const pixData = await asaas.getPixQrCode(req.params.id);
    res.json(pixData);
  } catch (error) {
    console.error("Erro ao gerar Pix:", error.message);
    res.status(500).json({ error: "Erro ao gerar QR Code Pix" });
  }
});

/**
 * POST /api/payments/link
 * Cria um link de pagamento para eventos/cursos.
 * Apenas sacerdote e técnicos podem criar links.
 */
router.post(
  "/link",
  verifyToken,
  requireRole("sacerdote", "tecnico"),
  async (req, res) => {
    try {
      const { name, description, value, maxInstallments } = req.body;

      if (!name || !value) {
        return res.status(400).json({
          error: "Campos obrigatórios: name, value",
        });
      }

      const link = await asaas.createPaymentLink({
        name,
        description,
        value,
        billingType: "UNDEFINED", // Permite todos os métodos
        maxInstallmentCount: maxInstallments || 1,
        dueDateLimitDays: 10,
      });

      res.status(201).json({
        message: "Link de pagamento criado",
        paymentLink: {
          id: link.id,
          url: link.url,
          name: link.name,
          value: link.value,
        },
      });
    } catch (error) {
      console.error("Erro ao criar link:", error.response?.data || error.message);
      res.status(500).json({ error: "Erro ao criar link de pagamento" });
    }
  }
);

module.exports = router;
