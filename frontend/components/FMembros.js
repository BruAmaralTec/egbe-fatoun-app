// ========================================
// components/FMembros.js
// [F = Frontend Component]
// Gestão de Usuários — cards de perfil + CRUD + aba Grupos
// ========================================

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const FGruposAdmin = dynamic(() => import("@/components/admin/FGruposAdmin"), { ssr: false });
const FUsuariosAdmin = dynamic(() => import("@/components/admin/FUsuariosAdmin"), { ssr: false });

const GROUPS_ORDER = [
  { id: "sacerdote", label: "Sacerdotisa", color: "#f59e0b", roles: ["sacerdote"] },
  { id: "conselho", label: "Conselho", color: "#6366f1", roles: ["conselho"] },
  { id: "filho", label: "Filhos da Casa", color: "#22c55e", roles: ["filho"] },
  { id: "time-tecnico", label: "Time Técnico", color: "#3b82f6", roles: ["tecnico", "midias"] },
  { id: "cliente", label: "Clientes", color: "#9ca3af", roles: ["cliente"] },
];

export default function FMembros() {
  const { isConselho, isAdmin } = useAuth();
  const [tab, setTab] = useState("membros");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConselho) return;
    async function load() {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, [isConselho]);

  if (!isConselho) return <p>Acesso restrito ao Conselho e Administradores.</p>;

  const counts = GROUPS_ORDER.map((g) => ({
    ...g,
    count: users.filter((u) => g.roles.includes(u.role)).length,
  }));
  const total = users.length;

  if (tab === "grupos") {
    return (
      <div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gestão de Usuários</h1>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>{total} membros registrados</p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button onClick={() => setTab("membros")} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>Membros</button>
          <button className="btn btn-primary" style={{ fontSize: "0.85rem" }}>Grupos</button>
        </div>
        <FGruposAdmin />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gestão de Usuários</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>{total} membros registrados</p>

      {isAdmin && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button className="btn btn-primary" style={{ fontSize: "0.85rem" }}>Membros</button>
          <button onClick={() => setTab("grupos")} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>Grupos</button>
        </div>
      )}

      {/* Cards de contagem por perfil */}
      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {counts.map((g) => (
              <div
                key={g.id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "1rem",
                  borderLeft: `4px solid ${g.color}`,
                  border: "1px solid #e5e7eb",
                }}
              >
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: g.color, marginBottom: "0.15rem" }}>{g.count}</p>
                <p style={{ fontSize: "0.82rem", color: "#555" }}>{g.label}</p>
              </div>
            ))}
          </div>

          {/* CRUD completo (admin) */}
          {isAdmin && <FUsuariosAdmin />}

          {/* Conselho (não admin): lista simples */}
          {!isAdmin && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {users.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "pt-BR")).map(u => (
                <div key={u.id} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--egbe-green)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 600, flexShrink: 0 }}>
                      {u.displayName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{u.displayName || "—"}</p>
                      {u.oruko && <p style={{ fontSize: "0.8rem", color: "var(--egbe-green)", fontStyle: "italic" }}>Orúkọ: {u.oruko}</p>}
                    </div>
                  </div>
                  <span className={`badge badge-${u.role || "cliente"}`}>
                    {GROUPS_ORDER.flatMap(g => g.roles.includes(u.role) ? [g.label] : [])[0] || u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
