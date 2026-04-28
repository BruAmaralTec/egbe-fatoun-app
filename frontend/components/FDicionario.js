// ========================================
// components/FDicionario.js
// [F = Frontend Component]
// Dicionário / Tradutor multilíngue
// PT-BR ↔ Espanhol ↔ Yorùbá ↔ Inglês
// ========================================

"use client";

import { useState } from "react";
import { translate as translateApi } from "@/lib/LApi";

const LANGS = [
  { code: "pt", label: "Português (BR)" },
  { code: "es", label: "Espanhol" },
  { code: "yo", label: "Yorùbá Tradicional" },
  { code: "en", label: "Inglês" },
  { code: "fr", label: "Francês" },
];

const QUICK_PHRASES = [
  "Ẹ káàárọ̀ — Bom dia",
  "Ẹ kú ọ̀sán — Boa tarde",
  "Ẹ kú alẹ́ — Boa noite",
  "Àbọrú, Àbọyè, Àbọṣíṣe",
  "Àṣẹ o! — Que assim seja!",
  "Ìbà Olódùmarè — Reverência ao Criador",
];

export default function FDicionario() {
  const [fromLang, setFromLang] = useState("pt");
  const [toLang, setToLang] = useState("yo");
  const [sourceText, setSourceText] = useState("");
  const [translation, setTranslation] = useState("");
  const [provider, setProvider] = useState("");
  const [translating, setTranslating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  const involvesYoruba = fromLang === "yo" || toLang === "yo";

  function copyPhrase(phrase, index) {
    const yoruba = phrase.split(" — ")[0].normalize("NFC");
    navigator.clipboard.writeText(yoruba);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  function copyTranslation() {
    navigator.clipboard.writeText(translation.normalize("NFC"));
    setCopiedTranslation(true);
    setTimeout(() => setCopiedTranslation(false), 1500);
  }

  async function handleTranslate() {
    if (!sourceText.trim()) return;
    setTranslating(true);
    setTranslation("");
    setProvider("");
    try {
      const data = await translateApi({ text: sourceText, sourceLang: fromLang, targetLang: toLang });
      const out = (data.translation || "Sem tradução.").normalize("NFC");
      setTranslation(out);
      setProvider(data.provider || "");
    } catch (err) {
      const resp = err.response?.data;
      const detail = resp?.details || resp?.error || err.message;
      setTranslation("Erro: " + detail);
    } finally {
      setTranslating(false);
    }
  }

  function swapLangs() {
    setFromLang(toLang);
    setToLang(fromLang);
    setSourceText(translation);
    setTranslation(sourceText);
    setProvider("");
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Dicionário</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Tradutor com suporte a Yorùbá tradicional com diacríticos tonais
      </p>

      {/* Frases rápidas — no topo */}
      <div className="card" style={{ maxWidth: "800px", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>Frases rápidas</h3>
        <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "0.75rem" }}>Clique no texto para usar no tradutor · clique no 📋 para copiar</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
          {QUICK_PHRASES.map((p, i) => (
            <div key={p} style={{
              display: "flex", alignItems: "stretch", background: "#f0f7f3",
              border: "1px solid #d1fae5", borderRadius: "8px", overflow: "hidden",
            }}>
              <button
                onClick={() => { setSourceText(p.split(" — ")[0]); setFromLang("yo"); setToLang("pt"); }}
                style={{
                  flex: 1, padding: "0.6rem 0.75rem", background: "none", border: "none",
                  cursor: "pointer", textAlign: "left", fontSize: "0.82rem", color: "#1a1a1a", fontFamily: "inherit",
                }}
              >
                {p}
              </button>
              <button
                onClick={() => copyPhrase(p, i)}
                title="Copiar texto em Yorùbá"
                style={{
                  padding: "0 0.75rem", background: copiedIndex === i ? "var(--egbe-green)" : "white",
                  border: "none", borderLeft: "1px solid #d1fae5", cursor: "pointer",
                  fontSize: "0.9rem", color: copiedIndex === i ? "white" : "var(--egbe-green-dark)",
                  fontWeight: 600, transition: "background 0.2s",
                }}
              >
                {copiedIndex === i ? "✓" : "📋"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ maxWidth: "800px", marginBottom: "1.5rem" }}>
        {/* Seletor de idiomas */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <select className="input-field" value={fromLang} onChange={e => setFromLang(e.target.value)} style={{ flex: 1 }}>
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button onClick={swapLangs} style={{ padding: "0.5rem", background: "none", border: "1.5px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }} title="Inverter idiomas">⇄</button>
          <select className="input-field" value={toLang} onChange={e => setToLang(e.target.value)} style={{ flex: 1 }}>
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        {/* Texto fonte */}
        <div style={{ marginBottom: "1rem" }}>
          <textarea className="input-field" rows={4} placeholder="Digite o texto para traduzir..." value={sourceText} onChange={e => setSourceText(e.target.value)} style={{ resize: "vertical", fontSize: "1rem" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#888" }}>{sourceText.length} caracteres</span>
          </div>
        </div>

        <button onClick={handleTranslate} className="btn btn-primary" disabled={translating || !sourceText.trim()} style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}>
          {translating ? (involvesYoruba ? "Traduzindo (pode levar ~30s na 1ª chamada)..." : "Traduzindo...") : "Traduzir"}
        </button>

        {/* Resultado */}
        <div style={{ padding: "1rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", minHeight: "80px" }}>
          {translating ? (
            <p style={{ color: "#888", fontStyle: "italic" }}>Traduzindo...</p>
          ) : translation ? (
            <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "#1a1a1a", margin: 0 }}>{translation}</p>
          ) : (
            <p style={{ color: "#ccc", fontStyle: "italic", margin: 0 }}>A tradução aparecerá aqui...</p>
          )}
        </div>

        {/* Botão copiar — abaixo da tradução */}
        {translation && !translating && (
          <button
            onClick={copyTranslation}
            className={`btn ${copiedTranslation ? "btn-primary" : "btn-secondary"}`}
            style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem", transition: "background 0.2s" }}
          >
            {copiedTranslation ? "✓ Copiado!" : "📋 Copiar tradução"}
          </button>
        )}

        {provider && translation && (
          <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.75rem", lineHeight: 1.5 }}>
            {provider === "nllb" ? (
              <>🤖 Tradução via <strong>NLLB-200</strong> (Meta) — preserva a grafia Yorùbá com tons e pontos subscritos (ẹ/ọ/ṣ).</>
            ) : provider === "google-fallback" ? (
              <>⚠️ NLLB indisponível no momento — usado Google Translate como fallback (sem pontos subscritos).</>
            ) : (
              <>🌐 Tradução via Google Cloud Translation.</>
            )}
          </p>
        )}
      </div>

    </div>
  );
}
