// ========================================
// app/dashboard/page.js
// Página inicial do dashboard
// ========================================

"use client";

import Link from "next/link";
import { useAuth } from "@/lib/LAuthContext";

export default function FDashboardHome() {
  const { profile, isAdmin } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
        Àṣẹ, {profile?.displayName || "Visitante"}! 🙏
      </h1>
      <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "2rem" }}>
        Bem-vindo(a) ao painel do Ẹgbẹ́ Fátọ́ún
      </p>

      {/* Cards de resumo */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        {[
          { label: "Seu perfil", value: profile?.role || "—", color: "var(--egbe-green)" },
          { label: "Próximo evento", value: "Em breve", color: "var(--egbe-yellow)" },
          { label: "Cursos ativos", value: "0", color: "var(--egbe-red)" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "white",
            borderRadius: "12px",
            padding: "1.25rem",
            borderTop: `3px solid ${card.color}`,
          }}>
            <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.25rem" }}>{card.label}</p>
            <p style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 600 }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Dados do perfil */}
      {profile && (
        <div className="card" style={{ maxWidth: "500px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>Seus dados</h3>
            <Link href="/dashboard/perfil" className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem", textDecoration: "none" }}>
              Editar
            </Link>
          </div>
          <table style={{ width: "100%", fontSize: "0.9rem" }}>
            <tbody>
              {[
                ["Email", profile.email],
                ["Perfil", profile.role],
                ["Orúkọ", profile.oruko || "Não atribuído"],
                ["CPF", profile.cpf || "Não informado"],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: "0.5rem 0", color: "#888", width: "120px" }}>{label}</td>
                  <td style={{ padding: "0.5rem 0", fontWeight: 500 }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aviso admin */}
      {isAdmin && (
        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "#1e40af",
        }}>
          🔧 Você tem acesso de administrador. Use o menu lateral para gerenciar eventos, cursos, usuários e integrações.
        </div>
      )}
    </div>
  );
}
