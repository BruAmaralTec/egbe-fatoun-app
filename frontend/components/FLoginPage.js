// ========================================
// app/login/page.js
// Tela de login e cadastro
// ========================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/LAuthContext";
import Link from "next/link";

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
      // Redireciona para o dashboard após login
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
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--egbe-green)",
            textDecoration: "none",
          }}>
            Ẹgbẹ́ Fátọ́ún
          </Link>
          <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            {isRegister ? "Crie sua conta" : "Acesse sua conta"}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Nome completo</label>
              <input
                className="input-field"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Email</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">Senha</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "1rem",
              color: "var(--egbe-red)",
              fontSize: "0.85rem",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}
          </button>
        </form>

        {/* Divisor */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          margin: "1.5rem 0",
        }}>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>ou</span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
        </div>

        {/* Login com Google */}
        <button
          onClick={handleGoogle}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Entrar com Google
        </button>

        {/* Toggle login/register */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#666" }}>
          {isRegister ? "Já tem conta? " : "Não tem conta? "}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--egbe-green)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isRegister ? "Faça login" : "Cadastre-se"}
          </button>
        </p>
      </div>
    </div>
  );
}
