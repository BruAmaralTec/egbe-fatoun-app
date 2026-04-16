// ========================================
// src/services/BAutentiqueService.js
// Cliente da API GraphQL da Autentique
// Docs: https://docs.autentique.com.br/api
// ========================================

const axios = require("axios");
const FormData = require("form-data");
const admin = require("firebase-admin");

const SANDBOX_URL = "https://api.autentique.com.br/v2/graphql?sandbox=true";
const PROD_URL = "https://api.autentique.com.br/v2/graphql";

/**
 * Lê as credenciais da Autentique de settings/integrations (Firestore).
 */
async function getConfig() {
  const snap = await admin.firestore().doc("settings/integrations").get();
  if (!snap.exists) throw new Error("Integrações não configuradas");
  const cfg = snap.data().autentique;
  if (!cfg?.apiToken) throw new Error("Token da Autentique não configurado");
  return cfg;
}

function endpointFor(cfg) {
  return cfg.sandbox === "sandbox" ? SANDBOX_URL : PROD_URL;
}

/**
 * Query/mutation GraphQL sem upload de arquivo.
 */
async function graphql(query, variables = {}) {
  const cfg = await getConfig();
  const res = await axios.post(
    endpointFor(cfg),
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );
  if (res.data.errors) {
    throw new Error(res.data.errors[0]?.message || "Erro Autentique");
  }
  return res.data.data;
}

/**
 * Cria documento com upload de PDF via multipart (GraphQL upload spec).
 *
 * @param {object} opts
 * @param {string} opts.name
 * @param {Buffer} opts.pdfBuffer
 * @param {Array<{name:string,email:string,action?:string}>} opts.signers
 * @param {string} [opts.folderId]
 */
async function createDocument({ name, pdfBuffer, signers, folderId }) {
  const cfg = await getConfig();

  const mutation = `
    mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(document: $document, signers: $signers, file: $file) {
        id
        name
        created_at
        signatures { public_id name email action { name } }
      }
    }
  `;

  const operations = {
    query: mutation,
    variables: {
      document: { name, folder_id: folderId || null },
      signers: signers.map((s) => ({
        email: s.email,
        name: s.name,
        action: s.action || "SIGN",
      })),
      file: null,
    },
  };
  const map = { "0": ["variables.file"] };

  const form = new FormData();
  form.append("operations", JSON.stringify(operations));
  form.append("map", JSON.stringify(map));
  form.append("0", pdfBuffer, { filename: `${name}.pdf`, contentType: "application/pdf" });

  const res = await axios.post(endpointFor(cfg), form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${cfg.apiToken}`,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 60000,
  });

  if (res.data.errors) {
    throw new Error(res.data.errors[0]?.message || "Erro Autentique");
  }
  return res.data.data.createDocument;
}

async function getDocument(id) {
  return graphql(
    `query GetDocument($id: UUID!) {
       document(id: $id) {
         id name created_at
         signatures { public_id name email signed { created_at } rejected { created_at } }
       }
     }`,
    { id }
  );
}

module.exports = { createDocument, getDocument, graphql };
