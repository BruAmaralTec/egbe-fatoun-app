// ========================================
// components/FDicionario.js
// [F = Frontend Component]
// Dicionário / Tradutor multilíngue
// PT-BR ↔ Espanhol ↔ Yorùbá ↔ Inglês ↔ Francês
// + aba "Minhas Palavras" pra glossário pessoal
// ========================================

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useModal } from "@/lib/LModalContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
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
  "Àbọrú, Àbọyè, Àbọṣíṣe — Que o sacrifício seja oferecido, aceito e cumprido",
  "Ogbó atọ́, àsúre, Ìwọ̀rìwòfún — Longevidade, bençãos e prosperidade",
  "Àìkú parí ìwà — Que a imortalidade complete o caráter",
  "Ire ajé, ire ọmọ, ire àìkú — Bençãos de prosperidade, filhos e longevidade",
  "Àṣẹ o! — Que assim seja!",
  "Ìbà Olódùmarè — Reverência ao Criador",
];

export default function FDicionario() {
  const { user, profile, setProfile } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [tab, setTab] = useState("tradutor"); // tradutor | palavras

  // Tradutor
  const [fromLang, setFromLang] = useState("pt");
  const [toLang, setToLang] = useState("yo");
  const [sourceText, setSourceText] = useState("");
  const [translation, setTranslation] = useState("");
  const [provider, setProvider] = useState("");
  const [translating, setTranslating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  // Minhas palavras
  const [newWord, setNewWord] = useState({ word: "", translation: "" });
  const [savingWord, setSavingWord] = useState(false);
  const [copiedWordIdx, setCopiedWordIdx] = useState(null);

  const involvesYoruba = fromLang === "yo" || toLang === "yo";
  const myWords = profile?.myDictionaryWords || [];

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

  // ---- Minhas palavras ----
  async function addWord() {
    const w = newWord.word.trim();
    const t = newWord.translation.trim();
    if (!w || !t) return showAlert("Preencha os dois campos: palavra e tradução.");
    setSavingWord(true);
    try {
      const item = { id: Date.now().toString(), word: w.normalize("NFC"), translation: t };
      const next = [item, ...myWords];
      setProfile({ ...profile, myDictionaryWords: next });
      await updateDoc(doc(db, "users", user.uid), { myDictionaryWords: next });
      setNewWord({ word: "", translation: "" });
    } catch (err) {
      await showAlert("Erro ao salvar: " + err.message);
    } finally {
      setSavingWord(false);
    }
  }

  async function removeWord(id) {
    if (!(await showConfirm("Remover esta palavra do seu glossário?"))) return;
    const next = myWords.filter((w) => w.id !== id);
    setProfile({ ...profile, myDictionaryWords: next });
    try { await updateDoc(doc(db, "users", user.uid), { myDictionaryWords: next }); } catch {}
  }

  function useWord(item) {
    setSourceText(item.word);
    setFromLang("yo");
    setToLang("pt");
    setTab("tradutor");
  }

  function copyWord(item, idx) {
    navigator.clipboard.writeText(item.word.normalize("NFC"));
    setCopiedWordIdx(idx);
    setTimeout(() => setCopiedWordIdx(null), 1500);
  }

  // ---- Render ----
  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Dicionário</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>
        Tradutor com suporte a Yorùbá tradicional com diacríticos tonais
      </p>

      {/* Submenu (tabs) */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
        {[
          { id: "tradutor", label: "Tradutor" },
          { id: "palavras", label: "Minhas Palavras" },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "0.55rem 1rem",
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid var(--egbe-green)" : "2px solid transparent",
                color: active ? "var(--egbe-green-dark)" : "#666",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                marginBottom: "-1px",
                fontFamily: "inherit",
                fontSize: "0.92rem",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "tradutor" && (
        <>
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
                ) : provider === "google-auto" || provider === "google-auto-fallback" ? (
                  <>🔍 Google Translate com auto-detecção do idioma de origem.</>
                ) : (
                  <>🌐 Tradução via Google Cloud Translation.</>
                )}
              </p>
            )}
          </div>
        </>
      )}

      {tab === "palavras" && (
        <>
          {/* Lista de palavras salvas — no topo, igual frases rápidas */}
          <div className="card" style={{ maxWidth: "800px", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>Suas palavras</h3>
            <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "0.75rem" }}>
              Clique no texto pra usar no tradutor · 📋 pra copiar · ✕ pra remover
            </p>
            {myWords.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "#aaa", fontStyle: "italic", padding: "0.5rem 0" }}>
                Você ainda não salvou nenhuma palavra. Use o formulário abaixo pra começar.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
                {myWords.map((w, i) => (
                  <div key={w.id} style={{
                    display: "flex", alignItems: "stretch", background: "#f0f7f3",
                    border: "1px solid #d1fae5", borderRadius: "8px", overflow: "hidden",
                  }}>
                    <button
                      onClick={() => useWord(w)}
                      style={{
                        flex: 1, padding: "0.6rem 0.75rem", background: "none", border: "none",
                        cursor: "pointer", textAlign: "left", fontSize: "0.82rem", color: "#1a1a1a", fontFamily: "inherit",
                      }}
                    >
                      {w.word} — {w.translation}
                    </button>
                    <button
                      onClick={() => copyWord(w, i)}
                      title="Copiar palavra"
                      style={{
                        padding: "0 0.65rem", background: copiedWordIdx === i ? "var(--egbe-green)" : "white",
                        border: "none", borderLeft: "1px solid #d1fae5", cursor: "pointer",
                        fontSize: "0.9rem", color: copiedWordIdx === i ? "white" : "var(--egbe-green-dark)",
                        fontWeight: 600, transition: "background 0.2s",
                      }}
                    >
                      {copiedWordIdx === i ? "✓" : "📋"}
                    </button>
                    <button
                      onClick={() => removeWord(w.id)}
                      title="Remover"
                      style={{
                        padding: "0 0.55rem", background: "white", border: "none",
                        borderLeft: "1px solid #d1fae5", cursor: "pointer",
                        fontSize: "0.85rem", color: "var(--egbe-red)", fontWeight: 700,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form de adicionar */}
          <div className="card" style={{ maxWidth: "800px" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Adicionar palavra</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <label className="label">Palavra (texto pra copiar)</label>
                <input
                  className="input-field"
                  value={newWord.word}
                  onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                  placeholder="Ex: Ẹ káàárọ̀"
                />
              </div>
              <div>
                <label className="label">Tradução</label>
                <input
                  className="input-field"
                  value={newWord.translation}
                  onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
                  placeholder="Ex: Bom dia"
                />
              </div>
            </div>
            <button
              onClick={addWord}
              className="btn btn-primary"
              disabled={savingWord || !newWord.word.trim() || !newWord.translation.trim()}
            >
              {savingWord ? "Salvando..." : "+ Adicionar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
