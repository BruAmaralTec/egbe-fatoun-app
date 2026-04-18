// ========================================
// app/login/page.js
// Tela de entrada — logo + boas-vindas + login
// ========================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider } from "firebase/auth";
import { useAuth } from "@/lib/LAuthContext";

export default function FLoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingGoogleCred, setPendingGoogleCred] = useState(null);
  const { loginWithEmail, loginWithGoogle, linkGoogleToEmailPassword, register } = useAuth();
  const router = useRouter();

  const isLinking = !!pendingGoogleCred;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLinking) {
        await linkGoogleToEmailPassword({ email, password, googleCredential: pendingGoogleCred });
        setPendingGoogleCred(null);
      } else if (isRegister) {
        await register(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      const messages = {
        "auth/user-not-found": "Usuário não encontrado",
        "auth/wrong-password": "Senha incorreta",
        "auth/invalid-credential": "Email ou senha incorretos",
        "auth/email-already-in-use": "Este email já está cadastrado",
        "auth/weak-password": "Senha deve ter no mínimo 6 caracteres",
        "auth/invalid-email": "Email inválido",
        "auth/credential-already-in-use": "Este Google já está vinculado a outra conta",
      };
      setError(messages[err.code] || "Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      if (err.code === "auth/account-exists-with-different-credential") {
        const cred = GoogleAuthProvider.credentialFromError(err);
        const emailHint = err.customData?.email || "";
        setPendingGoogleCred(cred);
        if (emailHint) setEmail(emailHint);
        setPassword("");
        setIsRegister(false);
        setError("Este email já está cadastrado com senha. Digite sua senha abaixo para vincular o Google à sua conta.");
      } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        // silencioso
      } else {
        setError("Erro ao fazer login com Google: " + (err.message || err.code));
      }
    } finally {
      setLoading(false);
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
            {isLinking ? "Vincular Google à sua conta" : isRegister ? "Crie sua conta" : "Acesse sua conta"}
          </p>

          <form onSubmit={handleSubmit}>
            {isRegister && !isLinking && (
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Nome completo</label>
                <input className="input-field" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" required />
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Email</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required readOnly={isLinking} style={isLinking ? { background: "#f3f4f6", color: "#666" } : undefined} />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">Senha</label>
              <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} autoFocus={isLinking} />
            </div>

            {error && (
              <div style={{ background: isLinking ? "#eff6ff" : "#fef2f2", border: `1px solid ${isLinking ? "#bfdbfe" : "#fecaca"}`, borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", color: isLinking ? "#1e40af" : "var(--egbe-red)", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Aguarde..." : isLinking ? "Vincular e entrar" : isRegister ? "Criar conta" : "Entrar"}
            </button>
          </form>

          {!isLinking && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
                <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
                <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>ou</span>
                <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
                  padding: "0.7rem 1rem", background: "white", border: "1.5px solid #e5e7eb", borderRadius: "8px",
                  fontFamily: "inherit", fontSize: "0.92rem", fontWeight: 600, color: "#3c4043",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 0.15s",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                Entrar com Google
              </button>
            </>
          )}

          {isLinking ? (
            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#666" }}>
              <button type="button" onClick={() => { setPendingGoogleCred(null); setError(""); setPassword(""); }} style={{ background: "none", border: "none", color: "var(--egbe-green)", fontWeight: 600, cursor: "pointer" }}>
                Cancelar vinculação
              </button>
            </p>
          ) : (
            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#666" }}>
              {isRegister ? "Já tem conta? " : "Não tem conta? "}
              <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }} style={{ background: "none", border: "none", color: "var(--egbe-green)", fontWeight: 600, cursor: "pointer" }}>
                {isRegister ? "Faça login" : "Cadastre-se"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
