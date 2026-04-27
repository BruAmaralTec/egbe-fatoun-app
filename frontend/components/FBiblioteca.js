// ========================================
// components/FBiblioteca.js
// [F = Frontend Component]
// Biblioteca de materiais — visualização pública
// (gestão: components/admin/FBibliotecaAdmin.js)
// ========================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { FILE_TYPES, CATEGORIES } from "@/lib/LBiblioteca";

// Mapeamento de legacy access field → roles equivalentes
const LEGACY_ACCESS = {
  all: null, // sem restrição
  filho: ["filho", "conselho", "sacerdote", "tecnico", "midias"],
  conselho: ["conselho", "sacerdote", "tecnico"],
  admin: ["sacerdote", "tecnico"],
};

function userCanAccess(item, profile, uid) {
  if (!profile) return false;
  if (profile.role === "tecnico" || profile.role === "sacerdote") return true;

  // Legacy single-select field
  if (item.access) {
    if (item.access === "all") return true;
    const legacyRoles = LEGACY_ACCESS[item.access];
    return legacyRoles?.includes(profile.role) ?? true;
  }

  // Novos campos
  const hasRoles = item.accessRoles?.length > 0;
  const hasUsers = item.accessUsers?.length > 0;
  if (!hasRoles && !hasUsers) return true;
  if (item.accessUsers?.includes(uid)) return true;
  if (item.accessRoles?.includes(profile.role)) return true;
  return false;
}

export default function FBiblioteca() {
  const { user, profile, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [filterCat, setFilterCat] = useState("Todos");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "library")).catch(() => ({ docs: [] }));
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  const visibleItems = items.filter((i) => userCanAccess(i, profile, user?.uid));

  const filtered = visibleItems.filter(i => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "Todos" || i.type === filterType;
    const matchCat = filterCat === "Todos" || i.category === filterCat;
    return matchSearch && matchType && matchCat;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Biblioteca</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{visibleItems.length} materiais disponíveis</p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/admin/biblioteca" className="btn btn-secondary" style={{ textDecoration: "none", fontSize: "0.85rem" }}>
            ⚙️ Gerenciar biblioteca
          </Link>
        )}
      </div>

      {/* Busca e filtros */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input className="input-field" placeholder="Buscar por título..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: "200px" }} />
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: "0.35rem 0.8rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
            background: filterCat === c ? "var(--egbe-green)" : "white", color: filterCat === c ? "white" : "#666",
            border: `1.5px solid ${filterCat === c ? "var(--egbe-green)" : "#e5e7eb"}`, fontFamily: "inherit",
          }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button onClick={() => setFilterType("Todos")} style={{
          padding: "0.3rem 0.7rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
          background: filterType === "Todos" ? "#f3f4f6" : "white", color: "#666", border: "1px solid #e5e7eb", fontFamily: "inherit",
        }}>Todos</button>
        {FILE_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilterType(filterType === t.value ? "Todos" : t.value)} style={{
            padding: "0.3rem 0.7rem", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer",
            background: filterType === t.value ? t.bg : "white", color: t.color, border: `1px solid ${filterType === t.value ? t.color : "#e5e7eb"}`,
            fontWeight: 600, fontFamily: "inherit",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Grid de materiais */}
      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {filtered.map(item => {
            const typeInfo = FILE_TYPES.find(t => t.value === item.type) || FILE_TYPES[0];
            return (
              <div key={item.id} className="card" style={{ borderLeft: `4px solid ${typeInfo.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: typeInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                    {typeInfo.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "0.95rem", margin: 0, lineHeight: 1.3 }}>{item.title}</h3>
                    <span style={{ fontSize: "0.7rem", color: "#888" }}>{typeInfo.label} · {item.category || "Geral"}</span>
                  </div>
                </div>
                {item.description && <div className="rich-editor-content" style={{ color: "#666", fontSize: "0.82rem", marginBottom: "0.5rem" }} dangerouslySetInnerHTML={{ __html: item.description }} />}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <a href={item.url} target="_blank" rel="noopener" className="btn btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem", textDecoration: "none" }}>Abrir ↗</a>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>Nenhum material encontrado.</p>}
        </div>
      )}
    </div>
  );
}
