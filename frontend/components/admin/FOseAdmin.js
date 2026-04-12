// ========================================
// components/admin/FOseAdmin.js
// [F = Frontend Component]
// Gestão do Calendário de Ọ̀sẹ̀ — admin
// Edita conteúdos padrão por Orixá e override por dia
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

export default function FOseAdmin() {
  const { profile, isConselho } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("defaults");
  const [defaults, setDefaults] = useState({});
  const [dayData, setDayData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Para override de dia
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(new Date().getMonth());
  const [selDay, setSelDay] = useState(null);

  useEffect(() => { if (profile && !isConselho) router.push("/dashboard"); }, [profile, isConselho, router]);

  useEffect(() => {
    async function load() {
      try {
        const [defSnap, daySnap] = await Promise.all([
          getDoc(doc(db, "settings", "oseDefaults")),
          getDoc(doc(db, "settings", "oseData")),
        ]);
        if (defSnap.exists()) setDefaults(defSnap.data());
        if (daySnap.exists()) setDayData(daySnap.data());
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

  async function saveDayData(key, orixaIdx, field, value) {
    const updated = { ...dayData };
    if (!updated[key]) updated[key] = {};
    if (!updated[key][orixaIdx]) updated[key][orixaIdx] = { link: "", audio: "", text: "" };
    updated[key][orixaIdx][field] = value;
    setDayData(updated);
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "oseData"), updated);
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  function updateDefault(orixa, field, value) {
    setDefaults((prev) => ({ ...prev, [orixa]: { ...(prev[orixa] || {}), [field]: value } }));
  }

  if (!isConselho) return null;
  if (loading) return <p style={{ color: "#888" }}>Carregando...</p>;

  // Cálculo do calendário pra aba de override
  const firstDay = new Date(curYear, curMonth, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const EPOCH = new Date(2026, 0, 1);
  const getOseType = (date) => {
    const diff = Math.floor((date - EPOCH) / 86400000);
    return OSE_TYPES[((diff % 4) + 4) % 4];
  };

  const selectedDate = selDay ? new Date(curYear, curMonth, selDay) : null;
  const selectedOse = selectedDate ? getOseType(selectedDate) : null;
  const dayKey = selectedDate ? `${curYear}-${curMonth}-${selDay}` : null;

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
        Configure orações, áudios e links padrão por Orixá, ou sobrescreva em dias específicos.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button onClick={() => setTab("defaults")} className={`btn ${tab === "defaults" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "0.85rem" }}>
          Conteúdo Padrão por Orixá
        </button>
        <button onClick={() => setTab("override")} className={`btn ${tab === "override" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "0.85rem" }}>
          Override por Dia
        </button>
      </div>

      {/* TAB: Conteúdo padrão por Orixá */}
      {tab === "defaults" && (
        <div>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "1rem" }}>
            Esses conteúdos aparecem como padrão em todos os dias do respectivo Orixá, quando não há override específico.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            {ALL_ORIXAS.map(({ name, color, bg }) => {
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

      {/* TAB: Override por dia */}
      {tab === "override" && (
        <div>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "1rem" }}>
            Clique em um dia para editar o conteúdo específico, sobrescrevendo o padrão do Orixá naquele dia.
          </p>

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
                const date = new Date(curYear, curMonth, d);
                const ose = getOseType(date);
                const key = `${curYear}-${curMonth}-${d}`;
                const hasOverride = dayData[key] && Object.values(dayData[key]).some((v) => v.text || v.audio || v.link);
                const isSel = selDay === d;
                return (
                  <div key={d} onClick={() => setSelDay(d)} style={{
                    padding: "0.5rem 0.25rem", borderRadius: "8px", cursor: "pointer", textAlign: "center",
                    background: isSel ? ose.color : "transparent",
                    border: hasOverride && !isSel ? `2px solid ${ose.color}` : "2px solid transparent",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isSel ? "white" : "#333" }}>{d}</div>
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "2px" }}>
                      {ose.orixas.map((ox) => (
                        <div key={ox} style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.7)" : ose.color }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDate && selectedOse && (
            <div className="card" style={{ borderLeft: `4px solid ${selectedOse.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{selDay} de {MONTHS[curMonth]} de {curYear}</h3>
                {saving && <span style={{ fontSize: "0.8rem", color: "var(--egbe-green)" }}>Salvando...</span>}
              </div>

              {selectedOse.orixas.map((ox, idx) => {
                const data = dayData[dayKey]?.[idx] || { link: "", audio: "", text: "" };
                return (
                  <div key={ox} style={{ padding: "1rem", background: selectedOse.bg, borderRadius: "8px", marginBottom: "0.75rem" }}>
                    <h4 style={{ color: selectedOse.color, fontSize: "1rem", marginBottom: "0.75rem" }}>{ox}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <div>
                        <label className="label">Texto da oração (override)</label>
                        <textarea className="input-field" rows={3} value={data.text || ""} onChange={(e) => saveDayData(dayKey, idx, "text", e.target.value)} style={{ resize: "vertical" }} />
                      </div>
                      <div>
                        <label className="label">Áudio (URL)</label>
                        <input className="input-field" type="url" value={data.audio || ""} onChange={(e) => saveDayData(dayKey, idx, "audio", e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Link</label>
                        <input className="input-field" type="url" value={data.link || ""} onChange={(e) => saveDayData(dayKey, idx, "link", e.target.value)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
