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

const EMPTY_COURSE = {
  title: "", description: "", instructor: "", startDate: "", endDate: "",
  schedule: "", price: 0, maxStudents: 0, status: "draft", visibility: "public",
  symplaEventId: "", streamYardUrl: "", youtubeVideoId: "", youtubePlaylistId: "",
  recordingAvailable: false, recordingPublic: false,
  certificateEnabled: true, certificateHours: 0, certificateTemplate: "default",
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
            message: form.description?.slice(0, 200) || `${form.instructor ? "Com " + form.instructor + " · " : ""}Início: ${form.startDate || "em breve"}`,
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
              <div style={{ gridColumn: "1 / -1" }}><label className="label">Descrição</label><textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} /></div>
              <div><label className="label">Instrutor(a)</label><input className="input-field" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} /></div>
              <div><label className="label">Horário / Agenda</label><input className="input-field" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Sábados, 10h-12h" /></div>
              <div><label className="label">Data início</label><input className="input-field" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label className="label">Data fim</label><input className="input-field" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              <div><label className="label">Valor (R$)</label><input className="input-field" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="label">Vagas (0 = ilimitado)</label><input className="input-field" type="number" min="0" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) || 0 })} /></div>
              <div><label className="label">Status</label><select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}</select></div>
              <div><label className="label">Visibilidade</label><select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}><option value="public">Público</option><option value="members">Membros</option><option value="private">Privado</option></select></div>
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
            <h4 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Módulos do curso</h4>
            {form.modules?.map((m, i) => (
              <div key={m.id || i} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "0.5rem" }}>
                <div><span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{i + 1}. {m.title}</span>{m.description && <p style={{ color: "#888", fontSize: "0.8rem" }}>{m.description}</p>}</div>
                <button onClick={() => setForm({ ...form, modules: form.modules.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <input className="input-field" placeholder="Título do módulo" value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} style={{ flex: 2 }} />
              <input className="input-field" placeholder="Descrição" value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} style={{ flex: 3 }} />
              <button className="btn btn-primary" onClick={() => { if (newModule.title) { setForm({ ...form, modules: [...(form.modules || []), { ...newModule, id: Date.now().toString() }] }); setNewModule({ title: "", description: "" }); } }} style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem" }}>+</button>
            </div>

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

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div><label className="label">Carga horária</label><input className="input-field" type="number" min="0" value={form.certificateHours} onChange={(e) => setForm({ ...form, certificateHours: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">Template</label><select className="input-field" value={form.certificateTemplate} onChange={(e) => setForm({ ...form, certificateTemplate: e.target.value })}><option value="default">Padrão Ẹgbẹ́</option><option value="formal">Formal</option><option value="minimal">Minimalista</option></select></div>
              </div>
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
                  {course.instructor && <>{course.instructor} — </>}{course.schedule || "Sem horário"}
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
