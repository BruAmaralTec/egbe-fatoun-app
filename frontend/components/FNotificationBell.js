// ========================================
// components/FNotificationBell.js
// [F = Frontend Component]
// Sino de notificações no topo do dashboard
// ========================================

"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import Link from "next/link";

export default function FNotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          where("read", "==", false),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const snap = await getDocs(q);
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* collection may not exist yet */ }
    }
    load();
  }, [user]);

  // Close on click outside — só fecha se o clique começou E terminou fora
  // (permite seleção de texto que atravessa a borda do dropdown sem fechar)
  useEffect(() => {
    let startedOutside = false;
    function handleMouseDown(e) {
      startedOutside = !!(ref.current && !ref.current.contains(e.target));
    }
    function handleMouseUp(e) {
      if (startedOutside && ref.current && !ref.current.contains(e.target)) {
        setShowDropdown(false);
      }
      startedOutside = false;
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const unread = notifications.length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem",
          position: "relative", padding: "0.4rem",
        }}
        title="Notificações"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "2px", right: "0px",
            width: "16px", height: "16px", borderRadius: "50%",
            background: "var(--egbe-red)", color: "white",
            fontSize: "0.65rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{unread}</span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", right: 0, width: "300px",
          background: "white", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          border: "1px solid #e5e7eb", zIndex: 100, overflow: "hidden",
        }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>Notificações</span>
            {unread > 0 && <span style={{ fontSize: "0.72rem", color: "var(--egbe-red)" }}>{unread} não lidas</span>}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
              Nenhuma notificação nova
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ padding: "0.6rem 1rem", borderBottom: "1px solid #f9fafb", background: "#eff6ff" }}>
                <p style={{ fontWeight: 600, fontSize: "0.82rem" }}>{n.title || "Notificação"}</p>
                <p style={{ color: "#666", fontSize: "0.75rem" }}>{n.message || ""}</p>
              </div>
            ))
          )}
          <Link href="/dashboard/notificacoes" onClick={() => setShowDropdown(false)} style={{
            display: "block", textAlign: "center", padding: "0.6rem",
            fontSize: "0.82rem", color: "var(--egbe-green)", fontWeight: 600, textDecoration: "none",
            borderTop: "1px solid #f3f4f6",
          }}>
            Ver todas →
          </Link>
        </div>
      )}
    </div>
  );
}
