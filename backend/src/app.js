// ========================================
// src/app.js
// Ponto de entrada da API de pagamentos
// ========================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config/BConfig");

// Importa as rotas
const customersRoutes = require("./routes/BCustomers");
const paymentsRoutes = require("./routes/BPayments");
const webhooksRoutes = require("./routes/BWebhooks");

const app = express();

// ----------------------------------------
// MIDDLEWARES GLOBAIS
// ----------------------------------------

// Segurança: adiciona headers HTTP de proteção
app.use(helmet());

// CORS: permite apenas os domínios configurados
app.use(
  cors({
    origin: config.allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON no body dos requests
app.use(express.json());

// ----------------------------------------
// ROTAS
// ----------------------------------------

// Health check — Cloud Run usa isso para saber se o container está ok
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "egbe-fatogun-payments",
    environment: config.asaas.env,
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use("/api/customers", customersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/webhooks", webhooksRoutes);

// 404 — rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada` });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

// ----------------------------------------
// INICIALIZA O SERVIDOR
// ----------------------------------------

app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  Ẹgbẹ́ Fátọ́ún — API de Pagamentos        ║
  ║  Ambiente: ${config.asaas.env.padEnd(10)}                    ║
  ║  Porta: ${String(config.port).padEnd(10)}                       ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
