// ========================================
// lib/api.js
// Cliente HTTP para a API no Cloud Run
// ========================================

import axios from "axios";
import { auth } from "./LFirebase";

// URL da API — muda conforme ambiente
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Interceptor: adiciona o token Firebase em toda requisição
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----------------------------------------
// CLIENTES
// ----------------------------------------

export async function createCustomer(data) {
  const res = await api.post("/api/customers", data);
  return res.data;
}

export async function getMyPayments() {
  const res = await api.get("/api/customers/me");
  return res.data;
}

// ----------------------------------------
// PAGAMENTOS
// ----------------------------------------

export async function createPayment(data) {
  const res = await api.post("/api/payments", data);
  return res.data;
}

export async function getPayment(id) {
  const res = await api.get(`/api/payments/${id}`);
  return res.data;
}

export async function getPixQrCode(id) {
  const res = await api.get(`/api/payments/${id}/pix`);
  return res.data;
}

export async function createPaymentLink(data) {
  const res = await api.post("/api/payments/link", data);
  return res.data;
}

export default api;
