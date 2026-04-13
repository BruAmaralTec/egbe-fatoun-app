// ========================================
// components/admin/FCursosAdmin.js
// [F = Frontend Component]
// Gerenciamento de Cursos
// CRUD + StreamYard/Sympla/YouTube + certificados
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { notifyAll } from "@/lib/LNotifications";
import FRichTextEditor from "@/components/FRichTextEditor";

const EMPTY_COURSE = {
  title: "", subtitle: "", description: "", objective: "", sacerdotisa: "",
  days: [{ id: "1", date: "", startTime: "", endTime: "" }],
  price: 0, maxStudents: 0, status: "draft", visibility: "public",
  symplaEventId: "", streamYardUrl: "", youtubeVideoId: "", youtubePlaylistId: "",
  recordingAvailable: false, recordingPublic: false,
  certificateEnabled: true, certificateHours: 0, certificateTemplate: "default",
  autentiqueEnabled: false, autentiqueFolderId: "", autentiqueTemplateId: "",
  modules: [], materials: [],
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho", color: "#9ca3af" },
  { value: "open", label: "Inscrições Abertas", color: "#22c55e" },
  { value: "in_progress", label: "Em Andamento", color: "#3b82f6" },
  { value: "finished", label: "Finalizado", color: "#6366f1" },
];

export default function FCursosAdmin() {
  const { isAdmin } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_COURSE });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("details");
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newMaterial, setNewMaterial] = useState({ name: "", url: "", type: "pdf" });

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, [isAdmin]);

  async function handleSave() {
    if (!form.title) return alert("Título é obrigatório");
    setSaving(true);
    try {
      const prevStatus = editing !== "new" ? courses.find((c) => c.id === editing)?.status : null;
      const shouldNotify = form.status === "open" && prevStatus !== "open";

      if (editing === "new") {
        const ref = await addDoc(collection(db, "courses"), { ...form, createdAt: new Date() });
        setCourses((prev) => [{ id: ref.id, ...form }, ...prev]);
      } else {
        await updateDoc(doc(db, "courses", editing), { ...form, updatedAt: new Date() });
        setCourses((prev) => prev.map((c) => (c.id === editing ? { ...c, ...form } : c)));
      }

      if (shouldNotify) {
        try {
          await notifyAll({
            title: `Inscrições abertas: ${form.title}`,
            message: form.description?.slice(0, 200) || `${form.sacerdotisa ? "Com " + form.sacerdotisa + " · " : ""}Início: ${form.days?.[0]?.date || "em breve"}`,
            category: "course",
            link: "/dashboard/cursos",
          });
        } catch (err) { console.warn("Falha ao enviar notificação:", err); }
      }

      setEditing(null);
    } catch (err) { alert("Erro: " + err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Remover este curso?")) return;
    await deleteDoc(doc(db, "courses", id));
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  if (!isAdmin) return null;

  // ========== MODO EDIÇÃO ==========
  if (editing !== null) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>←</button>
          <h1 style={{ fontSize: "1.5rem" }}>{editing === "new" ? "Novo Curso" : "Editar Curso"}</h1>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {[
            { id: "details", label: "Detalhes" },
            { id: "integrations", label: "Integrações" },
            { id: "content", label: `Conteúdo (${(form.modules?.length || 0) + (form.materials?.length || 0)})` },
            { id: "certificate", label: "Certificado" },
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "1 / -1" }}><label className="label">Título</label><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Introdução ao Corpus de Ifá" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label className="label">Subtítulo</label><input className="input-field" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Ex: Fundamentos para iniciantes" /></div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Descrição para Divulgação</label>
                <FRichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="Texto usado em cards e compartilhamento" minHeight="100px" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Objetivo do Curso</label>
                <FRichTextEditor value={form.objective} onChange={(html) => setForm({ ...form, objective: html })} placeholder="O que o aluno vai aprender / competências desenvolvidas" minHeight="120px" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}><label className="label">Sacerdotisa(e)</label><input className="input-field" value={form.sacerdotisa} onChange={(e) => setForm({ ...form, sacerdotisa: e.target.value })} placeholder="Nome da Sacerdotisa ou Sacerdote" /></div>
              <div><label className="label">Valor (R$)</label><input className="input-field" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="label">Vagas (0 = ilimitado)</label><input className="input-field" type="number" min="0" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) || 0 })} /></div>
              <div><label className="label">Status</label><select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}</select></div>
              <div><label className="label">Visibilidade</label><select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}><option value="public">Público</option><option value="members">Membros</option><option value="private">Privado</option></select></div>
            </div>

            {/* Dias do curso */}
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: 600 }}>Agenda do Curso</h4>
                <button
                  onClick={() => setForm({ ...form, days: [...(form.days || []), { id: Date.now().toString(), date: "", startTime: "", endTime: "" }] })}
                  className="btn btn-secondary"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
                >
                  + Adicionar dia
                </button>
              </div>

              {(form.days || []).map((day, i) => (
                <div key={day.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr auto auto", gap: "0.5rem", alignItems: "end", marginBottom: "0.5rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--egbe-green-dark)", paddingBottom: "0.5rem" }}>Dia {i + 1}</div>
                  <div><label style={{ fontSize: "0.72rem", color: "#888" }}>Data</label><input className="input-field" type="date" value={day.date} onChange={(e) => { const d = [...form.days]; d[i] = { ...d[i], date: e.target.value }; setForm({ ...form, days: d }); }} /></div>
                  <div><label style={{ fontSize: "0.72rem", color: "#888" }}>Hora início</label><input className="input-field" type="time" value={day.startTime} onChange={(e) => { const d = [...form.days]; d[i] = { ...d[i], startTime: e.target.value }; setForm({ ...form, days: d }); }} /></div>
                  <div><label style={{ fontSize: "0.72rem", color: "#888" }}>Hora fim</label><input className="input-field" type="time" value={day.endTime} onChange={(e) => { const d = [...form.days]; d[i] = { ...d[i], endTime: e.target.value }; setForm({ ...form, days: d }); }} /></div>
                  <button
                    onClick={() => setForm({ ...form, days: [...form.days, { ...day, id: Date.now().toString(), date: "" }] })}
                    title="Clonar este dia"
                    style={{ padding: "0.5rem 0.75rem", background: "none", border: "1.5px solid var(--egbe-green)", borderRadius: "6px", color: "var(--egbe-green)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                  >
                    Clonar
                  </button>
                  <button
                    onClick={() => form.days.length > 1 && setForm({ ...form, days: form.days.filter((d) => d.id !== day.id) })}
                    disabled={form.days.length <= 1}
                    title="Remover este dia"
                    style={{ padding: "0.5rem 0.6rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "6px", color: "var(--egbe-red)", cursor: form.days.length > 1 ? "pointer" : "not-allowed", fontSize: "0.9rem", opacity: form.days.length > 1 ? 1 : 0.4 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        )}

        {/* TAB: Integrações */}
        {tab === "integrations" && (
          <div className="card" style={{ maxWidth: "700px" }}>
            <p style={{ color: "#666", fontSize: "0.88rem", marginBottom: "1.5rem" }}>Conecte este curso com os serviços externos. As chaves de API ficam na tela de Integrações.</p>

            <div style={{ padding: "1rem", background: "#fff7ed", borderRadius: "8px", border: "1px solid #fed7aa", marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "#c2410c" }}>Sympla — Inscrições</h4>
              <label className="label">ID do evento na Sympla</label>
              <input className="input-field" value={form.symplaEventId} onChange={(e) => setForm({ ...form, symplaEventId: e.target.value })} placeholder="ID numérico do evento" />
            </div>

            <div style={{ padding: "1rem", background: "#f5f3ff", borderRadius: "8px", border: "1px solid #ddd6fe", marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "#6d28d9" }}>StreamYard — Transmissão ao vivo</h4>
              <label className="label">URL da transmissão</label>
              <input className="input-field" value={form.streamYardUrl} onChange={(e) => setForm({ ...form, streamYardUrl: e.target.value })} placeholder="https://streamyard.com/..." />
            </div>

            <div style={{ padding: "1rem", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "#dc2626" }}>YouTube — Gravação</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div><label className="label">ID do vídeo</label><input className="input-field" value={form.youtubeVideoId} onChange={(e) => setForm({ ...form, youtubeVideoId: e.target.value })} placeholder="dQw4w9WgXcQ" /></div>
                <div><label className="label">ID da playlist</label><input className="input-field" value={form.youtubePlaylistId} onChange={(e) => setForm({ ...form, youtubePlaylistId: e.target.value })} placeholder="PL..." /></div>
              </div>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}><input type="checkbox" checked={form.recordingAvailable} onChange={(e) => setForm({ ...form, recordingAvailable: e.target.checked })} /> Gravação para alunos</label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}><input type="checkbox" checked={form.recordingPublic} onChange={(e) => setForm({ ...form, recordingPublic: e.target.checked })} /> Gravação pública</label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        )}

        {/* TAB: Conteúdo */}
        {tab === "content" && (
          <div className="card" style={{ maxWidth: "700px" }}>
            {(() => {
              const contentEditable = ["draft", "open", "in_progress"].includes(form.status);
              return !contentEditable ? (
                <div style={{ padding: "0.75rem 1rem", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", color: "#92400e" }}>
                  🔒 O conteúdo deste curso está bloqueado pois o status é <strong>Finalizado</strong>. Para editar, volte o status para Rascunho, Inscrições Abertas ou Em Andamento na aba Detalhes.
                </div>
              ) : null;
            })()}
            <fieldset disabled={!["draft", "open", "in_progress"].includes(form.status)} style={{ border: "none", padding: 0, margin: 0, opacity: ["draft", "open", "in_progress"].includes(form.status) ? 1 : 0.5 }}>
            <h4 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Módulos do curso</h4>
            {form.modules?.map((m, i) => (
              <div key={m.id || i} style={{ padding: "1rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--egbe-green-dark)", fontSize: "0.85rem" }}>Módulo {i + 1}</span>
                  <input
                    className="input-field"
                    value={m.title}
                    onChange={(e) => { const mods = [...form.modules]; mods[i] = { ...mods[i], title: e.target.value }; setForm({ ...form, modules: mods }); }}
                    placeholder="Título do módulo"
                    style={{ flex: 1 }}
                  />
                  <button onClick={() => setForm({ ...form, modules: form.modules.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "1.5px solid #fecaca", borderRadius: "6px", color: "var(--egbe-red)", cursor: "pointer", padding: "0.4rem 0.7rem", fontSize: "0.85rem" }}>✕</button>
                </div>
                <label style={{ fontSize: "0.78rem", color: "#888", display: "block", marginBottom: "0.3rem" }}>Descrição do módulo</label>
                <FRichTextEditor
                  value={m.description}
                  onChange={(html) => { const mods = [...form.modules]; mods[i] = { ...mods[i], description: html }; setForm({ ...form, modules: mods }); }}
                  placeholder="Descreva o conteúdo, objetivos e temas do módulo..."
                  minHeight="120px"
                />
              </div>
            ))}
            <button
              className="btn btn-secondary"
              onClick={() => setForm({ ...form, modules: [...(form.modules || []), { id: Date.now().toString(), title: "", description: "" }] })}
              style={{ width: "100%", marginBottom: "1.5rem", padding: "0.6rem", fontSize: "0.88rem" }}
            >
              + Adicionar módulo
            </button>

            <h4 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Materiais de apoio</h4>
            {form.materials?.map((m, i) => (
              <div key={m.id || i} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "0.5rem" }}>
                <div><span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{m.name}</span><span style={{ color: "#888", fontSize: "0.78rem", marginLeft: "0.5rem" }}>({m.type})</span></div>
                <button onClick={() => setForm({ ...form, materials: form.materials.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="input-field" placeholder="Nome" value={newMaterial.name} onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} style={{ flex: 2 }} />
              <input className="input-field" placeholder="URL do arquivo" value={newMaterial.url} onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })} style={{ flex: 3 }} />
              <select className="input-field" value={newMaterial.type} onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })} style={{ width: "90px" }}><option value="pdf">PDF</option><option value="video">Vídeo</option><option value="audio">Áudio</option><option value="doc">Doc</option><option value="link">Link</option></select>
              <button className="btn btn-primary" onClick={() => { if (newMaterial.name) { setForm({ ...form, materials: [...(form.materials || []), { ...newMaterial, id: Date.now().toString() }] }); setNewMaterial({ name: "", url: "", type: "pdf" }); } }} style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem" }}>+</button>
            </div>
            </fieldset>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving || !["draft", "open", "in_progress"].includes(form.status)}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        )}

        {/* TAB: Certificado */}
        {tab === "certificate" && (
          <div className="card" style={{ maxWidth: "700px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <input type="checkbox" id="certEnabled" checked={form.certificateEnabled} onChange={(e) => setForm({ ...form, certificateEnabled: e.target.checked })} />
              <label htmlFor="certEnabled" style={{ fontWeight: 600 }}>Gerar certificado para alunos concluintes</label>
            </div>
            {form.certificateEnabled && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div><label className="label">Carga horária</label><input className="input-field" type="number" min="0" value={form.certificateHours} onChange={(e) => setForm({ ...form, certificateHours: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="label">Template</label><select className="input-field" value={form.certificateTemplate} onChange={(e) => setForm({ ...form, certificateTemplate: e.target.value })}><option value="default">Padrão Ẹgbẹ́</option><option value="formal">Formal</option><option value="minimal">Minimalista</option></select></div>
                </div>

                {/* Integração Autentique */}
                <div style={{ padding: "1rem", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <input type="checkbox" id="autentiqueEnabled" checked={form.autentiqueEnabled} onChange={(e) => setForm({ ...form, autentiqueEnabled: e.target.checked })} />
                    <label htmlFor="autentiqueEnabled" style={{ fontWeight: 600, color: "#166534" }}>
                      🔐 Assinar certificado via Autentique
                    </label>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#166534", marginBottom: "0.75rem" }}>
                    Envia o certificado automaticamente pro{" "}
                    <a href="https://docs.autentique.com.br/api" target="_blank" rel="noreferrer" style={{ color: "#166534", textDecoration: "underline" }}>Autentique</a>
                    {" "}para assinatura digital. A chave API é configurada na tela de Integrações.
                  </p>
                  {form.autentiqueEnabled && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label className="label">ID da pasta (Autentique)</label>
                        <input className="input-field" value={form.autentiqueFolderId} onChange={(e) => setForm({ ...form, autentiqueFolderId: e.target.value })} placeholder="Opcional — pasta onde salvar" />
                      </div>
                      <div>
                        <label className="label">ID do template</label>
                        <input className="input-field" value={form.autentiqueTemplateId} onChange={(e) => setForm({ ...form, autentiqueTemplateId: e.target.value })} placeholder="ID do template Autentique" />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
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
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gerenciar Cursos</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{courses.length} cursos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing("new"); setForm({ ...EMPTY_COURSE }); setTab("details"); }}>+ Novo Curso</button>
      </div>

      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {courses.map((course) => {
            const status = STATUS_OPTIONS.find((s) => s.value === course.status);
            return (
              <div key={course.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "10px", background: status?.color + "20", color: status?.color }}>{status?.label}</span>
                  {course.certificateEnabled && <span style={{ fontSize: "0.7rem", color: "var(--egbe-yellow)" }}>📜 Certificado</span>}
                </div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>{course.title}</h3>
                <p style={{ color: "#888", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                  {course.sacerdotisa && <>{course.sacerdotisa} — </>}{course.days?.length ? `${course.days.length} dia(s)` : "Sem agenda"}
                  {course.price > 0 && <> — <strong style={{ color: "var(--egbe-green)" }}>R$ {course.price.toFixed(2)}</strong></>}
                </p>
                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                  {course.symplaEventId && <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "8px", background: "#fff7ed", color: "#c2410c" }}>Sympla</span>}
                  {course.streamYardUrl && <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "8px", background: "#f5f3ff", color: "#6d28d9" }}>StreamYard</span>}
                  {course.youtubeVideoId && <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "8px", background: "#fef2f2", color: "#dc2626" }}>YouTube</span>}
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button onClick={() => { setEditing(course.id); setForm({ ...EMPTY_COURSE, ...course }); setTab("details"); }} className="btn btn-secondary" style={{ padding: "0.35rem 0.8rem", fontSize: "0.78rem" }}>Editar</button>
                  <button onClick={() => handleDelete(course.id)} style={{ padding: "0.35rem 0.8rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "4px", color: "var(--egbe-red)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>Remover</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
