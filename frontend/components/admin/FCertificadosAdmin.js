// ========================================
// components/admin/FCertificadosAdmin.js
// [F = Frontend Component]
// Geração de certificados para cursos
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useModal } from "@/lib/LModalContext";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

export default function FCertificadosAdmin() {
  const { isAdmin } = useAuth();
  const { showAlert } = useModal();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentName: "", oruko: "", courseName: "", hours: 24, date: new Date().toISOString().split("T")[0] });
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "certificates"), orderBy("createdAt", "desc"));
      try {
        const snap = await getDocs(q);
        setCertificates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* collection may not exist */ }
      setLoading(false);
    }
    load();
  }, []);

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "EGB-";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += "-";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += "-FIF";
    return code;
  }

  async function handleGenerate() {
    if (!form.studentName || !form.courseName) return showAlert("Nome do aluno e curso são obrigatórios");
    setGenerating(true);
    const code = generateCode();
    const cert = { ...form, code, createdAt: new Date() };
    try {
      const ref = await addDoc(collection(db, "certificates"), cert);
      setCertificates(prev => [{ id: ref.id, ...cert }, ...prev]);
      setPreview(cert);
    } catch (err) { await showAlert("Erro: " + err.message); }
    finally { setGenerating(false); }
  }

  if (!isAdmin) return null;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Certificados</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Gere certificados de conclusão para os cursos</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
        {/* Formulário */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Gerar novo certificado</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div><label className="label">Nome do aluno</label><input className="input-field" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} placeholder="Nome completo" /></div>
            <div><label className="label">Orúkọ (opcional)</label><input className="input-field" value={form.oruko} onChange={e => setForm({ ...form, oruko: e.target.value })} placeholder="Nome de iniciação" /></div>
            <div><label className="label">Nome do curso</label><input className="input-field" value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} placeholder="Ex: Fundamentos do Ifá" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
              <div><label className="label">Carga horária</label><input className="input-field" type="number" value={form.hours} onChange={e => setForm({ ...form, hours: parseInt(e.target.value) || 0 })} /></div>
              <div><label className="label">Data de conclusão</label><input className="input-field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <button className="btn btn-gold" onClick={handleGenerate} disabled={generating} style={{ width: "100%", justifyContent: "center" }}>
              {generating ? "Gerando..." : "📜 Gerar Certificado"}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          {preview ? (
            <div style={{ background: "white", border: "3px solid var(--egbe-yellow)", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--egbe-green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.2rem", fontWeight: 700, color: "var(--egbe-yellow)" }}>Ẹ</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", color: "var(--egbe-green)", fontWeight: 600 }}>Ẹgbẹ́ Fátọ́ún · Templo Religioso de Ìfá e Òrìṣà</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", margin: "0.75rem 0", color: "var(--egbe-yellow)" }}>Certificado de Conclusão</h2>
              <p style={{ fontSize: "0.85rem", color: "#888" }}>Certificamos que</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 600, color: "var(--egbe-green)", margin: "0.5rem 0" }}>{preview.studentName}</p>
              {preview.oruko && <p style={{ fontStyle: "italic", color: "var(--egbe-yellow)", fontSize: "0.9rem" }}>Orúkọ: {preview.oruko}</p>}
              <p style={{ fontSize: "0.88rem", color: "#555", margin: "0.75rem auto", maxWidth: "400px", lineHeight: 1.6 }}>
                concluiu com êxito o curso de <strong>{preview.courseName}</strong>, com carga horária de {preview.hours} horas, ministrado pela Ìyánífá Fátọ́ún.
              </p>
              <p style={{ fontStyle: "italic", color: "var(--egbe-green)", fontSize: "0.9rem" }}>Àṣẹ o!</p>
              <div style={{ marginTop: "1rem", padding: "0.5rem", background: "#f9fafb", borderRadius: "6px" }}>
                <code style={{ fontSize: "0.78rem", color: "#888", letterSpacing: "2px" }}>{preview.code}</code>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "3rem", color: "#ccc" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📜</p>
              <p>O preview do certificado aparecerá aqui</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de emitidos */}
      {certificates.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Certificados emitidos ({certificates.length})</h3>
          {certificates.slice(0, 10).map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.studentName}</span>
                <span style={{ color: "#888", fontSize: "0.8rem", marginLeft: "0.5rem" }}>— {c.courseName}</span>
              </div>
              <code style={{ fontSize: "0.72rem", color: "var(--egbe-green)" }}>{c.code}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
