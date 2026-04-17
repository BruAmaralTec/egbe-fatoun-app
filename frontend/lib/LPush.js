// ========================================
// lib/LPush.js
// Helpers de push notifications (Firebase Cloud Messaging)
// ========================================

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import app, { db } from "./LFirebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

function firebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export async function pushSupported() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("Notification" in window)) return false;
  try { return await isSupported(); } catch { return false; }
}

export function pushPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission; // granted | denied | default
}

export async function registerDevice(userUid) {
  if (!userUid) throw new Error("Usuário não autenticado");
  if (!VAPID_KEY) throw new Error("NEXT_PUBLIC_FIREBASE_VAPID_KEY não configurada");

  const supported = await pushSupported();
  if (!supported) throw new Error("Push não suportado neste navegador");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permissão de notificação negada");

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  // passa a config do Firebase pro SW
  registration.active?.postMessage({ type: "FIREBASE_CONFIG", config: firebaseConfig() });

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) throw new Error("Não foi possível gerar token de push");

  await updateDoc(doc(db, "users", userUid), { pushTokens: arrayUnion(token) });
  return token;
}

export async function unregisterDevice(userUid, token) {
  if (!userUid || !token) return;
  await updateDoc(doc(db, "users", userUid), { pushTokens: arrayRemove(token) });
}
