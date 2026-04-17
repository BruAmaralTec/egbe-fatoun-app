// ========================================
// components/admin/FConfiguracoesAdmin.js
// [F = Frontend Component]
// Configurações do sistema — Permissões (real) + Notificações + Segurança
// ========================================

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/LAuthContext";

const FPermissoesAdmin = dynamic(() => import("@/components/admin/FPermissoesAdmin"), { ssr: false });

const NOTIFICATION_TYPES = [
  { id: "ritual", label: "Rituais e Ọ̀sẹ̀", desc: "Próximos rituais e lembretes de Ọ̀sẹ̀" },
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
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Permissões · Notificações</p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "permissions", label: "Permissões" },
          { id: "notifications", label: "Notificações" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1.5px solid",
            borderColor: tab === t.id ? "var(--egbe-green)" : "#e5e7eb",
            background: tab === t.id ? "var(--egbe-green)" : "white",
            color: tab === t.id ? "white" : "#666", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "permissions" && <FPermissoesAdmin embedded />}

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

    </div>
  );
}
