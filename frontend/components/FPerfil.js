// ========================================
// components/FPerfil.js
// [F = Frontend Component]
// Perfil pessoal do membro
// ========================================

"use client";

import { useAuth } from "@/lib/LAuthContext";

export default function FPerfil() {
  const { profile } = useAuth();
  if (!profile) return null;

  const initiacoes = profile.initiacoes || [];

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
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Dados pessoais</h3>
          <table style={{ width: "100%", fontSize: "0.9rem" }}>
            <tbody>
              {[
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
          <p style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.75rem", fontStyle: "italic" }}>
            Os campos são gerenciados pelos administradores da casa.
          </p>
        </div>

        {/* Iniciações */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Iniciações na casa</h3>
          {initiacoes.length > 0 ? initiacoes.map((ini, i) => (
            <div key={ini.id || i} style={{ padding: "0.75rem", background: "#f0f7f3", borderRadius: "8px", border: "1px solid #d1fae5", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, color: "var(--egbe-green-dark)" }}>{ini.nome}</span>
                {ini.data && <span style={{ fontSize: "0.8rem", color: "#888" }}>{ini.data}</span>}
              </div>
              {ini.descricao && <p style={{ fontSize: "0.82rem", color: "#666", marginTop: "0.2rem" }}>{ini.descricao}</p>}
            </div>
          )) : (
            <p style={{ color: "#ccc", fontStyle: "italic", fontSize: "0.88rem" }}>Nenhuma iniciação registrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
