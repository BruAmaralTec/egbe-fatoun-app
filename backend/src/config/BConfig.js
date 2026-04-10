// ========================================
// src/config/index.js
// Configurações centralizadas do serviço
// ========================================

require("dotenv").config();

const config = {
  // Asaas
  asaas: {
    // Sandbox para testes, production para o ambiente real
    env: process.env.ASAAS_ENV || "sandbox",
    apiKey: process.env.ASAAS_API_KEY,
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN,
    // URL muda conforme o ambiente
    get baseUrl() {
      return this.env === "production"
        ? "https://api.asaas.com/v3"
        : "https://api-sandbox.asaas.com/v3";
    },
  },

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
  },

  // Servidor
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),
};

module.exports = config;
