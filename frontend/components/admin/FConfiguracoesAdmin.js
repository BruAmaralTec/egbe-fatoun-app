// ========================================
// components/admin/FConfiguracoesAdmin.js
// [F = Frontend Component]
// Configurações do sistema — Permissões + Notificações por perfil
// ========================================

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/LAuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { ROLES } from "@/lib/LPermissions";

const FPermissoesAdmin = dynamic(() => import("@/components/admin/FPermissoesAdmin"), { ssr: false });

const NOTIFICATION_TYPES = [
  { id: "ritual", label: "Rituais e Ọ̀sẹ̀", desc: "Próximos rituais e lembretes de Ọ̀sẹ̀" },
  { id: "payment", label: "Pagamentos", desc: "Confirmações e cobranças vencidas" },
  { id: "event", label: "Eventos", desc: "Novos eventos e inscrições" },
  { id: "course", label: "Cursos", desc: "Novos cursos e certificados" },
  { id: "system", label: "Sistema", desc: "Atualizações e manutenção" },
];

const editableRoles = ROLES.filter((r) => r.value !== "tecnico");

function buildDefaults() {
  const d = {};
  NOTIFICATION_TYPES.forEach((t) => {
    d[t.id] = {};
    editableRoles.forEach((r) => { d[t.id][r.value] = true; });
  });
  return d;
}

export default function FConfiguracoesAdmin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("permissions");
  const [notifSettings, setNotifSettings] = useState(buildDefaults());
  const [loadingNotif, setLoadingNotif] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [savedNotif, setSavedNotif] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "config", "notificationSettings"));
        if (snap.exists()) {
          const data = snap.data();
          setNotifSettings((prev) => {
            const merged = { ...prev };
            Object.keys(merged).forEach((typeId) => {
              if (data[typeId]) merged[typeId] = { ...merged[typeId], ...data[typeId] };
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Erro ao carregar config de notificações:", err);
      } finally {
        setLoadingNotif(false);
      }
    }
    load();
  }, []);

  async function toggleNotif(typeId, roleValue) {
    const next = {
      ...notifSettings,
      [typeId]: { ...notifSettings[typeId], [roleValue]: !notifSettings[typeId]?.[roleValue] },
    };
    setNotifSettings(next);
    setSavingNotif(true);
    setSavedNotif(false);
    try {
      await setDoc(doc(db, "config", "notificationSettings"), next);
      setSavedNotif(true);
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSavingNotif(false);
    }
  }

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
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.88rem", color: "#666" }}>Ative ou desative tipos de notificação por perfil.</p>
            {savingNotif && <span style={{ fontSize: "0.78rem", color: "#888" }}>Salvando...</span>}
            {!savingNotif && savedNotif && <span style={{ fontSize: "0.78rem", color: "var(--egbe-green)", fontWeight: 600 }}>✔ Salvo</span>}
          </div>

          {loadingNotif ? <p style={{ color: "#888" }}>Carregando...</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#333" }}>Tipo</th>
                    {editableRoles.map((r) => (
                      <th key={r.value} style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: 600, color: r.color, fontSize: "0.78rem", minWidth: "80px" }}>
                        {r.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIFICATION_TYPES.map((t) => (
                    <tr key={t.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <p style={{ fontWeight: 600, fontSize: "0.88rem" }}>{t.label}</p>
                        <p style={{ color: "#888", fontSize: "0.75rem" }}>{t.desc}</p>
                      </td>
                      {editableRoles.map((r) => {
                        const active = notifSettings[t.id]?.[r.value] !== false;
                        return (
                          <td key={r.value} style={{ padding: "0.5rem", textAlign: "center" }}>
                            <button
                              onClick={() => toggleNotif(t.id, r.value)}
                              style={{
                                width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer",
                                border: `2px solid ${active ? r.color : "#d1d5db"}`,
                                background: active ? r.color : "white",
                                color: active ? "white" : "#d1d5db",
                                fontSize: "0.85rem", fontWeight: 700, fontFamily: "inherit",
                              }}
                            >
                              {active ? "✓" : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
