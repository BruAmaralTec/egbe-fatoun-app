// ========================================
// components/admin/FUsuariosAdmin.js
// [F = Frontend Component]
// Gerenciamento de Usuários — CRUD completo
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, query, orderBy } from "firebase/firestore";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db } from "@/lib/LFirebase";
import FRichTextEditor from "@/components/FRichTextEditor";

import { ROLES } from "@/lib/LPermissions";

export default function FUsuariosAdmin() {
  const { profile, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [addingIniciacao, setAddingIniciacao] = useState(false);
  const [novaIniciacao, setNovaIniciacao] = useState({ tipo: "orisa", nome: "", data: "", oruko: "" });
  const [addingCargo, setAddingCargo] = useState(false);
  const [novoCargo, setNovoCargo] = useState({ nome: "", data: "", descricao: "" });
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ displayName: "", email: "", password: "", role: "cliente" });
  const [createSaving, setCreateSaving] = useState(false);

  useEffect(() => { if (profile && !isAdmin) router.push("/dashboard"); }, [profile, isAdmin, router]);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  function openEdit(user) {
    setEditing(user.id);
    setForm({
      displayName: user.displayName || "", communityName: user.communityName || "",
      email: user.email || "",
      cpf: user.cpf || "", phone: user.phone || "",
      role: user.role || "cliente", oruko: user.oruko || "",
      initiacoes: user.initiacoes || [],
      cargos: user.cargos || [],
      observacoes: user.observacoes || "",
    });
    setAddingIniciacao(false);
    setAddingCargo(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", editing), { ...form, updatedAt: new Date() });
      setUsers((prev) => prev.map((u) => (u.id === editing ? { ...u, ...form } : u)));
      setEditing(null);
    } catch (err) { alert("Erro ao salvar: " + err.message); }
    finally { setSaving(false); }
  }

  function addIniciacao() {
    if (!novaIniciacao.nome) return;
    setForm({ ...form, initiacoes: [...form.initiacoes, { ...novaIniciacao, id: Date.now().toString() }] });
    setNovaIniciacao({ tipo: "orisa", nome: "", data: "", oruko: "" });
    setAddingIniciacao(false);
  }

  function removeIniciacao(id) { setForm({ ...form, initiacoes: form.initiacoes.filter((i) => i.id !== id) }); }

  function addCargo() {
    if (!novoCargo.nome) return;
    setForm({ ...form, cargos: [...(form.cargos || []), { ...novoCargo, id: Date.now().toString() }] });
    setNovoCargo({ nome: "", data: "", descricao: "" });
    setAddingCargo(false);
  }
  function removeCargo(id) { setForm({ ...form, cargos: (form.cargos || []).filter((c) => c.id !== id) }); }

  async function handleCreate() {
    const { displayName, email, password, role } = createForm;
    if (!displayName || !email || !password) return alert("Preencha nome, email e senha.");
    if (password.length < 6) return alert("Senha deve ter pelo menos 6 caracteres.");
    setCreateSaving(true);
    try {
      // Instância secundária pra não deslogar o admin
      const primary = getApp();
      const secondaryName = "user-creation-" + Date.now();
      const secondary = getApps().find((a) => a.name === secondaryName) || initializeApp(primary.options, secondaryName);
      const secondaryAuth = getAuth(secondary);

      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        email, displayName, role,
        cpf: "", phone: "", oruko: "",
        initiacoes: [], observacoes: "",
        createdAt: new Date(),
      });
      await signOut(secondaryAuth);

      setUsers((prev) => [{ id: cred.user.uid, email, displayName, role, initiacoes: [] }, ...prev]);
      setCreateForm({ displayName: "", email: "", password: "", role: "cliente" });
      setCreating(false);
    } catch (err) {
      const msg = err.code === "auth/email-already-in-use" ? "Este email já está cadastrado." : err.message;
      alert("Erro ao criar: " + msg);
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleDelete(userId) {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    await deleteDoc(doc(db, "users", userId));
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.cpf?.includes(search) || u.oruko?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (!isAdmin) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gerenciar Usuários</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{users.length} usuários cadastrados</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary" style={{ padding: "0.6rem 1.25rem" }}>
          + Novo usuário
        </button>
      </div>

      {/* Busca e filtros */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input className="input-field" type="text" placeholder="Buscar por nome, email, CPF ou Orúkọ..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: "250px" }} />
        <select className="input-field" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ width: "180px" }}>
          <option value="all">Todos os perfis</option>
          {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
        </select>
      </div>

      {/* Tabela */}
      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Nome", "Email", "CPF", "Orúkọ", "Perfil", "Ações"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#666", borderBottom: "1px solid #e5e7eb", fontSize: "0.8rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{user.displayName || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#666" }}>{user.email || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.82rem" }}>{user.cpf || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontStyle: user.oruko ? "normal" : "italic", color: user.oruko ? "var(--egbe-green-dark)" : "#ccc" }}>{user.oruko || "Não atribuído"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}><span className={`badge badge-${user.role || "cliente"}`}>{ROLES.find((r) => r.value === user.role)?.label || user.role}</span></td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => openEdit(user)} style={{ padding: "0.3rem 0.7rem", background: "none", border: "1.5px solid var(--egbe-green)", borderRadius: "4px", color: "var(--egbe-green)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>Editar</button>
                      <button onClick={() => handleDelete(user.id)} style={{ padding: "0.3rem 0.7rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "4px", color: "var(--egbe-red)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Nenhum usuário encontrado.</p>}
        </div>
      )}

      {/* Modal de edição */}
      {editing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onMouseDown={(e) => { e.currentTarget.dataset.mdTarget = e.target === e.currentTarget ? "backdrop" : "content"; }}
          onMouseUp={(e) => { if (e.currentTarget.dataset.mdTarget === "backdrop" && e.target === e.currentTarget) setEditing(null); }}
        >
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>Editar Usuário</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div><label className="label">Nome completo</label><input className="input-field" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
              <div><label className="label">Chamado na comunidade</label><input className="input-field" value={form.communityName} onChange={(e) => setForm({ ...form, communityName: e.target.value })} placeholder="Apelido na comunidade" /></div>
              <div><label className="label">Email</label><input className="input-field" value={form.email} disabled style={{ opacity: 0.6 }} /></div>
              <div><label className="label">CPF</label><input className="input-field" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
              <div><label className="label">Telefone</label><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            </div>
            <div style={{ marginBottom: "1rem" }}><label className="label">Perfil de acesso</label><select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}</select></div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Orúkọ (nome de iniciação)</label>
              <input className="input-field" value={form.oruko} onChange={(e) => setForm({ ...form, oruko: e.target.value })} placeholder="Nome atribuído na iniciação" />
              <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem" }}>Preenchido apenas pelos administradores após cerimônia.</p>
            </div>
            {/* Iniciações */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="label" style={{ margin: 0 }}>Iniciações na casa</label>
                <button onClick={() => setAddingIniciacao(true)} style={{ padding: "0.25rem 0.6rem", background: "var(--egbe-green)", color: "white", border: "none", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>+ Adicionar</button>
              </div>
              {form.initiacoes?.length > 0 ? form.initiacoes.map((ini) => (
                <div key={ini.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "0.5rem" }}>
                  <div>
                    {ini.tipo && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "4px", background: ini.tipo === "ifa" ? "#fef3c7" : "#dbeafe", color: ini.tipo === "ifa" ? "#92400e" : "#1e40af", fontWeight: 600, marginRight: "0.5rem", textTransform: "uppercase" }}>{ini.tipo === "ifa" ? "Ifá" : "Òrìṣà"}</span>}
                    <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{ini.nome}</span>
                    {ini.data && <span style={{ color: "#888", fontSize: "0.8rem", marginLeft: "0.5rem" }}>— {ini.data}</span>}
                    {ini.oruko && <p style={{ color: "var(--egbe-green-dark)", fontSize: "0.8rem", marginTop: "0.15rem", fontStyle: "italic" }}>Orúkọ: {ini.oruko}</p>}
                  </div>
                  <button onClick={() => removeIniciacao(ini.id)} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer" }}>✕</button>
                </div>
              )) : <p style={{ color: "#ccc", fontSize: "0.85rem", fontStyle: "italic" }}>Nenhuma iniciação registrada.</p>}
              {addingIniciacao && (
                <div style={{ marginTop: "0.75rem", padding: "1rem", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div>
                      <label className="label">Tipo de iniciação</label>
                      <select className="input-field" value={novaIniciacao.tipo} onChange={(e) => setNovaIniciacao({ ...novaIniciacao, tipo: e.target.value })}>
                        <option value="orisa">Òrìṣà</option>
                        <option value="ifa">Ifá</option>
                      </select>
                    </div>
                    <div><label className="label">Nome da iniciação</label><input className="input-field" value={novaIniciacao.nome} onChange={(e) => setNovaIniciacao({ ...novaIniciacao, nome: e.target.value })} placeholder="Ex: Ìṣẹ̀fá, Ìbọ̀rìṣà..." /></div>
                    <div><label className="label">Data da iniciação</label><input className="input-field" type="date" value={novaIniciacao.data} onChange={(e) => setNovaIniciacao({ ...novaIniciacao, data: e.target.value })} /></div>
                    <div><label className="label">Orúkọ da iniciação</label><input className="input-field" value={novaIniciacao.oruko} onChange={(e) => setNovaIniciacao({ ...novaIniciacao, oruko: e.target.value.slice(0, 100) })} placeholder="Nome recebido na iniciação" maxLength={100} /></div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-primary" onClick={addIniciacao} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>Adicionar</button>
                    <button onClick={() => setAddingIniciacao(false)} style={{ padding: "0.4rem 1rem", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "0.82rem" }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Cargos */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="label" style={{ margin: 0 }}>Cargos recebidos</label>
                <button onClick={() => setAddingCargo(true)} style={{ padding: "0.25rem 0.6rem", background: "var(--egbe-yellow)", color: "white", border: "none", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>+ Adicionar</button>
              </div>
              {(form.cargos || []).length > 0 ? form.cargos.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a", marginBottom: "0.5rem" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#92400e" }}>{c.nome}</span>
                    {c.data && <span style={{ color: "#888", fontSize: "0.8rem", marginLeft: "0.5rem" }}>— {c.data}</span>}
                    {c.descricao && <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "0.15rem" }}>{c.descricao}</p>}
                  </div>
                  <button onClick={() => removeCargo(c.id)} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer" }}>✕</button>
                </div>
              )) : <p style={{ color: "#ccc", fontSize: "0.85rem", fontStyle: "italic" }}>Nenhum cargo registrado.</p>}
              {addingCargo && (
                <div style={{ marginTop: "0.75rem", padding: "1rem", background: "#fffbeb", borderRadius: "8px", border: "1px solid #fde68a" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div><label className="label">Nome do cargo</label><input className="input-field" value={novoCargo.nome} onChange={(e) => setNovoCargo({ ...novoCargo, nome: e.target.value })} placeholder="Ex: Ìyálọ́rìṣà, Bàbálòrìṣà, Ẹlẹ́ẹ̀gun..." /></div>
                    <div><label className="label">Data</label><input className="input-field" type="date" value={novoCargo.data} onChange={(e) => setNovoCargo({ ...novoCargo, data: e.target.value })} /></div>
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label className="label">Descrição (opcional)</label>
                    <input className="input-field" value={novoCargo.descricao} onChange={(e) => setNovoCargo({ ...novoCargo, descricao: e.target.value })} placeholder="Detalhes sobre o cargo..." />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-primary" onClick={addCargo} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>Adicionar</button>
                    <button onClick={() => setAddingCargo(false)} style={{ padding: "0.4rem 1rem", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "0.82rem" }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">Observações</label>
              <FRichTextEditor value={form.observacoes} onChange={(html) => setForm({ ...form, observacoes: html })} placeholder="Notas internas sobre o usuário..." minHeight="120px" />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} className="btn btn-secondary" style={{ padding: "0.6rem 1.25rem" }}>Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ padding: "0.6rem 1.25rem" }}>{saving ? "Salvando..." : "Salvar alterações"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação */}
      {creating && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onMouseDown={(e) => { e.currentTarget.dataset.mdTarget = e.target === e.currentTarget ? "backdrop" : "content"; }}
          onMouseUp={(e) => { if (e.currentTarget.dataset.mdTarget === "backdrop" && e.target === e.currentTarget) setCreating(false); }}
        >
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "500px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>Novo Usuário</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div>
                <label className="label">Nome completo</label>
                <input className="input-field" value={createForm.displayName} onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })} placeholder="Nome do usuário" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input-field" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="label">Senha inicial</label>
                <input className="input-field" type="text" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.25rem" }}>O usuário poderá alterar depois de logar.</p>
              </div>
              <div>
                <label className="label">Perfil</label>
                <select className="input-field" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                  {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setCreating(false)} className="btn btn-secondary" style={{ padding: "0.6rem 1.25rem" }} disabled={createSaving}>Cancelar</button>
              <button onClick={handleCreate} className="btn btn-primary" disabled={createSaving} style={{ padding: "0.6rem 1.25rem" }}>
                {createSaving ? "Criando..." : "Criar usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
