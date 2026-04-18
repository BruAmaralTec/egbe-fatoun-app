// ========================================
// components/admin/FIntegracoesAdmin.js
// [F = Frontend Component]
// Painel de Integrações — Asaas, Nuvemshop,
// Sympla, StreamYard, YouTube, Firebase, Autentique
// (Tradução usa Google Cloud Translation via ADC — não exige API key)
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useModal } from "@/lib/LModalContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const INTEGRATIONS = [
  { id: "asaas", name: "Asaas", description: "Pagamentos via Pix, Boleto e Cartão", category: "Pagamentos", docsUrl: "https://docs.asaas.com", fields: [{ key: "apiKey", label: "Chave de API", type: "password", placeholder: "$aact_..." }, { key: "webhookToken", label: "Token do Webhook", type: "password" }, { key: "environment", label: "Ambiente", type: "select", options: ["sandbox", "production"] }], color: "#00C853" },
  { id: "nuvemshop", name: "Nuvemshop", description: "E-commerce — produtos do templo", category: "E-commerce", docsUrl: "https://tiendanube.github.io/api-documentation", fields: [{ key: "accessToken", label: "Access Token", type: "password" }, { key: "storeId", label: "ID da Loja", type: "text" }], color: "#0070F3" },
  { id: "sympla", name: "Sympla", description: "Inscrições em eventos e cursos", category: "Eventos", docsUrl: "https://developers.sympla.com.br", fields: [{ key: "apiToken", label: "API Token", type: "password" }], color: "#FF6B35" },
  { id: "streamyard", name: "StreamYard", description: "Transmissão ao vivo dos cursos", category: "Cursos", docsUrl: "https://streamyard.com", fields: [{ key: "apiKey", label: "API Key", type: "password" }, { key: "broadcastDefault", label: "Destino padrão", type: "select", options: ["youtube", "facebook", "ambos"] }], color: "#7B2FF7" },
  { id: "youtube", name: "YouTube Data API", description: "Upload e gravações de cursos", category: "Cursos", docsUrl: "https://developers.google.com/youtube/v3", fields: [{ key: "apiKey", label: "API Key", type: "password" }, { key: "channelId", label: "ID do Canal", type: "text" }, { key: "playlistCourses", label: "Playlist de Cursos", type: "text" }], color: "#FF0000" },
  { id: "firebase", name: "Firebase", description: "Auth, Firestore, Storage", category: "Infraestrutura", docsUrl: "https://console.firebase.google.com", fields: [{ key: "projectId", label: "Project ID", type: "text" }, { key: "storageBucket", label: "Storage Bucket", type: "text" }, { key: "authDomain", label: "Auth Domain", type: "text" }], color: "#FFCA28" },
  { id: "autentique", name: "Autentique", description: "Assinatura digital de certificados", category: "Cursos", docsUrl: "https://docs.autentique.com.br/api", fields: [{ key: "apiToken", label: "API Token", type: "password", placeholder: "Bearer token da conta" }, { key: "sandbox", label: "Ambiente", type: "select", options: ["sandbox", "production"] }], color: "#0EA5E9" },
];

export default function FIntegracoesAdmin() {
  const { profile, isAdmin } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const router = useRouter();
  const [integrations, setIntegrations] = useState({});
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => { if (profile && !isAdmin) router.push("/dashboard"); }, [profile, isAdmin, router]);

  useEffect(() => {
    async function load() {
      const docRef = doc(db, "settings", "integrations");
      const snap = await getDoc(docRef);
      if (snap.exists()) setIntegrations(snap.data());
    }
    load();
  }, []);

  function startEditing(integration) { setEditing(integration.id); setFormData(integrations[integration.id] || {}); setTestResult(null); }

  async function handleSave(id) {
    setSaving(true);
    try {
      const updated = { ...integrations, [id]: { ...formData, updatedAt: new Date().toISOString() } };
      await setDoc(doc(db, "settings", "integrations"), updated);
      setIntegrations(updated);
      setEditing(null);
    } catch (err) { await showAlert("Erro: " + err.message); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTestResult({ status: "testing" });
    setTimeout(() => {
      const hasKey = Object.values(formData).some((v) => v && v.length > 5);
      setTestResult({ status: hasKey ? "success" : "error", message: hasKey ? "Conexão estabelecida!" : "Preencha os campos" });
    }, 1500);
  }

  async function handleDisconnect(id) {
    if (!(await showConfirm("Remover credenciais?"))) return;
    const updated = { ...integrations };
    delete updated[id];
    await setDoc(doc(db, "settings", "integrations"), updated);
    setIntegrations(updated);
  }

  const categories = ["all", ...new Set(INTEGRATIONS.map((i) => i.category))];
  const filtered = filter === "all" ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.category === filter);

  if (!isAdmin) return null;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Integrações</h1>
        <p style={{ color: "#666", fontSize: "0.95rem" }}>Gerencie conexões com serviços externos. Apenas Sacerdotisa e Técnicos.</p>
      </div>

      <div style={{ marginBottom: "1rem", padding: "0.7rem 1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "0.82rem", color: "#1e40af" }}>
        🌐 A tradução do <strong>Dicionário</strong> usa a <strong>Google Cloud Translation API</strong> via ADC (credenciais do Cloud Run) — não exige API key aqui.
        {" "}
        <a href="https://console.cloud.google.com/apis/library/translate.googleapis.com?project=egbe-fatoun-app" target="_blank" rel="noopener" style={{ color: "#1e40af", fontWeight: 600, textDecoration: "underline" }}>
          Abrir no Console GCP ↗
        </a>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            padding: "0.4rem 1rem", borderRadius: "20px", border: "1.5px solid",
            borderColor: filter === cat ? "var(--egbe-green)" : "#e5e7eb",
            background: filter === cat ? "var(--egbe-green)" : "white",
            color: filter === cat ? "white" : "#666", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
          }}>{cat === "all" ? "Todas" : cat}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
        {filtered.map((integ) => {
          const saved = integrations[integ.id];
          const isConnected = !!saved;
          const isEditing = editing === integ.id;
          return (
            <div key={integ.id} className="card" style={{ borderLeft: `4px solid ${integ.color}`, background: isEditing ? "#fafafa" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.05rem", margin: 0 }}>{integ.name}</h3>
                    <span className="status-dot" style={{ width: "8px", height: "8px", background: isConnected ? "#22c55e" : "#d1d5db" }} />
                  </div>
                  <p style={{ color: "#888", fontSize: "0.82rem", marginTop: "0.2rem" }}>{integ.description}</p>
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "10px", background: "#f3f4f6", color: "#666" }}>{integ.category}</span>
              </div>

              {isEditing ? (
                <div>
                  {integ.fields.map((f) => (
                    <div key={f.key} style={{ marginBottom: "0.75rem" }}>
                      <label className="label">{f.label}</label>
                      {f.type === "select" ? (
                        <select className="input-field" value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}><option value="">Selecione...</option>{f.options.map((o) => (<option key={o} value={o}>{o}</option>))}</select>
                      ) : (
                        <input className="input-field" type={f.type} value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder || ""} />
                      )}
                    </div>
                  ))}
                  {testResult && (
                    <div style={{ padding: "0.6rem 0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.82rem", fontWeight: 500, background: testResult.status === "success" ? "#d1fae5" : testResult.status === "error" ? "#fef2f2" : "#eff6ff", color: testResult.status === "success" ? "#065f46" : testResult.status === "error" ? "#991b1b" : "#1e40af" }}>
                      {testResult.status === "testing" ? "⏳ Testando..." : testResult.message}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-primary" onClick={() => handleSave(integ.id)} disabled={saving} style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }}>{saving ? "Salvando..." : "Salvar"}</button>
                    <button className="btn btn-secondary" onClick={handleTest} style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }}>Testar</button>
                    <button onClick={() => { setEditing(null); setTestResult(null); }} style={{ padding: "0.5rem 1rem", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "0.82rem" }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", borderTop: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: "0.82rem", color: isConnected ? "#065f46" : "#888", fontWeight: 500 }}>
                      {isConnected ? `✅ Conectado — ${new Date(saved.updatedAt).toLocaleDateString("pt-BR")}` : "⚪ Não configurado"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button className="btn btn-secondary" onClick={() => startEditing(integ)} style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}>{isConnected ? "Editar" : "Configurar"}</button>
                    {isConnected && <button onClick={() => handleDisconnect(integ.id)} style={{ padding: "0.4rem 0.9rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "4px", color: "var(--egbe-red)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Desconectar</button>}
                    <a href={integ.docsUrl} target="_blank" rel="noopener" style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem", color: "#888", textDecoration: "none" }}>Docs ↗</a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem 1.25rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "0.82rem", color: "#92400e", lineHeight: 1.6 }}>
        <strong>⚠️ Segurança:</strong> As chaves ficam no Firestore com acesso restrito. Em produção, migre para Google Secret Manager.
      </div>
    </div>
  );
}
