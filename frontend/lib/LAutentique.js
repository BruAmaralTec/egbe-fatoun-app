// ========================================
// lib/LAutentique.js
// Cliente GraphQL da Autentique
// Docs: https://docs.autentique.com.br/api
// ========================================

import { doc, getDoc } from "firebase/firestore";
import { db } from "./LFirebase";

async function getConfig() {
  const snap = await getDoc(doc(db, "settings", "integrations"));
  if (!snap.exists()) throw new Error("Integrações não configuradas");
  const cfg = snap.data().autentique;
  if (!cfg?.apiToken) throw new Error("Token da Autentique não configurado");
  return cfg;
}

function endpointFor(cfg) {
  return cfg.sandbox === "sandbox"
    ? "https://api.autentique.com.br/v2/graphql?sandbox=true"
    : "https://api.autentique.com.br/v2/graphql";
}

/**
 * Faz uma chamada genérica à API GraphQL da Autentique.
 * Em produção, execute no backend (servidor) — expor o token
 * no browser é risco.
 */
export async function autentiqueQuery(query, variables = {}) {
  const cfg = await getConfig();
  const res = await fetch(endpointFor(cfg), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0]?.message || "Erro Autentique");
  return data.data;
}

/**
 * Cria um documento na Autentique a partir de um PDF base64.
 * @param {object} opts
 * @param {string} opts.name - Nome do documento
 * @param {string} opts.pdfBase64 - PDF em base64
 * @param {Array<{name: string, email: string, action?: string}>} opts.signers
 * @param {string} [opts.folderId]
 */
export async function createAutentiqueDocument({ name, pdfBase64, signers, folderId }) {
  const mutation = `
    mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(document: $document, signers: $signers, file: $file) {
        id
        name
        signatures { public_id name email action { name } }
      }
    }
  `;
  const variables = {
    document: { name, folder_id: folderId || null },
    signers: signers.map((s) => ({ email: s.email, name: s.name, action: s.action || "SIGN" })),
    file: null, // multipart upload precisa ser feito via FormData
  };
  // NOTA: upload de arquivo via GraphQL usa multipart; implementação
  // completa exige FormData com operations/map/0. Deixar em TODO até
  // termos backend dedicado — por ora retornamos o payload pronto.
  return { mutation, variables, pdfBase64 };
}

/**
 * Consulta o status de um documento pelo ID.
 */
export async function getAutentiqueDocument(id) {
  const query = `
    query GetDocument($id: UUID!) {
      document(id: $id) {
        id name created_at
        signatures { public_id name email signed { created_at } rejected { created_at } }
      }
    }
  `;
  return autentiqueQuery(query, { id });
}
