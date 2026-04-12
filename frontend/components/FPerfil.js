// ========================================
// components/FPerfil.js
// [F = Frontend Component]
// Perfil pessoal do membro
// ========================================

"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { useAuth } from "@/lib/LAuthContext";

export default function FPerfil() {
  const { user, profile, setProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  if (!profile) return null;

  const initiacoes = profile.initiacoes || [];

  function startEditing() {
    setForm({
      displayName: profile.displayName || "",
      phone: profile.phone || "",
      cpf: profile.cpf || "",
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        displayName: form.displayName,
        phone: form.phone,
        cpf: form.cpf,
      });
      setProfile((prev) => ({ ...prev, ...form }));
      setEditing(false);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.9rem",
  };

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Meu Perfil</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Seus dados no Ẹgbẹ́ Fátọ́ún</p>

      {/* Hero do perfil */}
      <div style={{ background: "linear-gradient(135deg, var(--egbe-green-dark), var(--egbe-green))", borderRadius: "16px", padding: "2rem", color: "white", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 700, flexShrink: 0 }}>
          {profile.displayName?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <h2 style={{ color: "white", fontSize: "1.5rem", marginBottom: "0.25rem" }}>{profile.displayName || "—"}</h2>
          {profile.oruko && (
            <p style={{ color: "var(--egbe-yellow-light)", fontSize: "1rem", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
              Orúkọ: {profile.oruko}
            </p>
          )}
          <span className={`badge badge-${profile.role || "cliente"}`} style={{ marginTop: "0.5rem" }}>
            {profile.role || "cliente"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        {/* Dados pessoais */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", margin: 0 }}>Dados pessoais</h3>
            {!editing ? (
              <button onClick={startEditing} className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }}>
                Editar
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setEditing(false)} className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }} disabled={saving}>
                  Cancelar
                </button>
                <button onClick={handleSave} className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Nome</label>
                <input style={fieldStyle} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Telefone</label>
                <input style={fieldStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>CPF</label>
                <input style={fieldStyle} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Email</label>
                <input style={{ ...fieldStyle, background: "#f3f4f6", color: "#999" }} value={profile.email} disabled />
                <span style={{ fontSize: "0.75rem", color: "#aaa" }}>Email não pode ser alterado</span>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Perfil</label>
                <input style={{ ...fieldStyle, background: "#f3f4f6", color: "#999" }} value={profile.role || "cliente"} disabled />
                <span style={{ fontSize: "0.75rem", color: "#aaa" }}>Gerenciado pelos administradores</span>
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", fontSize: "0.9rem" }}>
              <tbody>
                {[
                  ["Nome", profile.displayName || "Não informado"],
                  ["Email", profile.email],
                  ["CPF", profile.cpf || "Não informado"],
                  ["Telefone", profile.phone || "Não informado"],
                  ["Perfil", profile.role || "cliente"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.6rem 0", color: "#888", width: "120px" }}>{label}</td>
                    <td style={{ padding: "0.6rem 0", fontWeight: 500 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Iniciações */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Iniciações na casa</h3>
          {initiacoes.length > 0 ? initiacoes.map((ini, i) => (
            <div key={ini.id || i} style={{ padding: "0.75rem", background: "#f0f7f3", borderRadius: "8px", border: "1px solid #d1fae5", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {ini.tipo && (
                    <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "4px", background: ini.tipo === "ifa" ? "#fef3c7" : "#dbeafe", color: ini.tipo === "ifa" ? "#92400e" : "#1e40af", fontWeight: 600, textTransform: "uppercase" }}>
                      {ini.tipo === "ifa" ? "Ifá" : "Òrìṣà"}
                    </span>
                  )}
                  <span style={{ fontWeight: 600, color: "var(--egbe-green-dark)" }}>{ini.nome}</span>
                </div>
                {ini.data && <span style={{ fontSize: "0.8rem", color: "#888" }}>{ini.data}</span>}
              </div>
              {ini.oruko && (
                <p style={{ fontSize: "0.82rem", color: "var(--egbe-green-dark)", marginTop: "0.25rem", fontStyle: "italic" }}>
                  Orúkọ: {ini.oruko}
                </p>
              )}
            </div>
          )) : (
            <p style={{ color: "#ccc", fontStyle: "italic", fontSize: "0.88rem" }}>Nenhuma iniciação registrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
