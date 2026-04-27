// ========================================
// components/admin/FBibliotecaAdmin.js
// [F = Frontend Component]
// Gestão da Biblioteca — CRUD completo
// (adicionar, editar, remover, controle de acesso)
// ========================================

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/LAuthContext";
import { useModal } from "@/lib/LModalContext";
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import FRichTextEditor from "@/components/FRichTextEditor";
import { ROLES } from "@/lib/LPermissions";
import { FILE_TYPES, CATEGORIES } from "@/lib/LBiblioteca";

const EMPTY_FORM = {
  title: "", description: "", url: "", type: "pdf", category: "Geral",
  accessRoles: [], accessUsers: [],
};

export default function FBibliotecaAdmin() {
  const { isAdmin } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [filterCat, setFilterCat] = useState("Todos");

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      const [itemsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "library")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "users")).catch(() => ({ docs: [] })),
      ]);
      const list = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR"));
      setItems(list);
      const us = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      us.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "pt-BR"));
      setUsers(us);
      setLoading(false);
    }
    load();
  }, [isAdmin]);

  function startNew() {
    setForm({ ...EMPTY_FORM });
    setUserSearch("");
    setEditing("new");
  }

  function startEdit(item) {
    setForm({
      title: item.title || "",
      description: item.description || "",
      url: item.url || "",
      type: item.type || "pdf",
      category: item.category || "Geral",
      accessRoles: item.accessRoles || [],
      accessUsers: item.accessUsers || [],
    });
    setUserSearch("");
    setEditing(item.id);
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setUserSearch("");
  }

  async function handleSave() {
    if (!form.title || !form.url) return showAlert("Título e URL são obrigatórios");
    setSaving(true);
    try {
      if (editing === "new") {
        const payload = { ...form, createdAt: new Date() };
        const ref = await addDoc(collection(db, "library"), payload);
        setItems(prev => {
          const next = [...prev, { id: ref.id, ...payload }];
          next.sort((a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR"));
          return next;
        });
      } else {
        const payload = { ...form, updatedAt: new Date() };
        await updateDoc(doc(db, "library", editing), payload);
        setItems(prev => {
          const next = prev.map(i => (i.id === editing ? { ...i, ...payload } : i));
          next.sort((a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR"));
          return next;
        });
      }
      cancelEdit();
    } catch (err) {
      await showAlert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!(await showConfirm("Remover este material?"))) return;
    try {
      await deleteDoc(doc(db, "library", id));
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      await showAlert("Erro: " + err.message);
    }
  }

  function toggleRole(role) {
    setForm(f => ({
      ...f,
      accessRoles: f.accessRoles.includes(role) ? f.accessRoles.filter(r => r !== role) : [...f.accessRoles, role],
    }));
  }

  function addUserId(id) {
    setForm(f => ({ ...f, accessUsers: f.accessUsers.includes(id) ? f.accessUsers : [...f.accessUsers, id] }));
    setUserSearch("");
  }

  function removeUserId(id) {
    setForm(f => ({ ...f, accessUsers: f.accessUsers.filter(u => u !== id) }));
  }

  const matchedUsers = userSearch
    ? users.filter(u =>
        !form.accessUsers.includes(u.id) &&
        (u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
         u.email?.toLowerCase().includes(userSearch.toLowerCase()))
      ).slice(0, 6)
    : [];

  const isAccessPublic = form.accessRoles.length === 0 && form.accessUsers.length === 0;

  const filtered = useMemo(() => items.filter(i => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "Todos" || i.type === filterType;
    const matchCat = filterCat === "Todos" || i.category === filterCat;
    return matchSearch && matchType && matchCat;
  }), [items, search, filterType, filterCat]);

  if (!isAdmin) {
    return <p style={{ color: "#888" }}>Sem permissão.</p>;
  }

  if (loading) return <p style={{ color: "#888" }}>Carregando...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gestão da Biblioteca</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{items.length} materiais cadastrados</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/dashboard/biblioteca" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Ver biblioteca
          </Link>
          {!editing && (
            <button className="btn btn-primary" onClick={startNew}>+ Adicionar Material</button>
          )}
        </div>
      </div>

      {/* Form (novo ou edição) */}
      {editing && (
        <div className="card" style={{ marginBottom: "1.5rem", maxWidth: "900px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", margin: 0 }}>
              {editing === "new" ? "Novo material" : "Editar material"}
            </h3>
            <button onClick={cancelEdit} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit" }}>
              Cancelar
            </button>
          </div>

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

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : (editing === "new" ? "Adicionar" : "Salvar alterações")}
            </button>
            <button className="btn btn-secondary" onClick={cancelEdit} disabled={saving}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
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

      {/* Lista de materiais */}
      {filtered.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", padding: "2rem" }}>Nenhum material encontrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map(item => {
            const typeInfo = FILE_TYPES.find(t => t.value === item.type) || FILE_TYPES[0];
            const accessLabel = (item.accessRoles?.length || 0) === 0 && (item.accessUsers?.length || 0) === 0
              ? "Público"
              : `${item.accessRoles?.length || 0} perfil(is)${(item.accessUsers?.length || 0) > 0 ? ` + ${item.accessUsers.length} usuário(s)` : ""}`;
            const isCurrentlyEditing = editing === item.id;
            return (
              <div key={item.id} className="card" style={{ borderLeft: `4px solid ${typeInfo.color}`, padding: "0.75rem 1rem", opacity: editing && !isCurrentlyEditing ? 0.4 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: typeInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                    {typeInfo.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <h3 style={{ fontSize: "0.95rem", margin: 0, lineHeight: 1.3 }}>{item.title}</h3>
                    <span style={{ fontSize: "0.72rem", color: "#888" }}>
                      {typeInfo.label} · {item.category || "Geral"} · 🔒 {accessLabel}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a href={item.url} target="_blank" rel="noopener" className="btn btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem", textDecoration: "none" }}>Abrir ↗</a>
                    <button onClick={() => startEdit(item)} disabled={!!editing} style={{ padding: "0.3rem 0.7rem", background: "white", border: "1.5px solid var(--egbe-green)", borderRadius: "4px", color: "var(--egbe-green)", cursor: editing ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "inherit" }}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={!!editing} style={{ padding: "0.3rem 0.7rem", background: "white", border: "1.5px solid #fecaca", borderRadius: "4px", color: "var(--egbe-red)", cursor: editing ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "inherit" }}>
                      Remover
                    </button>
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
