// ========================================
// components/FBiblioteca.js
// [F = Frontend Component]
// Biblioteca de materiais — PDF, Word, PPT,
// links, imagens, áudio, vídeo
// Controle de acesso: multi-select perfis + usuários
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useModal } from "@/lib/LModalContext";
import {
  collection, getDocs, addDoc, deleteDoc, doc, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import FRichTextEditor from "@/components/FRichTextEditor";
import { ROLES } from "@/lib/LPermissions";

const FILE_TYPES = [
  { value: "pdf", label: "PDF", icon: "📄", color: "#B22222", bg: "#fde8e8" },
  { value: "word", label: "Word", icon: "📝", color: "#1a4080", bg: "#dbeafe" },
  { value: "ppt", label: "PowerPoint", icon: "📊", color: "#c2410c", bg: "#fff7ed" },
  { value: "image", label: "Imagem", icon: "🖼️", color: "#6d28d9", bg: "#f5f3ff" },
  { value: "audio", label: "Áudio", icon: "🎵", color: "#1B6B3A", bg: "#d1fae5" },
  { value: "video", label: "Vídeo", icon: "🎬", color: "#dc2626", bg: "#fef2f2" },
  { value: "link", label: "Link", icon: "🔗", color: "#0284c7", bg: "#e0f2fe" },
];

const CATEGORIES = ["Todos", "Oríkì", "Ìtàn", "Odù", "Èwé", "Cursos", "Geral"];

const EMPTY_FORM = { title: "", description: "", url: "", type: "pdf", category: "Geral", accessRoles: [], accessUsers: [] };

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
  const { showAlert, showConfirm } = useModal();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [filterCat, setFilterCat] = useState("Todos");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "library")).catch(() => ({ docs: [] }));
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    async function loadUsers() {
      const snap = await getDocs(collection(db, "users")).catch(() => ({ docs: [] }));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "pt-BR"));
      setUsers(list);
    }
    loadUsers();
  }, [isAdmin]);

  async function handleAdd() {
    if (!form.title || !form.url) return showAlert("Título e URL são obrigatórios");
    setSaving(true);
    try {
      const payload = { ...form, createdAt: new Date() };
      const ref = await addDoc(collection(db, "library"), payload);
      setItems(prev => [{ id: ref.id, ...payload }, ...prev]);
      setForm({ ...EMPTY_FORM });
      setUserSearch("");
      setShowAdd(false);
    } catch (err) { await showAlert("Erro: " + err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!(await showConfirm("Remover este material?"))) return;
    await deleteDoc(doc(db, "library", id));
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function toggleRole(role) {
    setForm((f) => ({
      ...f,
      accessRoles: f.accessRoles.includes(role) ? f.accessRoles.filter((r) => r !== role) : [...f.accessRoles, role],
    }));
  }

  function addUserId(id) {
    setForm((f) => ({ ...f, accessUsers: f.accessUsers.includes(id) ? f.accessUsers : [...f.accessUsers, id] }));
    setUserSearch("");
  }
  function removeUserId(id) {
    setForm((f) => ({ ...f, accessUsers: f.accessUsers.filter((u) => u !== id) }));
  }

  const matchedUsers = userSearch
    ? users.filter((u) =>
        !form.accessUsers.includes(u.id) &&
        (u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
         u.email?.toLowerCase().includes(userSearch.toLowerCase()))
      ).slice(0, 6)
    : [];

  const visibleItems = items.filter((i) => userCanAccess(i, profile, user?.uid));

  const filtered = visibleItems.filter(i => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "Todos" || i.type === filterType;
    const matchCat = filterCat === "Todos" || i.category === filterCat;
    return matchSearch && matchType && matchCat;
  });

  const isAccessPublic = form.accessRoles.length === 0 && form.accessUsers.length === 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Biblioteca</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{visibleItems.length} materiais disponíveis</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancelar" : "+ Adicionar Material"}
          </button>
        )}
      </div>

      {/* Form adicionar */}
      {showAdd && isAdmin && (
        <div className="card" style={{ marginBottom: "1.5rem", maxWidth: "800px" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Novo material</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Título</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Oríkì de Ọ̀ṣun" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">URL do arquivo ou link</label>
              <input className="input-field" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://drive.google.com/..." />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter(c => c !== "Todos").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Descrição (opcional)</label>
              <FRichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="Breve descrição do material..." minHeight="100px" />
            </div>
          </div>

          {/* Controle de acesso */}
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <label className="label" style={{ marginBottom: "0.5rem" }}>Acesso</label>
            <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "0.75rem" }}>
              {isAccessPublic ? "Todos os membros terão acesso." : `Restrito a ${form.accessRoles.length} perfil(is)${form.accessUsers.length > 0 ? ` + ${form.accessUsers.length} usuário(s)` : ""}.`}
            </p>

            <p style={{ fontSize: "0.78rem", color: "#666", marginBottom: "0.4rem", fontWeight: 600 }}>Perfis:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
              {ROLES.map((r) => {
                const active = form.accessRoles.includes(r.value);
                return (
                  <button
                    key={r.value}
                    onClick={() => toggleRole(r.value)}
                    style={{
                      padding: "0.3rem 0.7rem",
                      borderRadius: "20px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: `1.5px solid ${r.color}`,
                      background: active ? r.color : "white",
                      color: active ? "white" : r.color,
                      fontFamily: "inherit",
                    }}
                  >
                    {active && "✓ "}{r.label}
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: "0.78rem", color: "#666", marginBottom: "0.4rem", fontWeight: 600 }}>Usuários específicos:</p>
            {form.accessUsers.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                {form.accessUsers.map((uid) => {
                  const u = users.find((x) => x.id === uid);
                  return (
                    <span key={uid} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.6rem", background: "white", border: "1.5px solid var(--egbe-green)", borderRadius: "16px", fontSize: "0.78rem", color: "var(--egbe-green-dark)" }}>
                      {u?.displayName || u?.email || uid.slice(0, 6)}
                      <button onClick={() => removeUserId(uid)} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer", padding: 0, fontSize: "0.95rem", lineHeight: 1 }}>×</button>
                    </span>
                  );
                })}
              </div>
            )}
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                placeholder="Buscar usuário por nome ou email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ fontSize: "0.85rem" }}
              />
              {matchedUsers.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", marginTop: "2px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 10, maxHeight: "200px", overflowY: "auto" }}>
                  {matchedUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => addUserId(u.id)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", borderBottom: "1px solid #f3f4f6", fontFamily: "inherit" }}
                    >
                      <strong>{u.displayName || "—"}</strong>
                      <span style={{ color: "#888" }}> · {u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleAdd} disabled={saving} style={{ marginTop: "1rem" }}>
            {saving ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      )}

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
                {item.description && <p style={{ color: "#666", fontSize: "0.82rem", marginBottom: "0.5rem" }}>{item.description}</p>}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <a href={item.url} target="_blank" rel="noopener" className="btn btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem", textDecoration: "none" }}>Abrir ↗</a>
                  {isAdmin && (
                    <button onClick={() => handleDelete(item.id)} style={{ padding: "0.3rem 0.7rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "4px", color: "var(--egbe-red)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>Remover</button>
                  )}
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
