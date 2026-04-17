// ========================================
// components/FNotificacoes.js
// [F = Frontend Component]
// Sistema de notificações
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs, doc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const CATEGORIES = [
  { id: "all", label: "Todas", icon: "🔔" },
  { id: "ritual", label: "Rituais", icon: "🕯️" },
  { id: "payment", label: "Pagamentos", icon: "💳" },
  { id: "event", label: "Eventos", icon: "📅" },
  { id: "course", label: "Cursos", icon: "📚" },
  { id: "system", label: "Sistema", icon: "⚙️" },
];

export default function FNotificacoes() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    async function load() {
      const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      try {
        const snap = await getDocs(q);
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* collection may not exist yet */ }
      setLoading(false);
    }
    load();
  }, [user]);

  async function markAsRead(id) {
    await updateDoc(doc(db, "notifications", id), { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, "notifications", n.id), { read: true });
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function confirmView(id) {
    await updateDoc(doc(db, "notifications", id), { read: true, confirmedAt: serverTimestamp() });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, confirmedAt: new Date() } : n));
  }

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.category === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Notificações</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{unreadCount} não lida(s)</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead} style={{ fontSize: "0.82rem" }}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} style={{
            padding: "0.4rem 0.9rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            background: filter === c.id ? "var(--egbe-green)" : "white", color: filter === c.id ? "white" : "#666",
            border: `1.5px solid ${filter === c.id ? "var(--egbe-green)" : "#e5e7eb"}`, fontFamily: "inherit",
          }}>{c.icon} {c.label}</button>
        ))}
      </div>

      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔔</p>
          <p style={{ color: "#888" }}>Nenhuma notificação{filter !== "all" ? " nesta categoria" : ""}.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map(n => {
            const cat = CATEGORIES.find(c => c.id === n.category);
            const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
            return (
              <div key={n.id} className="card" style={{ padding: "1rem", background: n.read ? "white" : "#eff6ff", borderLeft: n.read ? "3px solid #e5e7eb" : "3px solid var(--egbe-green)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "0.75rem", flex: 1 }}>
                    <span style={{ fontSize: "1.2rem" }}>{cat?.icon || "🔔"}</span>
                    <div>
                      <p style={{ fontWeight: n.read ? 400 : 600, fontSize: "0.9rem" }}>{n.title || "Notificação"}</p>
                      <p style={{ color: "#666", fontSize: "0.82rem", marginTop: "0.15rem" }}>{n.message || ""}</p>
                      <p style={{ color: "#888", fontSize: "0.75rem", marginTop: "0.3rem" }}>{date.toLocaleDateString("pt-BR")} às {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end" }}>
                    {n.requiresConfirmation && !n.confirmedAt && (
                      <button onClick={() => confirmView(n.id)} style={{ padding: "0.3rem 0.7rem", background: "var(--egbe-green)", border: "none", borderRadius: "4px", fontSize: "0.72rem", color: "white", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", fontWeight: 600 }}>
                        ✓ Confirmar visualização
                      </button>
                    )}
                    {n.requiresConfirmation && n.confirmedAt && (
                      <span style={{ fontSize: "0.72rem", color: "var(--egbe-green)", fontWeight: 600, whiteSpace: "nowrap" }}>✓ Confirmado</span>
                    )}
                    {!n.read && !n.requiresConfirmation && (
                      <button onClick={() => markAsRead(n.id)} style={{ padding: "0.25rem 0.6rem", background: "none", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.72rem", color: "#888", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Marcar lida</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
