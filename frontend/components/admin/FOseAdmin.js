// ========================================
// components/admin/FOseAdmin.js
// [F = Frontend Component]
// Gestão do Calendário de Ọ̀sẹ̀ — admin
// - Conteúdo padrão por Òrìṣà (texto, áudio, link)
// - Configuração do período: seleção de Òrìṣà(s) por dia,
//   com resets (dia/mês/ano/período)
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const OSE_TYPES = [
  { id: 0, orixas: ["Ọ̀ṣun", "Yemọjá"], color: "#D4A017", bg: "#fef3cd" },
  { id: 1, orixas: ["Ògún", "Ọ̀ṣọ́ọ̀sì"], color: "#1B6B3A", bg: "#d1fae5" },
  { id: 2, orixas: ["Ṣàngó", "Ọya"], color: "#B22222", bg: "#fde8e8" },
  { id: 3, orixas: ["Obàtálá", "Ifá"], color: "#1a4080", bg: "#dbeafe" },
];

const ALL_ORIXAS = OSE_TYPES.flatMap((t) => t.orixas.map((ox) => ({ name: ox, color: t.color, bg: t.bg })));
const ORIXA_COLOR = Object.fromEntries(ALL_ORIXAS.map((o) => [o.name, o.color]));

const EPOCH = new Date(2026, 0, 1);
function getDefaultOse(date) {
  const diff = Math.floor((date - EPOCH) / 86400000);
  return OSE_TYPES[((diff % 4) + 4) % 4];
}
function dayKey(y, m, d) { return `${y}-${m}-${d}`; }

export default function FOseAdmin() {
  const { profile, isConselho } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("defaults");
  const [defaults, setDefaults] = useState({});
  const [dayOverrides, setDayOverrides] = useState({}); // { "2026-0-1": { orixas: ["..."] } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Para configuração do período
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(new Date().getMonth());
  const [selDay, setSelDay] = useState(null);

  // Reset por período
  const [resetStart, setResetStart] = useState("");
  const [resetEnd, setResetEnd] = useState("");

  useEffect(() => { if (profile && !isConselho) router.push("/dashboard"); }, [profile, isConselho, router]);

  useEffect(() => {
    async function load() {
      try {
        const [defSnap, daySnap] = await Promise.all([
          getDoc(doc(db, "settings", "oseDefaults")),
          getDoc(doc(db, "settings", "oseData")),
        ]);
        if (defSnap.exists()) setDefaults(defSnap.data());
        if (daySnap.exists()) setDayOverrides(daySnap.data());
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveDefaults() {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "oseDefaults"), defaults);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert("Erro: " + err.message); }
    finally { setSaving(false); }
  }

  async function persistOverrides(updated) {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "oseData"), updated);
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  function updateDefault(orixa, field, value) {
    setDefaults((prev) => ({ ...prev, [orixa]: { ...(prev[orixa] || {}), [field]: value } }));
  }

  function getOrixasForDay(y, m, d) {
    const key = dayKey(y, m, d);
    if (dayOverrides[key]?.orixas) return dayOverrides[key].orixas;
    return getDefaultOse(new Date(y, m, d)).orixas;
  }

  async function setOrixasForDay(y, m, d, orixas) {
    const key = dayKey(y, m, d);
    const updated = { ...dayOverrides, [key]: { orixas } };
    setDayOverrides(updated);
    await persistOverrides(updated);
  }

  async function resetKeys(keys) {
    if (keys.length === 0) return;
    if (!confirm(`Resetar ${keys.length} dia(s)? Isso volta ao ciclo padrão de 4 dias.`)) return;
    const updated = { ...dayOverrides };
    keys.forEach((k) => { delete updated[k]; });
    setDayOverrides(updated);
    await persistOverrides(updated);
  }

  async function resetDay() {
    if (!selDay) return;
    await resetKeys([dayKey(curYear, curMonth, selDay)]);
  }

  async function resetMonth() {
    const keys = Object.keys(dayOverrides).filter((k) => {
      const [y, m] = k.split("-").map(Number);
      return y === curYear && m === curMonth;
    });
    await resetKeys(keys);
  }

  async function resetYear() {
    const keys = Object.keys(dayOverrides).filter((k) => {
      const [y] = k.split("-").map(Number);
      return y === curYear;
    });
    await resetKeys(keys);
  }

  async function resetPeriod() {
    if (!resetStart || !resetEnd) { alert("Selecione as duas datas do período."); return; }
    const start = new Date(resetStart).getTime();
    const end = new Date(resetEnd).getTime();
    if (start > end) { alert("Data inicial deve ser anterior à final."); return; }
    const keys = Object.keys(dayOverrides).filter((k) => {
      const [y, m, d] = k.split("-").map(Number);
      const t = new Date(y, m, d).getTime();
      return t >= start && t <= end;
    });
    await resetKeys(keys);
  }

  if (!isConselho) return null;
  if (loading) return <p style={{ color: "#888" }}>Carregando...</p>;

  // Calendário
  const firstDay = new Date(curYear, curMonth, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();

  const selectedOrixas = selDay ? getOrixasForDay(curYear, curMonth, selDay) : [];
  const selectedIsOverride = selDay && !!dayOverrides[dayKey(curYear, curMonth, selDay)];

  function changeMonth(dir) {
    let m = curMonth + dir, y = curYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCurMonth(m); setCurYear(y); setSelDay(null);
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gestão do Calendário de Ọ̀sẹ̀</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Configure os conteúdos por Òrìṣà e defina quais Òrìṣà(s) regem cada dia.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button onClick={() => setTab("defaults")} className={`btn ${tab === "defaults" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "0.85rem" }}>
          Conteúdo por Òrìṣà
        </button>
        <button onClick={() => setTab("period")} className={`btn ${tab === "period" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "0.85rem" }}>
          Configuração do Período
        </button>
      </div>

      {/* TAB: Conteúdo por Òrìṣà */}
      {tab === "defaults" && (
        <div>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "1rem" }}>
            Os conteúdos aqui aparecem em todos os dias regidos pelo respectivo Òrìṣà.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            {ALL_ORIXAS.map(({ name, color }) => {
              const data = defaults[name] || { link: "", audio: "", text: "" };
              return (
                <div key={name} className="card" style={{ borderTop: `4px solid ${color}` }}>
                  <h3 style={{ color, fontSize: "1.1rem", marginBottom: "0.75rem" }}>{name}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <div>
                      <label className="label">Oração padrão</label>
                      <textarea className="input-field" rows={4} value={data.text || ""} onChange={(e) => updateDefault(name, "text", e.target.value)} placeholder={`Ẹ káàárọ̀ ${name}...`} style={{ resize: "vertical" }} />
                    </div>
                    <div>
                      <label className="label">Áudio (URL)</label>
                      <input className="input-field" type="url" value={data.audio || ""} onChange={(e) => updateDefault(name, "audio", e.target.value)} placeholder="https://drive.google.com/..." />
                    </div>
                    <div>
                      <label className="label">Link</label>
                      <input className="input-field" type="url" value={data.link || ""} onChange={(e) => updateDefault(name, "link", e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button onClick={saveDefaults} className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar padrões"}
            </button>
          </div>
        </div>
      )}

      {/* TAB: Configuração do Período */}
      {tab === "period" && (
        <div>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "1rem" }}>
            Clique num dia e marque quais Òrìṣà(s) regem aquela data. Sem customização, o ciclo padrão de 4 dias é aplicado.
          </p>

          {/* Resets */}
          <div className="card" style={{ marginBottom: "1rem", padding: "0.85rem 1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#666", marginRight: "0.25rem" }}>Resetar:</span>
              <button onClick={resetDay} disabled={!selDay} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem", opacity: selDay ? 1 : 0.5 }}>Dia selecionado</button>
              <button onClick={resetMonth} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>{MONTHS[curMonth]} inteiro</button>
              <button onClick={resetYear} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>Ano {curYear}</button>
              <span style={{ color: "#ccc", margin: "0 0.25rem" }}>|</span>
              <input type="date" value={resetStart} onChange={(e) => setResetStart(e.target.value)} className="input-field" style={{ padding: "0.35rem 0.5rem", width: "160px", fontSize: "0.8rem" }} />
              <span style={{ fontSize: "0.8rem", color: "#888" }}>até</span>
              <input type="date" value={resetEnd} onChange={(e) => setResetEnd(e.target.value)} className="input-field" style={{ padding: "0.35rem 0.5rem", width: "160px", fontSize: "0.8rem" }} />
              <button onClick={resetPeriod} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>Período</button>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.5rem" }}>Reset apaga customizações e volta o(s) dia(s) ao ciclo padrão de 4 dias.</p>
          </div>

          {/* Navegação do calendário */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <button onClick={() => changeMonth(-1)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem" }}>←</button>
            <h3 style={{ fontSize: "1.2rem", margin: 0 }}>{MONTHS[curMonth]} {curYear}</h3>
            <button onClick={() => changeMonth(1)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem" }}>→</button>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
              {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#888", padding: "0.4rem" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
              {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const key = dayKey(curYear, curMonth, d);
                const orixas = getOrixasForDay(curYear, curMonth, d);
                const isCustom = !!dayOverrides[key];
                const isSel = selDay === d;
                const mainColor = ORIXA_COLOR[orixas[0]] || "#888";
                return (
                  <div key={d} onClick={() => setSelDay(d)} style={{
                    padding: "0.5rem 0.25rem", borderRadius: "8px", cursor: "pointer", textAlign: "center",
                    background: isSel ? mainColor : "transparent",
                    border: isCustom && !isSel ? `2px dashed ${mainColor}` : "2px solid transparent",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isSel ? "white" : "#333" }}>{d}</div>
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "2px", flexWrap: "wrap", maxWidth: "60px", marginLeft: "auto", marginRight: "auto" }}>
                      {orixas.map((ox) => (
                        <div key={ox} style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.85)" : (ORIXA_COLOR[ox] || "#888") }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.75rem" }}>Dias com <span style={{ border: "1px dashed #888", padding: "0 0.3rem", borderRadius: "3px" }}>borda tracejada</span> têm customização.</p>
          </div>

          {/* Editor do dia selecionado */}
          {selDay && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{selDay} de {MONTHS[curMonth]} de {curYear}</h3>
                <div style={{ fontSize: "0.8rem", color: "#888" }}>
                  {selectedIsOverride ? "Customizado" : "Ciclo padrão"} · {saving && <span style={{ color: "var(--egbe-green)" }}>Salvando...</span>}
                </div>
              </div>

              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#666", marginBottom: "0.5rem", display: "block" }}>
                Selecione os Òrìṣà que regem este dia
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.5rem" }}>
                {ALL_ORIXAS.map(({ name, color }) => {
                  const active = selectedOrixas.includes(name);
                  return (
                    <label key={name} style={{
                      display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem",
                      background: active ? color + "15" : "white",
                      border: `1.5px solid ${active ? color : "#e5e7eb"}`,
                      borderRadius: "8px", cursor: "pointer", userSelect: "none",
                    }}>
                      <span style={{
                        width: "18px", height: "18px", borderRadius: "50%",
                        border: `2px solid ${color}`, background: active ? color : "white",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {active && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 700 }}>✓</span>}
                      </span>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => {
                          const next = active ? selectedOrixas.filter((o) => o !== name) : [...selectedOrixas, name];
                          setOrixasForDay(curYear, curMonth, selDay, next);
                        }}
                        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                      />
                      <span style={{ fontSize: "0.85rem", color: active ? color : "#444", fontWeight: active ? 600 : 500 }}>
                        {name}
                      </span>
                    </label>
                  );
                })}
              </div>
              {selectedIsOverride && (
                <button onClick={resetDay} className="btn btn-secondary" style={{ marginTop: "1rem", fontSize: "0.82rem", padding: "0.4rem 0.9rem" }}>
                  Voltar ao ciclo padrão deste dia
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
