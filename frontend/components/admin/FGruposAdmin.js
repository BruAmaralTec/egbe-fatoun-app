// ========================================
// components/admin/FGruposAdmin.js
// [F = Frontend Component]
// Gestão de grupos dinâmicos — CRUD + envio de notificações + histórico
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where,
  serverTimestamp, orderBy as fbOrderBy,
} from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { createNotification } from "@/lib/LNotifications";

const DEFAULT_COLORS = ["#1B6B3A", "#B22222", "#D4A017", "#1a4080", "#6366f1", "#6d28d9", "#0891b2", "#059669"];

const EMPTY_GROUP = {
  name: "",
  color: DEFAULT_COLORS[0],
  objective: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  members: [], // [{ userId, addedAt: Date, removedAt?: Date }]
};

function isActive(group) {
  if (!group.endDate) return true;
  const end = new Date(group.endDate + "T23:59:59");
  return end >= new Date();
}

function activeMembers(members = []) {
  return members.filter((m) => !m.removedAt);
}

export default function FGruposAdmin() {
  const { user, isConselho } = useAuth();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | form | detail
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_GROUP });
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (!isConselho) return;
    async function load() {
      const [gs, us] = await Promise.all([
        getDocs(collection(db, "groups")),
        getDocs(collection(db, "users")),
      ]);
      setGroups(gs.docs.map((d) => ({ id: d.id, ...d.data() })));
      setUsers(us.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load().catch((e) => { console.error(e); setLoading(false); });
  }, [isConselho]);

  if (!isConselho) return <p>Acesso restrito ao Conselho e Administradores.</p>;

  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  function startNew() {
    setForm({ ...EMPTY_GROUP });
    setSelectedId(null);
    setUserSearch("");
    setView("form");
  }

  function openDetail(g) {
    setSelectedId(g.id);
    setForm({ ...g });
    setView("detail");
  }

  function editGroup(g) {
    setForm({ ...g });
    setSelectedId(g.id);
    setUserSearch("");
    setView("form");
  }

  function toggleMember(uid) {
    const cur = form.members || [];
    const existing = cur.find((m) => m.userId === uid);
    if (existing && !existing.removedAt) {
      // já é membro ativo → desmarcar (soft remove)
      setForm({ ...form, members: cur.map((m) => m.userId === uid ? { ...m, removedAt: new Date().toISOString() } : m) });
    } else if (existing && existing.removedAt) {
      // reativar
      setForm({ ...form, members: cur.map((m) => m.userId === uid ? { userId: uid, addedAt: m.addedAt || new Date().toISOString() } : m) });
    } else {
      setForm({ ...form, members: [...cur, { userId: uid, addedAt: new Date().toISOString() }] });
    }
  }

  async function handleSave() {
    if (!form.name) return alert("Informe o nome do grupo.");
    if (!form.startDate) return alert("Informe a data de início.");
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.id;
      if (selectedId) {
        await updateDoc(doc(db, "groups", selectedId), { ...payload, updatedAt: serverTimestamp() });
        setGroups((prev) => prev.map((g) => g.id === selectedId ? { ...g, ...payload } : g));
      } else {
        const ref = await addDoc(collection(db, "groups"), { ...payload, createdAt: serverTimestamp() });
        setGroups((prev) => [...prev, { id: ref.id, ...payload }]);
        setSelectedId(ref.id);
      }
      setView("detail");
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remover este grupo? O histórico de envios também é apagado.")) return;
    await deleteDoc(doc(db, "groups", id));
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setView("list");
  }

  if (view === "form") {
    return <GroupForm
      form={form}
      setForm={setForm}
      users={users}
      userSearch={userSearch}
      setUserSearch={setUserSearch}
      saving={saving}
      isEditing={!!selectedId}
      onCancel={() => setView(selectedId ? "detail" : "list")}
      onSave={handleSave}
      onDelete={selectedId ? () => handleDelete(selectedId) : null}
      toggleMember={toggleMember}
    />;
  }

  if (view === "detail") {
    const group = groups.find((g) => g.id === selectedId) || form;
    return <GroupDetail
      group={group}
      userById={userById}
      currentUserUid={user?.uid}
      onBack={() => setView("list")}
      onEdit={() => editGroup(group)}
      onDelete={() => handleDelete(group.id)}
    />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Grupos</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{groups.length} grupo(s) · paralelos aos perfis, com ciclo de vida próprio</p>
        </div>
        <button className="btn btn-primary" onClick={startNew}>+ Novo grupo</button>
      </div>

      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        groups.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</p>
            <p>Nenhum grupo criado. Crie grupos para notificar conjuntos específicos.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {groups.map((g) => {
              const active = isActive(g);
              const activeCount = activeMembers(g.members).length;
              return (
                <button
                  key={g.id}
                  onClick={() => openDetail(g)}
                  className="card"
                  style={{ textAlign: "left", cursor: "pointer", background: "white", border: "1px solid #e5e7eb", padding: "1rem", borderLeft: `4px solid ${g.color || "#888"}`, opacity: active ? 1 : 0.6 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <h3 style={{ fontSize: "1.05rem", margin: 0 }}>{g.name}</h3>
                    {!active && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "12px", background: "#fee2e2", color: "#991b1b", fontWeight: 600 }}>Encerrado</span>}
                  </div>
                  {g.objective && <p style={{ fontSize: "0.82rem", color: "#555", marginBottom: "0.4rem" }}>{g.objective.length > 100 ? g.objective.slice(0, 100) + "…" : g.objective}</p>}
                  <p style={{ fontSize: "0.78rem", color: "#888" }}>
                    {activeCount} membro(s) ativo(s) · {g.startDate}{g.endDate ? ` → ${g.endDate}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ========================================
// Form de criação / edição
// ========================================
function GroupForm({ form, setForm, users, userSearch, setUserSearch, saving, isEditing, onCancel, onSave, onDelete, toggleMember }) {
  const active = activeMembers(form.members);
  const activeIds = new Set(active.map((m) => m.userId));
  const removedIds = new Set((form.members || []).filter((m) => m.removedAt).map((m) => m.userId));

  const candidates = userSearch
    ? users.filter((u) =>
        (u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
         u.email?.toLowerCase().includes(userSearch.toLowerCase())) &&
        !activeIds.has(u.id)
      ).slice(0, 8)
    : [];

  return (
    <div>
      <button className="btn btn-secondary" onClick={onCancel} style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>← Voltar</button>

      <h1 style={{ fontSize: "1.6rem", marginBottom: "1.25rem" }}>{isEditing ? "Editar" : "Novo"} grupo</h1>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <div>
            <label className="label">Nome</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Iniciandos 2026" />
          </div>
          <div>
            <label className="label">Cor</label>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer",
                    background: c, border: form.color === c ? "3px solid #1a1a1a" : "1px solid #d1d5db",
                  }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <label className="label">Objetivo</label>
          <textarea className="input-field" rows={2} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="O que este grupo tem em comum..." style={{ resize: "vertical" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "0.75rem" }}>
          <div>
            <label className="label">Data de início</label>
            <input className="input-field" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Data de encerramento (opcional)</label>
            <input className="input-field" type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <span style={{ fontSize: "0.72rem", color: "#aaa" }}>Vazio = grupo indeterminado</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Membros ({active.length})</h3>
        <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.75rem" }}>
          Adicione usuários. Histórico de saídas fica registrado.
        </p>

        {active.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.75rem" }}>
            {active.map((m) => {
              const u = users.find((x) => x.id === m.userId);
              return (
                <span key={m.userId} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.6rem", background: "white", border: `1.5px solid ${form.color}`, borderRadius: "16px", fontSize: "0.78rem", color: "#333" }}>
                  {u?.displayName || u?.email || m.userId.slice(0, 6)}
                  <button onClick={() => toggleMember(m.userId)} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer", padding: 0, fontSize: "0.95rem", lineHeight: 1 }}>×</button>
                </span>
              );
            })}
          </div>
        )}

        <div style={{ position: "relative" }}>
          <input
            className="input-field"
            placeholder="Buscar usuário para adicionar..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            style={{ fontSize: "0.85rem" }}
          />
          {candidates.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", marginTop: "2px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 10, maxHeight: "220px", overflowY: "auto" }}>
              {candidates.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { toggleMember(u.id); setUserSearch(""); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", borderBottom: "1px solid #f3f4f6", fontFamily: "inherit" }}
                >
                  <strong>{u.displayName || "—"}</strong>
                  <span style={{ color: "#888" }}> · {u.email}</span>
                  {removedIds.has(u.id) && <span style={{ color: "var(--egbe-yellow)", marginLeft: "0.4rem", fontSize: "0.72rem" }}>(reativar — saiu antes)</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar grupo"}
        </button>
        <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
        {onDelete && (
          <button onClick={onDelete} style={{ marginLeft: "auto", padding: "0.55rem 1rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "8px", color: "var(--egbe-red)", cursor: "pointer", fontWeight: 600 }}>
            Remover grupo
          </button>
        )}
      </div>
    </div>
  );
}

// ========================================
// Detail + envio de notificação + histórico
// ========================================
function GroupDetail({ group, userById, currentUserUid, onBack, onEdit, onDelete }) {
  const active = activeMembers(group.members);
  const [dispatches, setDispatches] = useState([]);
  const [loadingDispatches, setLoadingDispatches] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendTitle, setSendTitle] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [requiresConfirm, setRequiresConfirm] = useState(false);
  const [expandedDispatch, setExpandedDispatch] = useState(null);
  const [dispatchStatuses, setDispatchStatuses] = useState({}); // dispatchId → [{userId, read, confirmedAt, createdAt}]

  useEffect(() => {
    if (!group?.id) return;
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "groups", group.id, "dispatches"), fbOrderBy("sentAt", "desc")));
        setDispatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* sub-collection may not exist */ }
      setLoadingDispatches(false);
    }
    load();
  }, [group?.id]);

  async function expandDispatch(dispatchId) {
    if (expandedDispatch === dispatchId) {
      setExpandedDispatch(null);
      return;
    }
    setExpandedDispatch(dispatchId);
    if (!dispatchStatuses[dispatchId]) {
      const snap = await getDocs(query(collection(db, "notifications"), where("dispatchId", "==", dispatchId)));
      setDispatchStatuses((prev) => ({ ...prev, [dispatchId]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
    }
  }

  async function handleSend() {
    if (!sendTitle || !sendMessage) return alert("Informe título e mensagem.");
    if (active.length === 0) return alert("Grupo não tem membros ativos.");
    setSending(true);
    try {
      const dispatchId = `disp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const memberIds = active.map((m) => m.userId);
      // cria as notificações
      await Promise.all(memberIds.map((uid) => createNotification({
        userId: uid,
        title: sendTitle,
        message: sendMessage,
        category: "system",
        groupId: group.id,
        dispatchId,
        requiresConfirmation: requiresConfirm,
      })));
      // cria o doc de histórico
      const dispatchDoc = {
        dispatchId,
        title: sendTitle,
        message: sendMessage,
        sentAt: serverTimestamp(),
        sentBy: currentUserUid || null,
        memberIds,
        requiresConfirmation: requiresConfirm,
      };
      await addDoc(collection(db, "groups", group.id, "dispatches"), dispatchDoc);
      setDispatches((prev) => [{ ...dispatchDoc, sentAt: new Date(), id: "local-" + dispatchId }, ...prev]);
      setSendTitle(""); setSendMessage(""); setRequiresConfirm(false);
    } catch (err) {
      alert("Erro ao enviar: " + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>← Voltar</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: group.color || "#888" }} />
          <h1 style={{ fontSize: "1.6rem", margin: 0 }}>{group.name}</h1>
          {!isActive(group) && <span style={{ fontSize: "0.78rem", padding: "0.2rem 0.55rem", borderRadius: "12px", background: "#fee2e2", color: "#991b1b", fontWeight: 600 }}>Encerrado</span>}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={onEdit}>Editar</button>
          <button onClick={onDelete} style={{ padding: "0.55rem 1rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "8px", color: "var(--egbe-red)", cursor: "pointer", fontWeight: 600 }}>Remover</button>
        </div>
      </div>

      {group.objective && <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "1rem" }}>{group.objective}</p>}
      <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "1.5rem" }}>
        {active.length} membro(s) ativo(s) · {group.startDate}{group.endDate ? ` → ${group.endDate}` : ""}
      </p>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Membros</h3>
        {active.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#aaa", fontStyle: "italic" }}>Nenhum membro ativo.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {active.map((m) => {
              const u = userById[m.userId];
              return (
                <span key={m.userId} style={{ padding: "0.3rem 0.7rem", borderRadius: "14px", background: "#f3f4f6", fontSize: "0.82rem" }}>
                  {u?.displayName || u?.email || m.userId.slice(0, 6)}
                  {u?.oruko && <span style={{ color: "var(--egbe-green-dark)", fontStyle: "italic" }}> · {u.oruko}</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Envio de notificação */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>📬 Enviar notificação ao grupo</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label className="label">Título</label>
            <input className="input-field" value={sendTitle} onChange={(e) => setSendTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Mensagem</label>
            <textarea className="input-field" rows={3} value={sendMessage} onChange={(e) => setSendMessage(e.target.value)} style={{ resize: "vertical" }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#555" }}>
            <input type="checkbox" checked={requiresConfirm} onChange={(e) => setRequiresConfirm(e.target.checked)} />
            Pedir confirmação de visualização (cada membro deve confirmar)
          </label>
          <button className="btn btn-primary" onClick={handleSend} disabled={sending || active.length === 0}>
            {sending ? "Enviando..." : `Enviar a ${active.length} membro(s)`}
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div className="card">
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Histórico de notificações</h3>
        {loadingDispatches ? <p style={{ color: "#888" }}>Carregando...</p> : (
          dispatches.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#aaa", fontStyle: "italic" }}>Nenhuma notificação enviada ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {dispatches.map((d) => {
                const sentDate = d.sentAt?.toDate ? d.sentAt.toDate() : (d.sentAt ? new Date(d.sentAt) : null);
                const statuses = dispatchStatuses[d.dispatchId] || [];
                const readCount = statuses.filter((s) => s.read).length;
                const confirmedCount = statuses.filter((s) => s.confirmedAt).length;
                const isOpen = expandedDispatch === d.dispatchId;
                return (
                  <div key={d.id} style={{ padding: "0.75rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <button onClick={() => expandDispatch(d.dispatchId)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{d.title}</p>
                          <p style={{ fontSize: "0.75rem", color: "#888" }}>
                            {sentDate ? sentDate.toLocaleString("pt-BR") : "—"} · {d.memberIds?.length || 0} destinatários
                            {d.requiresConfirmation && " · pedido confirmação"}
                          </p>
                        </div>
                        <span style={{ fontSize: "1rem", color: "#888" }}>{isOpen ? "▾" : "▸"}</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e5e7eb" }}>
                        <p style={{ fontSize: "0.82rem", color: "#555", marginBottom: "0.5rem" }}>{d.message}</p>
                        <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "0.5rem" }}>
                          {readCount}/{d.memberIds?.length || 0} leram{d.requiresConfirmation && ` · ${confirmedCount} confirmaram`}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          {(d.memberIds || []).map((uid) => {
                            const u = userById[uid];
                            const status = statuses.find((s) => s.userId === uid);
                            const seenAt = status?.read ? "✔ leu" : "não leu";
                            const confirmed = status?.confirmedAt;
                            return (
                              <div key={uid} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", padding: "0.2rem 0" }}>
                                <span>{u?.displayName || uid.slice(0, 6)}</span>
                                <span style={{ color: status?.read ? "var(--egbe-green)" : "#aaa" }}>
                                  {seenAt}{confirmed ? " · ✅ confirmou" : d.requiresConfirmation ? " · aguardando confirmação" : ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
