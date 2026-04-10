// ========================================
// src/services/asaasService.js
// Cliente HTTP para a API REST do Asaas
// ========================================

const axios = require("axios");
const config = require("../config/BConfig");

// Cria uma instância do Axios já configurada
// com a URL base e o header de autenticação
const api = axios.create({
  baseURL: config.asaas.baseUrl,
  headers: {
    "Content-Type": "application/json",
    access_token: config.asaas.apiKey,
  },
  timeout: 15000, // 15 segundos
});

// ----------------------------------------
// CLIENTES
// O Asaas exige que toda cobrança tenha
// um cliente (customer) associado.
// ----------------------------------------

/**
 * Cria um novo cliente no Asaas.
 * Docs: POST /v3/customers
 *
 * @param {Object} data - Dados do cliente
 * @param {string} data.name - Nome completo
 * @param {string} data.cpfCnpj - CPF ou CNPJ (só números)
 * @param {string} [data.email] - Email
 * @param {string} [data.phone] - Telefone
 * @param {string} [data.externalReference] - ID do usuário no Firestore
 */
async function createCustomer(data) {
  const response = await api.post("/customers", {
    name: data.name,
    cpfCnpj: data.cpfCnpj,
    email: data.email || null,
    phone: data.phone || null,
    externalReference: data.externalReference || null,
  });
  return response.data;
}

/**
 * Busca cliente pelo CPF/CNPJ.
 * Docs: GET /v3/customers?cpfCnpj=xxxxx
 */
async function findCustomerByCpf(cpfCnpj) {
  const response = await api.get("/customers", {
    params: { cpfCnpj },
  });
  // Retorna o primeiro encontrado ou null
  return response.data.data?.[0] || null;
}

/**
 * Busca ou cria um cliente.
 * Evita duplicatas no Asaas verificando antes se já existe.
 */
async function findOrCreateCustomer(data) {
  const existing = await findCustomerByCpf(data.cpfCnpj);
  if (existing) return existing;
  return createCustomer(data);
}

// ----------------------------------------
// COBRANÇAS (PAYMENTS)
// Suporta Pix, Boleto e Cartão de Crédito
// ----------------------------------------

/**
 * Cria uma nova cobrança.
 * Docs: POST /v3/payments
 *
 * @param {Object} data
 * @param {string} data.customer - ID do cliente no Asaas (ex: "cus_xxx")
 * @param {string} data.billingType - "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED"
 * @param {number} data.value - Valor em reais (ex: 150.00)
 * @param {string} data.dueDate - Data de vencimento "YYYY-MM-DD"
 * @param {string} [data.description] - Descrição da cobrança
 * @param {string} [data.externalReference] - ID do evento/curso no Firestore
 */
async function createPayment(data) {
  const payload = {
    customer: data.customer,
    billingType: data.billingType || "UNDEFINED",
    value: data.value,
    dueDate: data.dueDate,
    description: data.description || null,
    externalReference: data.externalReference || null,
  };

  // Se for cartão de crédito, inclui dados do cartão
  if (data.billingType === "CREDIT_CARD" && data.creditCard) {
    payload.creditCard = {
      holderName: data.creditCard.holderName,
      number: data.creditCard.number,
      expiryMonth: data.creditCard.expiryMonth,
      expiryYear: data.creditCard.expiryYear,
      ccv: data.creditCard.ccv,
    };
    payload.creditCardHolderInfo = {
      name: data.creditCard.holderName,
      cpfCnpj: data.creditCard.cpfCnpj,
      email: data.creditCard.email,
      phone: data.creditCard.phone,
      postalCode: data.creditCard.postalCode,
      addressNumber: data.creditCard.addressNumber,
    };
  }

  const response = await api.post("/payments", payload);
  return response.data;
}

/**
 * Gera QR Code Pix para uma cobrança.
 * Docs: GET /v3/payments/{id}/pixQrCode
 */
async function getPixQrCode(paymentId) {
  const response = await api.get(`/payments/${paymentId}/pixQrCode`);
  return response.data;
}

/**
 * Consulta uma cobrança pelo ID.
 * Docs: GET /v3/payments/{id}
 */
async function getPayment(paymentId) {
  const response = await api.get(`/payments/${paymentId}`);
  return response.data;
}

/**
 * Lista cobranças com filtros.
 * Docs: GET /v3/payments
 */
async function listPayments(filters = {}) {
  const response = await api.get("/payments", { params: filters });
  return response.data;
}

// ----------------------------------------
// LINKS DE PAGAMENTO
// Útil para eventos e cursos — gera uma
// URL onde o cliente escolhe como pagar
// ----------------------------------------

/**
 * Cria um link de pagamento.
 * Docs: POST /v3/paymentLinks
 *
 * @param {Object} data
 * @param {string} data.name - Nome do produto/evento
 * @param {string} [data.description] - Descrição
 * @param {number} data.value - Valor
 * @param {string} [data.billingType] - "UNDEFINED" permite todos
 * @param {number} [data.dueDateLimitDays] - Dias para vencimento
 */
async function createPaymentLink(data) {
  const response = await api.post("/paymentLinks", {
    name: data.name,
    description: data.description || null,
    value: data.value,
    billingType: data.billingType || "UNDEFINED",
    chargeType: data.chargeType || "DETACHED",
    dueDateLimitDays: data.dueDateLimitDays || 10,
    maxInstallmentCount: data.maxInstallmentCount || 1,
  });
  return response.data;
}

module.exports = {
  createCustomer,
  findCustomerByCpf,
  findOrCreateCustomer,
  createPayment,
  getPixQrCode,
  getPayment,
  listPayments,
  createPaymentLink,
};
