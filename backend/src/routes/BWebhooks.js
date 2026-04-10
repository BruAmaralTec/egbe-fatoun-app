// ========================================
// src/routes/webhooks.js
// Recebe webhooks do Asaas
// ========================================

const { Router } = require("express");
const config = require("../config/BConfig");
const { db } = require("../middleware/auth");

const router = Router();

/**
 * POST /api/webhooks/asaas
 *
 * O Asaas envia um POST para esta URL sempre que
 * o status de uma cobrança muda (ex: pagamento confirmado).
 *
 * IMPORTANTE: Esta rota NÃO usa verifyToken (Firebase)
 * porque quem chama é o Asaas, não o frontend.
 * A autenticação é feita pelo token do webhook.
 *
 * Configure no painel Asaas:
 * URL: https://sua-api.run.app/api/webhooks/asaas
 * Token: o mesmo valor de ASAAS_WEBHOOK_TOKEN no .env
 */
router.post("/asaas", async (req, res) => {
  try {
    // 1. Valida o token do webhook (segurança)
    const token = req.headers["asaas-access-token"];
    if (token !== config.asaas.webhookToken) {
      console.warn("Webhook com token inválido recebido");
      return res.status(401).json({ error: "Token inválido" });
    }

    const { event, payment } = req.body;

    console.log(`[Webhook] Evento: ${event}, Payment: ${payment?.id}`);

    // 2. Processa apenas eventos relevantes de pagamento
    if (!payment?.id) {
      return res.status(200).json({ received: true });
    }

    // Mapa de eventos do Asaas para status internos
    const statusMap = {
      PAYMENT_CONFIRMED: "confirmed",
      PAYMENT_RECEIVED: "received",
      PAYMENT_OVERDUE: "overdue",
      PAYMENT_REFUNDED: "refunded",
      PAYMENT_DELETED: "deleted",
      PAYMENT_CREATED: "created",
      PAYMENT_UPDATED: "updated",
    };

    const internalStatus = statusMap[event];

    if (!internalStatus) {
      // Evento não mapeado — aceita mas não processa
      return res.status(200).json({ received: true, processed: false });
    }

    // 3. Atualiza o status no Firestore
    const paymentRef = db.collection("payments").doc(payment.id);
    const paymentDoc = await paymentRef.get();

    if (paymentDoc.exists) {
      await paymentRef.update({
        status: internalStatus,
        asaasStatus: payment.status,
        updatedAt: new Date(),
        paidAt: internalStatus === "confirmed" || internalStatus === "received"
          ? new Date()
          : null,
      });

      // 4. Se pagamento confirmado, atualiza entidades vinculadas
      if (internalStatus === "confirmed" || internalStatus === "received") {
        const paymentData = paymentDoc.data();

        // Se é pagamento de um evento → marca inscrição como paga
        if (paymentData.eventId) {
          await db
            .collection("events")
            .doc(paymentData.eventId)
            .collection("registrations")
            .doc(paymentData.userId)
            .set(
              { paymentStatus: "paid", paidAt: new Date() },
              { merge: true }
            );

          console.log(
            `[Webhook] Inscrição paga: evento=${paymentData.eventId}, user=${paymentData.userId}`
          );
        }

        // Se é pagamento de um curso → libera acesso
        if (paymentData.courseId) {
          await db
            .collection("courses")
            .doc(paymentData.courseId)
            .collection("enrollments")
            .doc(paymentData.userId)
            .set(
              { paymentStatus: "paid", accessGranted: true, paidAt: new Date() },
              { merge: true }
            );

          console.log(
            `[Webhook] Matrícula paga: curso=${paymentData.courseId}, user=${paymentData.userId}`
          );
        }
      }
    } else {
      // Pagamento não encontrado no Firestore — registra mesmo assim
      console.warn(`[Webhook] Payment ${payment.id} não encontrado no Firestore`);
      await paymentRef.set({
        asaasPaymentId: payment.id,
        status: internalStatus,
        asaasStatus: payment.status,
        value: payment.value,
        createdAt: new Date(),
      });
    }

    // 5. Responde 200 para o Asaas não retentar
    res.status(200).json({ received: true, processed: true });
  } catch (error) {
    console.error("[Webhook] Erro ao processar:", error.message);
    // Responde 500 para o Asaas retentar depois
    res.status(500).json({ error: "Erro interno ao processar webhook" });
  }
});

module.exports = router;
