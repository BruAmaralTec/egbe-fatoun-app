// ========================================
// components/admin/FConfiguracoesAdmin.js
// [F = Frontend Component]
// Configurações do sistema — permissões,
// notificações, segurança
// ========================================

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/LAuthContext";

const PERFIS = [
  { role: "sacerdote", label: "Sacerdotisa", level: "Super-adm", color: "#D4A017", access: "Acesso total · Todos os módulos · Financeiro · Rituais · Integrações" },
  { role: "tecnico", label: "Técnico", level: "Super-adm", color: "#3b82f6", access: "Integrações · Biblioteca · Sem financeiro · Sem rituais privados" },
  { role: "conselho", label: "Conselho", level: "Admin", color: "#6366f1", access: "Eventos · Cursos · Membros · Relatórios · Financeiro" },
  { role: "filho", label: "Filho(a) da Casa", level: "Configurável", color: "#22c55e", access: "Eventos · Cursos · Biblioteca · Osè · Pagamentos" },
  { role: "cliente", label: "Cliente", level: "Configurável", color: "#9ca3af", access: "Eventos públicos · Cursos · Pagamentos" },
];

const NOTIFICATION_TYPES = [
  { id: "ritual", label: "Rituais e Osè", desc: "Próximos rituais e lembretes de Osè" },
  { id: "payment", label: "Pagamentos", desc: "Confirmações e cobranças vencidas" },
  { id: "event", label: "Eventos", desc: "Novos eventos e inscrições" },
  { id: "course", label: "Cursos", desc: "Novos cursos e certificados" },
  { id: "system", label: "Sistema", desc: "Atualizações e manutenção" },
];

export default function FConfiguracoesAdmin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("permissions");
  const [notifSettings, setNotifSettings] = useState(
    NOTIFICATION_TYPES.reduce((acc, t) => ({ ...acc, [t.id]: true }), {})
  );

  if (!isAdmin) return null;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Configurações</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Permissões · Notificações · Segurança</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { id: "permissions", label: "Permissões" },
          { id: "notifications", label: "Notificações" },
          { id: "security", label: "Segurança" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1.5px solid",
            borderColor: tab === t.id ? "var(--egbe-green)" : "#e5e7eb",
            background: tab === t.id ? "var(--egbe-green)" : "white",
            color: tab === t.id ? "white" : "#666", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Permissões */}
      {tab === "permissions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {PERFIS.map(p => (
            <div key={p.role} className="card" style={{ borderLeft: `4px solid ${p.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem", color: p.color }}>{p.label}</span>
                <span className={`badge badge-${p.role}`}>{p.level}</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#666" }}>{p.access}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notificações */}
      {tab === "notifications" && (
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Tipos de notificação</h3>
          {NOTIFICATION_TYPES.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.label}</p>
                <p style={{ color: "#888", fontSize: "0.8rem" }}>{t.desc}</p>
              </div>
              <label style={{ position: "relative", width: "44px", height: "24px", cursor: "pointer" }}>
                <input type="checkbox" checked={notifSettings[t.id]} onChange={() => setNotifSettings(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                  style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} />
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "12px", transition: "background 0.2s",
                  background: notifSettings[t.id] ? "var(--egbe-green)" : "#d1d5db",
                }}>
                  <span style={{
                    position: "absolute", top: "2px", left: notifSettings[t.id] ? "22px" : "2px",
                    width: "20px", height: "20px", borderRadius: "50%", background: "white", transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Segurança */}
      {tab === "security" && (
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Segurança do Sistema</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              ["Firebase Auth", "Email + Google habilitados", true],
              ["Firestore Rules", "Regras de segurança aplicadas", true],
              ["Storage Rules", "Regras de upload aplicadas", true],
              ["HTTPS", "Certificado SSL ativo", true],
              ["CORS", "Domínios permitidos configurados", true],
              ["Webhook Token", "Validação de webhooks Asaas", true],
            ].map(([label, desc, active]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "#f9fafb", borderRadius: "8px" }}>
                <span className="status-dot" style={{ background: active ? "#22c55e" : "#ef4444" }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.88rem" }}>{label}</p>
                  <p style={{ color: "#888", fontSize: "0.78rem" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#eff6ff", borderRadius: "8px", fontSize: "0.82rem", color: "#1e40af" }}>
            Gerencie as regras de segurança do Firestore e Storage em Deploy & Config.
          </div>
        </div>
      )}
    </div>
  );
}
