// ========================================
// components/admin/FDeployAdmin.js
// [F = Frontend Component]
// Painel de Deploy & Configurações
// ========================================

// Todo o código do componente fica aqui.
// O arquivo page.js apenas importa e exporta.

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const ENV_GROUPS = [
  {
    label: "Firebase (Frontend)",
    description: "Configurações públicas do Firebase — usadas pelo Next.js",
    vars: [
      { key: "NEXT_PUBLIC_FIREBASE_API_KEY", label: "API Key", sensitive: false },
      { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", label: "Auth Domain", sensitive: false },
      { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", label: "Project ID", sensitive: false },
      { key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", label: "Storage Bucket", sensitive: false },
      { key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", label: "Messaging Sender ID", sensitive: false },
      { key: "NEXT_PUBLIC_FIREBASE_APP_ID", label: "App ID", sensitive: false },
    ],
  },
  {
    label: "API Cloud Run",
    description: "URL da API de pagamentos no Google Cloud Run",
    vars: [
      { key: "NEXT_PUBLIC_API_URL", label: "URL da API", sensitive: false, placeholder: "https://egbe-payments-xxx.a.run.app" },
    ],
  },
  {
    label: "Asaas (Backend)",
    description: "Credenciais do Asaas — usadas pela API no Cloud Run",
    vars: [
      { key: "ASAAS_ENV", label: "Ambiente", sensitive: false, placeholder: "sandbox ou production" },
      { key: "ASAAS_API_KEY", label: "Chave de API", sensitive: true },
      { key: "ASAAS_WEBHOOK_TOKEN", label: "Token do Webhook", sensitive: true },
    ],
  },
  {
    label: "Domínio e SEO",
    description: "Configurações do site público",
    vars: [
      { key: "SITE_URL", label: "URL do site", sensitive: false, placeholder: "https://egbefatoun.com.br" },
      { key: "SITE_NAME", label: "Nome do site", sensitive: false, placeholder: "Ẹgbẹ́ Fátọ́ún" },
      { key: "SITE_DESCRIPTION", label: "Descrição para SEO", sensitive: false },
    ],
  },
];

const DEPLOY_CHECKLIST = [
  { id: "firebase_project", label: "Projeto Firebase criado e configurado", category: "Firebase" },
  { id: "firebase_auth", label: "Firebase Auth habilitado (Email + Google)", category: "Firebase" },
  { id: "firestore_rules", label: "Firestore Security Rules aplicadas", category: "Firebase" },
  { id: "storage_rules", label: "Storage Security Rules aplicadas", category: "Firebase" },
  { id: "vercel_project", label: "Projeto Vercel criado e linkado ao GitHub", category: "Vercel" },
  { id: "vercel_env", label: "Variáveis de ambiente configuradas na Vercel", category: "Vercel" },
  { id: "vercel_domain", label: "Domínio customizado configurado", category: "Vercel" },
  { id: "cloudrun_deploy", label: "API de pagamentos deployada no Cloud Run", category: "Cloud Run" },
  { id: "cloudrun_env", label: "Variáveis de ambiente no Cloud Run", category: "Cloud Run" },
  { id: "asaas_sandbox", label: "Conta sandbox Asaas criada e testada", category: "Asaas" },
  { id: "asaas_webhook", label: "Webhook configurado no painel Asaas", category: "Asaas" },
  { id: "asaas_production", label: "Migrado para ambiente de produção", category: "Asaas" },
];

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function getUserRole() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role; }
    function isAdmin() { return getUserRole() in ['sacerdote', 'tecnico']; }
    function isConselho() { return getUserRole() in ['sacerdote', 'tecnico', 'conselho']; }

    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isConselho());
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }
    match /events/{eventId} {
      allow read: if resource.data.visibility == 'public' || (isAuthenticated() && resource.data.visibility == 'members') || isAdmin();
      allow create, update, delete: if isAdmin();
      match /registrations/{userId} {
        allow read: if isAuthenticated() && (request.auth.uid == userId || isConselho());
        allow create: if isAuthenticated() && request.auth.uid == userId;
        allow update: if isAdmin();
      }
    }
    match /courses/{courseId} {
      allow read: if resource.data.visibility == 'public' || (isAuthenticated() && resource.data.visibility == 'members') || isAdmin();
      allow create, update, delete: if isAdmin();
      match /enrollments/{userId} {
        allow read: if isAuthenticated() && (request.auth.uid == userId || isConselho());
        allow create: if isAuthenticated() && request.auth.uid == userId;
        allow update: if isAdmin();
      }
    }
    match /payments/{paymentId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAdmin();
    }
    match /settings/{document} {
      allow read, write: if isAdmin();
    }
  }
}`;

const STORAGE_RULES = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /library/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['sacerdote', 'tecnico'];
    }
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['sacerdote', 'tecnico'];
    }
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['sacerdote', 'tecnico'];
    }
  }
}`;

export default function FDeployAdmin() {
  const { profile, isAdmin } = useAuth();
  const router = useRouter();

  const [envVars, setEnvVars] = useState({});
  const [checklist, setChecklist] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("env");
  const [showSensitive, setShowSensitive] = useState({});
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (profile && !isAdmin) router.push("/dashboard");
  }, [profile, isAdmin, router]);

  useEffect(() => {
    async function load() {
      const envDoc = await getDoc(doc(db, "settings", "envVars"));
      if (envDoc.exists()) setEnvVars(envDoc.data());
      const checkDoc = await getDoc(doc(db, "settings", "deployChecklist"));
      if (checkDoc.exists()) setChecklist(checkDoc.data());
    }
    load();
  }, []);

  async function saveEnvVars() {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "envVars"), { ...envVars, updatedAt: new Date().toISOString() });
      setLastSaved(new Date());
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCheck(id) {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    await setDoc(doc(db, "settings", "deployChecklist"), updated);
  }

  function downloadEnv(target) {
    let content = `# Ẹgbẹ́ Fátọ́ún — ${target === "frontend" ? "Frontend (.env.local)" : "Backend (.env)"}\n# Gerado em: ${new Date().toLocaleString("pt-BR")}\n\n`;
    const groups = target === "frontend"
      ? ENV_GROUPS.filter((g) => g.vars.some((v) => v.key.startsWith("NEXT_PUBLIC_") || v.key.startsWith("SITE_")))
      : ENV_GROUPS.filter((g) => g.vars.some((v) => v.key.startsWith("ASAAS_")));
    groups.forEach((group) => {
      content += `# ${group.label}\n`;
      group.vars.forEach((v) => { content += `${v.key}=${envVars[v.key] || ""}\n`; });
      content += "\n";
    });
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = target === "frontend" ? ".env.local" : ".env";
    a.click();
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  const completedCount = Object.values(checklist).filter(Boolean).length;

  if (!isAdmin) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Deploy & Configurações</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Gerencie variáveis, checklist e comandos — tudo pela interface.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "0.8rem", color: "#888" }}>Progresso do deploy</p>
          <p style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 600, color: completedCount === DEPLOY_CHECKLIST.length ? "var(--egbe-green)" : "var(--egbe-yellow)" }}>
            {completedCount}/{DEPLOY_CHECKLIST.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "env", label: "Variáveis de Ambiente" },
          { id: "checklist", label: `Checklist (${completedCount}/${DEPLOY_CHECKLIST.length})` },
          { id: "commands", label: "Comandos de Deploy" },
          { id: "rules", label: "Firestore Rules" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1.5px solid",
            borderColor: tab === t.id ? "var(--egbe-green)" : "#e5e7eb",
            background: tab === t.id ? "var(--egbe-green)" : "white",
            color: tab === t.id ? "white" : "#666", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* TAB: ENV */}
      {tab === "env" && (
        <div>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button className="btn btn-secondary" onClick={() => downloadEnv("frontend")} style={{ fontSize: "0.82rem" }}>⬇ .env.local (frontend)</button>
            <button className="btn btn-secondary" onClick={() => downloadEnv("backend")} style={{ fontSize: "0.82rem" }}>⬇ .env (backend)</button>
            <button className="btn btn-primary" onClick={saveEnvVars} disabled={saving} style={{ fontSize: "0.82rem", marginLeft: "auto" }}>{saving ? "Salvando..." : "Salvar tudo"}</button>
          </div>
          {lastSaved && <p style={{ color: "var(--egbe-green)", fontSize: "0.8rem", marginBottom: "1rem" }}>✅ Salvo em {lastSaved.toLocaleTimeString("pt-BR")}</p>}
          {ENV_GROUPS.map((group) => (
            <div key={group.label} className="card" style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.2rem" }}>{group.label}</h3>
              <p style={{ color: "#888", fontSize: "0.82rem", marginBottom: "1rem" }}>{group.description}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {group.vars.map((v) => (
                  <div key={v.key} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <label className="label" style={{ margin: 0 }}>{v.label}</label>
                      <code style={{ fontSize: "0.7rem", color: "#888" }}>{v.key}</code>
                    </div>
                    <div style={{ flex: 1, display: "flex", gap: "0.4rem" }}>
                      <input className="input-field" type={v.sensitive && !showSensitive[v.key] ? "password" : "text"} value={envVars[v.key] || ""} onChange={(e) => setEnvVars({ ...envVars, [v.key]: e.target.value })} placeholder={v.placeholder || ""} />
                      {v.sensitive && (
                        <button onClick={() => setShowSensitive({ ...showSensitive, [v.key]: !showSensitive[v.key] })} style={{ padding: "0.4rem 0.6rem", background: "none", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                          {showSensitive[v.key] ? "🙈" : "👁"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: CHECKLIST */}
      {tab === "checklist" && (
        <div>
          <div style={{ background: "#e5e7eb", borderRadius: "8px", height: "8px", marginBottom: "1.5rem", overflow: "hidden" }}>
            <div style={{ width: `${(completedCount / DEPLOY_CHECKLIST.length) * 100}%`, height: "100%", background: completedCount === DEPLOY_CHECKLIST.length ? "var(--egbe-green)" : "var(--egbe-yellow)", borderRadius: "8px", transition: "width 0.3s" }} />
          </div>
          {["Firebase", "Vercel", "Cloud Run", "Asaas"].map((cat) => (
            <div key={cat} className="card" style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>{cat}</h3>
              {DEPLOY_CHECKLIST.filter((item) => item.category === cat).map((item) => (
                <label key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!checklist[item.id]} onChange={() => toggleCheck(item.id)} style={{ width: "18px", height: "18px", accentColor: "var(--egbe-green)" }} />
                  <span style={{ fontSize: "0.9rem", textDecoration: checklist[item.id] ? "line-through" : "none", color: checklist[item.id] ? "#888" : "var(--egbe-black)" }}>{item.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* TAB: COMMANDS */}
      {tab === "commands" && (
        <div>
          {[
            { title: "1. Configurar Firebase", commands: `# Instalar Firebase CLI\nnpm install -g firebase-tools\nfirebase login\nfirebase init\n# Selecionar: Firestore, Storage, Authentication` },
            { title: "2. Deploy Frontend na Vercel", commands: `cd egbe-web\nnpm install -g vercel\nvercel\n# Configurar variáveis:\nvercel env add NEXT_PUBLIC_FIREBASE_API_KEY\nvercel env add NEXT_PUBLIC_API_URL\n# Deploy produção:\nvercel --prod` },
            { title: "3. Deploy API no Cloud Run", commands: `cd api-payments\ngcloud run deploy egbe-payments \\\n  --source . \\\n  --region southamerica-east1 \\\n  --allow-unauthenticated \\\n  --set-env-vars "ASAAS_ENV=${envVars.ASAAS_ENV || "sandbox"}"` },
            { title: "4. Webhook no Asaas", commands: `# Painel Asaas > Integrações > Webhooks\n# URL: ${envVars.NEXT_PUBLIC_API_URL || "https://..."}/api/webhooks/asaas\n# Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED` },
          ].map((block) => (
            <div key={block.title} className="card" style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1.05rem" }}>{block.title}</h3>
                <button onClick={() => copyToClipboard(block.commands)} style={{ padding: "0.3rem 0.7rem", background: "none", border: "1.5px solid #e5e7eb", borderRadius: "4px", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600, color: "#666" }}>Copiar</button>
              </div>
              <pre style={{ background: "#1a1a1a", color: "#e5e7eb", padding: "1rem", borderRadius: "8px", fontSize: "0.8rem", lineHeight: 1.6, overflowX: "auto", fontFamily: "monospace" }}>{block.commands}</pre>
            </div>
          ))}
        </div>
      )}

      {/* TAB: RULES */}
      {tab === "rules" && (
        <div>
          {[
            { title: "Firestore Security Rules", content: FIRESTORE_RULES },
            { title: "Storage Security Rules", content: STORAGE_RULES },
          ].map((r) => (
            <div key={r.title} className="card" style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1.05rem" }}>{r.title}</h3>
                <button onClick={() => copyToClipboard(r.content)} style={{ padding: "0.3rem 0.7rem", background: "none", border: "1.5px solid #e5e7eb", borderRadius: "4px", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600, color: "#666" }}>Copiar</button>
              </div>
              <pre style={{ background: "#1a1a1a", color: "#e5e7eb", padding: "1rem", borderRadius: "8px", fontSize: "0.78rem", lineHeight: 1.5, overflowX: "auto", fontFamily: "monospace", maxHeight: "400px", overflowY: "auto" }}>{r.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
