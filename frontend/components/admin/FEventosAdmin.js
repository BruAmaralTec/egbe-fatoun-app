// ========================================
// components/admin/FEventosAdmin.js
// [F = Frontend Component]
// Gerenciamento de Eventos/Festivais
// CRUD + inscrições + produtos + pagamento
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useRouter } from "next/navigation";
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { notifyAll } from "@/lib/LNotifications";
import FRichTextEditor from "@/components/FRichTextEditor";

const EMPTY_EVENT = {
  title: "", description: "", date: "", endDate: "", location: "",
  type: "festival", visibility: "public", price: 0, maxCapacity: 0,
  registrationOpen: true, products: [], imageUrl: "", status: "draft",
};

const EVENT_TYPES = [
  { value: "festival", label: "Festival / Odún" },
  { value: "encontro", label: "Encontro" },
  { value: "ritual", label: "Ritual" },
  { value: "palestra", label: "Palestra" },
  { value: "workshop", label: "Workshop" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho", color: "#9ca3af" },
  { value: "published", label: "Publicado", color: "#22c55e" },
  { value: "cancelled", label: "Cancelado", color: "#ef4444" },
  { value: "finished", label: "Finalizado", color: "#6366f1" },
];

export default function FEventosAdmin() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_EVENT });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("details");
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, description: "" });

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      const q = query(collection(db, "events"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, [isAdmin]);

  function openNew() { setEditing("new"); setForm({ ...EMPTY_EVENT }); setTab("details"); }
  function openEdit(event) { setEditing(event.id); setForm({ ...EMPTY_EVENT, ...event }); setTab("details"); }

  async function handleSave() {
    if (!form.title) return alert("Título é obrigatório");
    setSaving(true);
    try {
      const wasPublished = editing !== "new" && events.find((e) => e.id === editing)?.status === "published";
      const nowPublished = form.status === "published";
      const shouldNotify = nowPublished && !wasPublished;

      if (editing === "new") {
        const ref = await addDoc(collection(db, "events"), { ...form, createdAt: new Date() });
        setEvents((prev) => [{ id: ref.id, ...form }, ...prev]);
      } else {
        await updateDoc(doc(db, "events", editing), { ...form, updatedAt: new Date() });
        setEvents((prev) => prev.map((e) => (e.id === editing ? { ...e, ...form } : e)));
      }

      if (shouldNotify) {
        try {
          await notifyAll({
            title: `Novo evento: ${form.title}`,
            message: form.description?.slice(0, 200) || `Data: ${form.date || "em breve"}${form.location ? " · " + form.location : ""}`,
            category: "event",
            link: "/dashboard/eventos",
          });
        } catch (err) { console.warn("Falha ao enviar notificação:", err); }
      }

      setEditing(null);
    } catch (err) { alert("Erro: " + err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Remover este evento?")) return;
    await deleteDoc(doc(db, "events", id));
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function addProduct() {
    if (!newProduct.name || !newProduct.price) return;
    setForm({ ...form, products: [...form.products, { ...newProduct, id: Date.now().toString() }] });
    setNewProduct({ name: "", price: 0, description: "" });
  }

  function removeProduct(id) { setForm({ ...form, products: form.products.filter((p) => p.id !== id) }); }

  if (!isAdmin) return null;

  // ========== MODO EDIÇÃO ==========
  if (editing !== null) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>←</button>
          <h1 style={{ fontSize: "1.5rem" }}>{editing === "new" ? "Novo Evento" : "Editar Evento"}</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {[
            { id: "details", label: "Detalhes" },
            { id: "products", label: `Produtos (${form.products?.length || 0})` },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1.5px solid",
              borderColor: tab === t.id ? "var(--egbe-green)" : "#e5e7eb",
              background: tab === t.id ? "var(--egbe-green)" : "white",
              color: tab === t.id ? "white" : "#666", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>

        {/* TAB: Detalhes */}
        {tab === "details" && (
          <div className="card" style={{ maxWidth: "700px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Título do evento</label>
                <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Odún Ọ̀ṣun 2026" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Descrição</label>
                <FRichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="Detalhes do evento, programação, informações importantes..." minHeight="140px" />
              </div>
              <div>
                <label className="label">Data início</label>
                <input className="input-field" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label">Data fim</label>
                <input className="input-field" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Local</label>
                <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Endereço ou link online" />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {EVENT_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
              </div>
              <div>
                <label className="label">Valor inscrição (R$)</label>
                <input className="input-field" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="label">Capacidade máxima (0 = ilimitado)</label>
                <input className="input-field" type="number" min="0" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="label">Visibilidade</label>
                <select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="public">Público (todos veem)</option>
                  <option value="members">Apenas membros</option>
                  <option value="private">Privado (apenas convidados)</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>
              <div>
                <label className="label">URL da imagem de capa</label>
                <input className="input-field" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" id="regOpen" checked={form.registrationOpen} onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })} />
                <label htmlFor="regOpen" style={{ fontSize: "0.88rem" }}>Inscrições abertas</label>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <button onClick={() => setEditing(null)} className="btn btn-secondary" style={{ padding: "0.6rem 1.25rem" }}>Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ padding: "0.6rem 1.25rem" }}>{saving ? "Salvando..." : "Salvar Evento"}</button>
            </div>
          </div>
        )}

        {/* TAB: Produtos */}
        {tab === "products" && (
          <div className="card" style={{ maxWidth: "700px" }}>
            <p style={{ color: "#666", fontSize: "0.88rem", marginBottom: "1rem" }}>
              Produtos disponíveis para compra durante este evento (ex: kits rituais, alimentos sagrados, materiais).
            </p>
            {form.products?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                {form.products.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</span>
                      <span style={{ color: "var(--egbe-green)", fontWeight: 600, marginLeft: "0.75rem" }}>R$ {p.price.toFixed(2)}</span>
                      {p.description && <p style={{ color: "#888", fontSize: "0.8rem", marginTop: "0.15rem" }}>{p.description}</p>}
                    </div>
                    <button onClick={() => removeProduct(p.id)} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: "1rem", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
              <h4 style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>Adicionar produto</h4>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <input className="input-field" placeholder="Nome do produto" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                <input className="input-field" type="number" min="0" step="0.01" placeholder="Preço" value={newProduct.price || ""} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <input className="input-field" placeholder="Descrição (opcional)" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} style={{ marginBottom: "0.75rem" }} />
              <button className="btn btn-primary" onClick={addProduct} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>+ Adicionar</button>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ padding: "0.6rem 1.25rem" }}>{saving ? "Salvando..." : "Salvar Evento"}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== MODO LISTA ==========
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gerenciar Eventos</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{events.length} eventos</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Evento</button>
      </div>

      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {events.map((evt) => {
            const status = STATUS_OPTIONS.find((s) => s.value === evt.status);
            return (
              <div key={evt.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "10px", background: status?.color + "20", color: status?.color }}>{status?.label || evt.status}</span>
                  <span style={{ fontSize: "0.75rem", color: "#888" }}>{EVENT_TYPES.find((t) => t.value === evt.type)?.label}</span>
                </div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>{evt.title}</h3>
                <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                  {evt.date ? new Date(evt.date).toLocaleDateString("pt-BR") : "Sem data"}
                  {evt.price > 0 && <> — <strong style={{ color: "var(--egbe-green)" }}>R$ {evt.price.toFixed(2)}</strong></>}
                </p>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button onClick={() => openEdit(evt)} className="btn btn-secondary" style={{ padding: "0.35rem 0.8rem", fontSize: "0.78rem" }}>Editar</button>
                  <button onClick={() => handleDelete(evt.id)} style={{ padding: "0.35rem 0.8rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "4px", color: "var(--egbe-red)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>Remover</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
