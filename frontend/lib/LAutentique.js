// ========================================
// lib/LAutentique.js
// Cliente do proxy backend da Autentique
// (o token real fica só no Cloud Run, nunca no browser)
// ========================================

import api from "./LApi";

/**
 * Cria documento na Autentique com PDF via backend.
 * @param {object} opts
 * @param {string} opts.name
 * @param {string} opts.pdfBase64 - PDF em base64 (sem prefixo data:)
 * @param {Array<{name:string,email:string,action?:string}>} opts.signers
 * @param {string} [opts.folderId]
 */
export async function createAutentiqueDocument({ name, pdfBase64, signers, folderId }) {
  const res = await api.post("/api/autentique/documents", { name, pdfBase64, signers, folderId });
  return res.data.document;
}

/**
 * Consulta o status de um documento pelo ID.
 */
export async function getAutentiqueDocument(id) {
  const res = await api.get(`/api/autentique/documents/${id}`);
  return res.data;
}
