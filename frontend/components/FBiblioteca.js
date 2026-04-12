// ========================================
// components/FBiblioteca.js
// [F = Frontend Component]
// Biblioteca de materiais — PDF, Word, PPT,
// links, imagens, áudio, vídeo
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import {
  collection, getDocs, addDoc, deleteDoc, doc, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/LFirebase";

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

export default function FBiblioteca() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [filterCat, setFilterCat] = useState("Todos");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", url: "", type: "pdf", category: "Geral", access: "all" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "library"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  async function handleAdd() {
    if (!form.title || !form.url) return alert("Título e URL são obrigatórios");
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, "library"), { ...form, createdAt: new Date() });
      setItems(prev => [{ id: ref.id, ...form }, ...prev]);
      setForm({ title: "", description: "", url: "", type: "pdf", category: "Geral", access: "all" });
      setShowAdd(false);
    } catch (err) { alert("Erro: " + err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Remover este material?")) return;
    await deleteDoc(doc(db, "library", id));
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "Todos" || i.type === filterType;
    const matchCat = filterCat === "Todos" || i.category === filterCat;
    return matchSearch && matchType && matchCat;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Biblioteca</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{items.length} materiais disponíveis</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancelar" : "+ Adicionar Material"}
          </button>
        )}
      </div>

      {/* Form adicionar */}
      {showAdd && isAdmin && (
        <div className="card" style={{ marginBottom: "1.5rem", maxWidth: "700px" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Novo material</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
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
            <div>
              <label className="label">Acesso</label>
              <select className="input-field" value={form.access} onChange={e => setForm({ ...form, access: e.target.value })}>
                <option value="all">Todos os membros</option>
                <option value="filho">Filhos da casa +</option>
                <option value="conselho">Conselho +</option>
                <option value="admin">Apenas admins</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Descrição (opcional)</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
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
