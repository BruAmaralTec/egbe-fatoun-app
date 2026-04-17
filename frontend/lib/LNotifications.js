// ========================================
// lib/LNotifications.js
// Helpers para criar notificações no Firestore
// ========================================

import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "./LFirebase";
import { sendPush } from "./LApi";

/**
 * Cria uma notificação no Firestore.
 * @param {object} opts
 * @param {string} opts.userId - UID do destinatário
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} opts.category - ritual | payment | event | course | system
 * @param {string} [opts.link] - rota opcional para clicar
 */
export async function createNotification({ userId, title, message, category = "system", link = null, groupId = null, dispatchId = null, requiresConfirmation = false }) {
  return addDoc(collection(db, "notifications"), {
    userId, title, message, category, link,
    groupId, dispatchId, requiresConfirmation,
    read: false,
    confirmedAt: null,
    createdAt: serverTimestamp(),
  });
}

/**
 * Envia a mesma notificação para múltiplos usuários.
 * @param {string[]} userIds
 */
export async function notifyUsers(userIds, data) {
  await Promise.all(userIds.map((userId) => createNotification({ ...data, userId })));
  // Dispara push em paralelo (best-effort — não bloqueia se falhar)
  try {
    await sendPush({ userIds, title: data.title, body: data.message, link: data.link });
  } catch (err) {
    console.warn("Push não enviado:", err.message);
  }
}

/**
 * Envia notificação para todos os usuários de um ou mais perfis.
 * @param {string[]} roles - ex: ["cliente", "filho"]
 */
export async function notifyByRoles(roles, data) {
  const snap = await getDocs(query(collection(db, "users"), where("role", "in", roles)));
  const userIds = snap.docs.map((d) => d.id);
  return notifyUsers(userIds, data);
}

/**
 * Envia notificação para TODOS os usuários do sistema.
 */
export async function notifyAll(data) {
  const snap = await getDocs(collection(db, "users"));
  const userIds = snap.docs.map((d) => d.id);
  return notifyUsers(userIds, data);
}
