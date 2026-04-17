// ========================================
// app/login/page.js
// Tela de entrada — logo + boas-vindas + login
// ========================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/LAuthContext";

export default function FLoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, loginWithGoogle, register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      const messages = {
        "auth/user-not-found": "Usuário não encontrado",
        "auth/wrong-password": "Senha incorreta",
        "auth/email-already-in-use": "Este email já está cadastrado",
        "auth/weak-password": "Senha deve ter no mínimo 6 caracteres",
        "auth/invalid-email": "Email inválido",
      };
      setError(messages[err.code] || "Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setError("Erro ao fazer login com Google");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg, var(--egbe-black) 0%, var(--egbe-green-dark) 100%)",
      padding: "1.5rem",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Título + traços rituais + boas-vindas */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            color: "var(--egbe-yellow)",
            marginBottom: "0.75rem",
          }}>
            Ẹgbẹ́ Fátọ́ún
          </h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "1rem" }}>
            {["#FAF9F6", "#1B6B3A", "#D4A017", "#B22222"].map((color) => (
              <div key={color} style={{ width: "40px", height: "4px", borderRadius: "2px", background: color }} />
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem" }}>
            Bem-vinda(o) à casa
          </p>
        </div>

        {/* Card de login */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}>
          <p style={{ textAlign: "center", color: "#888", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {isRegister ? "Crie sua conta" : "Acesse sua conta"}
          </p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Nome completo</label>
                <input className="input-field" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" required />
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Email</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">Senha</label>
              <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", color: "var(--egbe-red)", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>ou</span>
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          </div>

          <button onClick={handleGoogle} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            Entrar com Google
          </button>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#666" }}>
            {isRegister ? "Já tem conta? " : "Não tem conta? "}
            <button onClick={() => { setIsRegister(!isRegister); setError(""); }} style={{ background: "none", border: "none", color: "var(--egbe-green)", fontWeight: 600, cursor: "pointer" }}>
              {isRegister ? "Faça login" : "Cadastre-se"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
