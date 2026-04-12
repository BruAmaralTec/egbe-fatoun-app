// ========================================
// components/admin/FNotificacoesAdmin.js
// [F = Frontend Component]
// Gestão de notificações — envio manual e histórico
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, deleteDoc, doc, limit } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { notifyUsers, notifyByRoles, notifyAll } from "@/lib/LNotifications";
import { ROLES } from "@/lib/LPermissions";

const CATEGORIES = [
  { value: "system", label: "Sistema", icon: "⚙️" },
  { value: "event", label: "Eventos", icon: "📅" },
  { value: "course", label: "Cursos", icon: "📚" },
  { value: "ritual", label: "Rituais", icon: "🕯️" },
  { value: "payment", label: "Pagamentos", icon: "💳" },
];

export default function FNotificacoesAdmin() {
  const { profile, isAdmin, isConselho } = useAuth();
  const router = useRouter();
  const canAccess = isAdmin || isConselho;

  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [target, setTarget] = useState("all"); // all | roles | users
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", category: "system", link: "" });

  useEffect(() => {
    if (profile && !canAccess) router.push("/dashboard");
  }, [profile, canAccess, router]);

  useEffect(() => {
    async function load() {
      try {
        const [usersSnap, notifsSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), orderBy("displayName"))),
          getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(100))),
        ]);
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // Agrupa notificações por título+mensagem+createdAt arredondado pro minuto
        const notifs = notifsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const grouped = {};
        for (const n of notifs) {
          const ts = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
          const key = `${n.title}|${n.message}|${ts.toISOString().slice(0, 16)}`;
          if (!grouped[key]) grouped[key] = { ...n, count: 0, ids: [], recipients: [] };
          grouped[key].count += 1;
          grouped[key].ids.push(n.id);
          grouped[key].recipients.push(n.userId);
        }
        setHistory(Object.values(grouped));
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSend() {
    if (!form.title || !form.message) {
      alert("Preencha título e mensagem.");
      return;
    }
    setSending(true);
    try {
      const data = { title: form.title, message: form.message, category: form.category, link: form.link || null };
      if (target === "all") {
        await notifyAll(data);
      } else if (target === "roles") {
        if (selectedRoles.length === 0) { alert("Selecione pelo menos um perfil."); setSending(false); return; }
        await notifyByRoles(selectedRoles, data);
      } else {
        if (selectedUsers.length === 0) { alert("Selecione pelo menos um usuário."); setSending(false); return; }
        await notifyUsers(selectedUsers, data);
      }
      setSent(true);
      setForm({ title: "", message: "", category: "system", link: "" });
      setSelectedRoles([]);
      setSelectedUsers([]);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      alert("Erro ao enviar: " + err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteGroup(ids) {
    if (!confirm(`Remover ${ids.length} notificação(ões)?`)) return;
    for (const id of ids) {
      await deleteDoc(doc(db, "notifications", id));
    }
    setHistory((prev) => prev.filter((h) => h.ids[0] !== ids[0]));
  }

  if (!canAccess) return null;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gestão de Notificações</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Envie avisos para usuários e gerencie o histórico</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1rem" }}>
        {/* Criar nova */}
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Nova notificação</h3>

          <div style={{ marginBottom: "0.75rem" }}>
            <label className="label">Destinatários</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[{ v: "all", l: "Todos os usuários" }, { v: "roles", l: "Por perfil" }, { v: "users", l: "Usuários específicos" }].map((t) => (
                <button key={t.v} onClick={() => setTarget(t.v)} className={`btn ${target === t.v ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "0.82rem", padding: "0.4rem 0.8rem" }}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          {target === "roles" && (
            <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.78rem", color: "#666", marginBottom: "0.5rem" }}>Selecione os perfis:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                {ROLES.map((r) => (
                  <label key={r.value} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={selectedRoles.includes(r.value)} onChange={(e) => {
                      setSelectedRoles(e.target.checked ? [...selectedRoles, r.value] : selectedRoles.filter((x) => x !== r.value));
                    }} />
                    <span className={`badge badge-${r.value}`}>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {target === "users" && (
            <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px", maxHeight: "200px", overflowY: "auto" }}>
              <p style={{ fontSize: "0.78rem", color: "#666", marginBottom: "0.5rem" }}>Selecione os usuários:</p>
              {users.map((u) => (
                <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={(e) => {
                    setSelectedUsers(e.target.checked ? [...selectedUsers, u.id] : selectedUsers.filter((x) => x !== u.id));
                  }} />
                  <span>{u.displayName || u.email}</span>
                  <span className={`badge badge-${u.role || "cliente"}`} style={{ marginLeft: "auto" }}>{u.role || "cliente"}</span>
                </label>
              ))}
            </div>
          )}

          <div style={{ marginBottom: "0.75rem" }}>
            <label className="label">Categoria</label>
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.icon} {c.label}</option>))}
            </select>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label className="label">Título</label>
            <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Festival de Ìyàmi" maxLength={100} />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label className="label">Mensagem</label>
            <textarea className="input-field" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Detalhes da notificação..." maxLength={500} style={{ resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Link (opcional)</label>
            <input className="input-field" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/dashboard/eventos" />
            <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.25rem" }}>Rota interna que o usuário abre ao clicar.</p>
          </div>

          <button onClick={handleSend} className="btn btn-primary" disabled={sending} style={{ width: "100%" }}>
            {sending ? "Enviando..." : sent ? "✓ Enviada!" : "Enviar notificação"}
          </button>
        </div>

        {/* Histórico */}
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Histórico ({history.length})</h3>
          {loading ? <p style={{ color: "#888" }}>Carregando...</p> : history.length === 0 ? (
            <p style={{ color: "#ccc", fontStyle: "italic", fontSize: "0.88rem" }}>Nenhuma notificação enviada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "600px", overflowY: "auto" }}>
              {history.map((h, i) => {
                const cat = CATEGORIES.find((c) => c.value === h.category);
                const date = h.createdAt?.toDate ? h.createdAt.toDate() : new Date();
                return (
                  <div key={i} style={{ padding: "0.75rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                          <span>{cat?.icon || "🔔"}</span>
                          <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{h.title}</span>
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "#666" }}>{h.message}</p>
                        <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.3rem" }}>
                          {date.toLocaleDateString("pt-BR")} às {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {h.count} destinatário(s)
                        </p>
                      </div>
                      <button onClick={() => handleDeleteGroup(h.ids)} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
