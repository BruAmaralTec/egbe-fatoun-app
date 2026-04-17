// ========================================
// components/FMembros.js
// [F = Frontend Component]
// Lista de filhos da casa — visível p/ conselho
// Agrupada por grupo de perfil, clica para entrar
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

// Ordem fixa dos grupos e quais roles cada um inclui
const GROUPS = [
  { id: "sacerdote", label: "Sacerdotisa", color: "#f59e0b", roles: ["sacerdote"] },
  { id: "conselho", label: "Conselho", color: "#6366f1", roles: ["conselho"] },
  { id: "filho", label: "Filhos da Casa", color: "#22c55e", roles: ["filho"] },
  { id: "time-tecnico", label: "Time Técnico", color: "#3b82f6", roles: ["tecnico", "midias"] },
  { id: "cliente", label: "Clientes", color: "#9ca3af", roles: ["cliente"] },
];

export default function FMembros() {
  const { isConselho } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openGroup, setOpenGroup] = useState(null);

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

  const byGroup = GROUPS.map((g) => ({
    ...g,
    members: users
      .filter((u) => g.roles.includes(u.role))
      .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "pt-BR")),
  }));

  const activeGroup = openGroup ? byGroup.find((g) => g.id === openGroup) : null;

  const filteredMembers = activeGroup
    ? activeGroup.members.filter((u) =>
        !search ||
        u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.oruko?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Filhos da Casa</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        {users.length} membros registrados · agrupados por perfil
      </p>

      {loading ? (
        <p style={{ color: "#888" }}>Carregando...</p>
      ) : activeGroup ? (
        <div>
          <button onClick={() => { setOpenGroup(null); setSearch(""); }} className="btn btn-secondary" style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
            ← Voltar aos grupos
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: activeGroup.color }} />
            <h2 style={{ fontSize: "1.3rem", margin: 0 }}>{activeGroup.label}</h2>
            <span style={{ color: "#888", fontSize: "0.9rem" }}>· {activeGroup.members.length} {activeGroup.members.length === 1 ? "membro" : "membros"}</span>
          </div>
          <input className="input-field" placeholder="Buscar por nome ou Orúkọ..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: "400px", marginBottom: "1.5rem" }} />
          {filteredMembers.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem", color: "#aaa" }}>
              {activeGroup.members.length === 0 ? "Nenhum membro neste grupo ainda." : "Nenhum resultado para a busca."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {filteredMembers.map(u => (
                <div key={u.id} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: activeGroup.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 600, flexShrink: 0 }}>
                      {u.displayName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{u.displayName || "—"}</p>
                      {u.oruko && <p style={{ fontSize: "0.8rem", color: "var(--egbe-green)", fontStyle: "italic" }}>Orúkọ: {u.oruko}</p>}
                    </div>
                  </div>
                  {u.initiacoes?.length > 0 && (
                    <p style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.5rem" }}>
                      {u.initiacoes.length} iniciação(ões)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {byGroup.map((g) => (
            <button
              key={g.id}
              onClick={() => setOpenGroup(g.id)}
              className="card"
              style={{
                textAlign: "left",
                cursor: g.members.length > 0 ? "pointer" : "not-allowed",
                opacity: g.members.length > 0 ? 1 : 0.55,
                border: "1px solid #e5e7eb",
                background: "white",
                borderLeft: `4px solid ${g.color}`,
                padding: "1.25rem",
              }}
              disabled={g.members.length === 0}
            >
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>{g.label}</h3>
              <p style={{ fontSize: "0.85rem", color: "#666" }}>
                {g.members.length} {g.members.length === 1 ? "membro" : "membros"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
