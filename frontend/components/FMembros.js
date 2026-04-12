// ========================================
// components/FMembros.js
// [F = Frontend Component]
// Lista de filhos da casa — visível p/ conselho
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const ROLES = [
  { value: "sacerdote", label: "Sacerdotisa" },
  { value: "tecnico", label: "Técnico" },
  { value: "conselho", label: "Conselho" },
  { value: "filho", label: "Filho(a) da Casa" },
  { value: "cliente", label: "Cliente" },
];

export default function FMembros() {
  const { isConselho } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isConselho) return;
    async function load() {
      const q = query(collection(db, "users"), orderBy("displayName", "asc"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, [isConselho]);

  if (!isConselho) return <p>Acesso restrito ao Conselho e Administradores.</p>;

  const filtered = users.filter(u =>
    !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.oruko?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Filhos da Casa</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{users.length} membros registrados</p>

      <input className="input-field" placeholder="Buscar por nome ou Orúkọ..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: "400px", marginBottom: "1.5rem" }} />

      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {filtered.map(u => (
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
                {ROLES.find(r => r.value === u.role)?.label || u.role}
              </span>
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
  );
}
