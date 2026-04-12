// ========================================
// components/FDicionario.js
// [F = Frontend Component]
// Dicionário / Tradutor multilíngue
// PT-BR ↔ Espanhol ↔ Yorùbá ↔ Inglês
// ========================================

"use client";

import { useState } from "react";

const LANGS = [
  { code: "pt", label: "Português (BR)" },
  { code: "es", label: "Espanhol" },
  { code: "yo", label: "Yorùbá Tradicional" },
  { code: "en", label: "Inglês" },
];

const QUICK_PHRASES = [
  "Ẹ káàárọ̀ — Bom dia",
  "Ẹ kú ọ̀sán — Boa tarde",
  "Ẹ kú alẹ́ — Boa noite",
  "Ọmọ Ifá — Filho de Ifá",
  "Àṣẹ o! — Que assim seja!",
  "Ìbà Olódùmarè — Reverência ao Criador",
];

export default function FDicionario() {
  const [fromLang, setFromLang] = useState("pt");
  const [toLang, setToLang] = useState("yo");
  const [sourceText, setSourceText] = useState("");
  const [translation, setTranslation] = useState("");
  const [translating, setTranslating] = useState(false);

  async function handleTranslate() {
    if (!sourceText.trim()) return;
    setTranslating(true);
    setTranslation("");
    const fLabel = LANGS.find(l => l.code === fromLang)?.label;
    const tLabel = LANGS.find(l => l.code === toLang)?.label;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "Você é especialista em tradução com profundo conhecimento do Yorùbá tradicional de Ilé-Ifẹ̀, incluindo diacríticos tonais completos. Traduza com precisão mantendo o tom litúrgico e sagrado quando presente. Retorne APENAS a tradução, sem explicações ou marcações.",
          messages: [{ role: "user", content: `Traduza de ${fLabel} para ${tLabel}:\n\n${sourceText}` }],
        }),
      });
      const d = await r.json();
      setTranslation(d.content?.[0]?.text || "Erro na tradução.");
    } catch {
      setTranslation("Erro ao conectar. Verifique a conexão.");
    } finally {
      setTranslating(false);
    }
  }

  function swapLangs() {
    setFromLang(toLang);
    setToLang(fromLang);
    setSourceText(translation);
    setTranslation(sourceText);
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Dicionário</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Tradutor com suporte a Yorùbá tradicional com diacríticos tonais
      </p>

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
          {translating ? "Traduzindo..." : "Traduzir"}
        </button>

        {/* Resultado */}
        <div style={{ padding: "1rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", minHeight: "80px" }}>
          {translating ? (
            <p style={{ color: "#888", fontStyle: "italic" }}>Traduzindo...</p>
          ) : translation ? (
            <div>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "#1a1a1a" }}>{translation}</p>
              <button onClick={() => navigator.clipboard.writeText(translation)} style={{ marginTop: "0.5rem", padding: "0.3rem 0.7rem", background: "none", border: "1.5px solid var(--egbe-green)", borderRadius: "4px", color: "var(--egbe-green)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>Copiar</button>
            </div>
          ) : (
            <p style={{ color: "#ccc", fontStyle: "italic" }}>A tradução aparecerá aqui...</p>
          )}
        </div>
      </div>

      {/* Frases rápidas */}
      <div className="card" style={{ maxWidth: "800px" }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Frases rápidas</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
          {QUICK_PHRASES.map(p => (
            <button key={p} onClick={() => { setSourceText(p.split(" — ")[0]); setFromLang("yo"); setToLang("pt"); }} style={{
              padding: "0.6rem 0.75rem", background: "#f0f7f3", border: "1px solid #d1fae5", borderRadius: "8px",
              cursor: "pointer", textAlign: "left", fontSize: "0.82rem", color: "#1a1a1a", fontFamily: "inherit",
            }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
