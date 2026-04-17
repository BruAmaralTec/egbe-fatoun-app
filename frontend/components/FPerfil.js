// ========================================
// components/FPerfil.js
// [F = Frontend Component]
// Perfil pessoal do membro
// ========================================

"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { useAuth } from "@/lib/LAuthContext";
import { ROLES } from "@/lib/LPermissions";
import { DEFAULT_ORIXAS } from "@/lib/LOse";
import { pushSupported, pushPermission, registerDevice } from "@/lib/LPush";

export default function FPerfil() {
  const { user, profile, setProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [orixas, setOrixas] = useState(DEFAULT_ORIXAS);
  const [savingNotify, setSavingNotify] = useState(false);
  const [pushState, setPushState] = useState({ supported: false, permission: "default" });
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    async function loadOrixas() {
      const snap = await getDoc(doc(db, "settings", "oseOrixas"));
      if (snap.exists() && snap.data().list) setOrixas(snap.data().list);
    }
    loadOrixas();
  }, []);

  useEffect(() => {
    async function checkPush() {
      const supported = await pushSupported();
      setPushState({ supported, permission: pushPermission() });
    }
    checkPush();
  }, []);

  async function enablePush() {
    setPushBusy(true);
    setPushError("");
    try {
      await registerDevice(user.uid);
      setPushState({ supported: true, permission: "granted" });
      alert("Notificações push ativadas neste dispositivo!");
    } catch (err) {
      setPushError(err.message);
    } finally {
      setPushBusy(false);
    }
  }

  async function toggleOrixaNotify(name) {
    const current = profile.oseOrixasNotify || [];
    const next = current.includes(name) ? current.filter((o) => o !== name) : [...current, name];
    setProfile({ ...profile, oseOrixasNotify: next });
    setSavingNotify(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { oseOrixasNotify: next });
    } catch (err) {
      setProfile({ ...profile, oseOrixasNotify: current });
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSavingNotify(false);
    }
  }

  if (!profile) return null;

  const initiacoes = profile.initiacoes || [];
  const cargos = profile.cargos || [];
  const roleLabel = ROLES.find((r) => r.value === (profile.role || "cliente"))?.label || "Cliente";

  function startEditing() {
    setForm({
      displayName: profile.displayName || "",
      communityName: profile.communityName || "",
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
        communityName: form.communityName,
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
            {roleLabel}
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
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Nome para Comunidade</label>
                <input style={fieldStyle} value={form.communityName} onChange={(e) => setForm({ ...form, communityName: e.target.value })} placeholder="Apelido ou nome usado pela comunidade" />
                <span style={{ fontSize: "0.72rem", color: "#aaa" }}>Este nome aparece na tela de início.</span>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Orúkọ</label>
                <input style={{ ...fieldStyle, background: "#f3f4f6", color: "#999" }} value={profile.oruko || ""} disabled />
                <span style={{ fontSize: "0.75rem", color: "#aaa" }}>Gerenciado pelos administradores</span>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Perfil</label>
                <input style={{ ...fieldStyle, background: "#f3f4f6", color: "#999" }} value={roleLabel} disabled />
                <span style={{ fontSize: "0.75rem", color: "#aaa" }}>Gerenciado pelos administradores</span>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Email</label>
                <input style={{ ...fieldStyle, background: "#f3f4f6", color: "#999" }} value={profile.email} disabled />
                <span style={{ fontSize: "0.75rem", color: "#aaa" }}>Email não pode ser alterado</span>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>CPF</label>
                <input style={fieldStyle} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Telefone</label>
                <input style={fieldStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", fontSize: "0.9rem" }}>
              <tbody>
                {[
                  ["Nome", profile.displayName || "Não informado"],
                  ["Nome para Comunidade", profile.communityName || "Não informado"],
                  ["Orúkọ", profile.oruko || "Não informado"],
                  ["Perfil", roleLabel],
                  ["Email", profile.email],
                  ["CPF", profile.cpf || "Não informado"],
                  ["Telefone", profile.phone || "Não informado"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.6rem 0", color: "#888", width: "180px" }}>{label}</td>
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

        {/* Cargos recebidos */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Cargos recebidos</h3>
          {cargos.length > 0 ? cargos.map((c, i) => (
            <div key={c.id || i} style={{ padding: "0.75rem", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, color: "#92400e" }}>{c.nome}</span>
                {c.data && <span style={{ fontSize: "0.8rem", color: "#888" }}>{c.data}</span>}
              </div>
              {c.descricao && <p style={{ fontSize: "0.82rem", color: "#666", marginTop: "0.2rem" }}>{c.descricao}</p>}
            </div>
          )) : (
            <p style={{ color: "#ccc", fontStyle: "italic", fontSize: "0.88rem" }}>Nenhum cargo registrado.</p>
          )}
          <p style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "0.5rem", fontStyle: "italic" }}>
            Cargos são atribuídos pelos administradores da casa.
          </p>
        </div>
      </div>

      {/* Push notifications neste dispositivo */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>Notificações no celular</h3>
        <p style={{ fontSize: "0.82rem", color: "#666", marginBottom: "0.75rem" }}>
          Ative para receber lembretes do Ẹgbẹ́ Fátọ́ún como push no seu dispositivo (mesmo com o app fechado).
        </p>
        {!pushState.supported ? (
          <p style={{ fontSize: "0.82rem", color: "#888", fontStyle: "italic" }}>
            Este navegador não suporta notificações push. Instale o app (Adicionar à tela inicial) para ativar.
          </p>
        ) : pushState.permission === "granted" ? (
          <p style={{ fontSize: "0.85rem", color: "var(--egbe-green)", fontWeight: 600 }}>
            ✔ Notificações ativadas neste dispositivo.
          </p>
        ) : pushState.permission === "denied" ? (
          <p style={{ fontSize: "0.82rem", color: "var(--egbe-red)" }}>
            Permissão negada. Reative nas configurações do navegador.
          </p>
        ) : (
          <button className="btn btn-primary" onClick={enablePush} disabled={pushBusy}>
            {pushBusy ? "Ativando..." : "🔔 Ativar notificações"}
          </button>
        )}
        {pushError && <p style={{ fontSize: "0.78rem", color: "var(--egbe-red)", marginTop: "0.5rem" }}>{pushError}</p>}
      </div>

      {/* Notificações de Ọ̀sẹ̀ por Òrìṣà */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>
          Lembretes de ọ̀sẹ̀ {savingNotify && <span style={{ fontSize: "0.75rem", color: "#aaa", fontStyle: "italic", marginLeft: "0.5rem" }}>salvando…</span>}
        </h3>
        <p style={{ fontSize: "0.82rem", color: "#666", marginBottom: "0.75rem" }}>
          Escolha os Òrìṣà que você deseja receber lembrete para fazer ọ̀sẹ̀.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {orixas.map(({ name, color }) => {
            const active = (profile.oseOrixasNotify || []).includes(name);
            return (
              <button
                key={name}
                onClick={() => toggleOrixaNotify(name)}
                disabled={savingNotify}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "20px",
                  border: `2px solid ${color}`,
                  background: active ? color : "white",
                  color: active ? "white" : color,
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  cursor: savingNotify ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {active && "✓ "}{name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
