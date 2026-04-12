// ========================================
// components/FOseCalendar.js
// [F = Frontend Component]
// Agenda de Ọ̀SẸ̀ — Calendário litúrgico
// Ciclo de 4 dias: Ọ̀ṣun/Yemọjá → Ògún/Ọ̀ṣọ́ọ̀sì → Ṣàngó/Ọya → Obàtálá/Ifá
// Com anexos de link, áudio e oração por Orixá
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const OSE_TYPES = [
  { id: 0, orixas: ["Ọ̀ṣun", "Yemọjá"], color: "#D4A017", bg: "#fef3cd" },
  { id: 1, orixas: ["Ògún", "Ọ̀ṣọ́ọ̀sì"], color: "#1B6B3A", bg: "#d1fae5" },
  { id: 2, orixas: ["Ṣàngó", "Ọya"], color: "#B22222", bg: "#fde8e8" },
  { id: 3, orixas: ["Obàtálá", "Ifá"], color: "#1a4080", bg: "#dbeafe" },
];

// Epoch: 1 Jan 2026 = tipo 0
const EPOCH = new Date(2026, 0, 1);

function getOseType(date) {
  const diff = Math.floor((date - EPOCH) / 86400000);
  const idx = ((diff % 4) + 4) % 4;
  return OSE_TYPES[idx];
}

export default function FOseCalendar() {
  const { isAdmin } = useAuth();
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(new Date().getMonth());
  const [selDay, setSelDay] = useState(null);
  const [filter, setFilter] = useState(null);
  const [dayData, setDayData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "settings", "oseData"));
      if (snap.exists()) setDayData(snap.data());
    }
    load();
  }, []);

  async function saveOseData(key, orixaIdx, field, value) {
    const updated = { ...dayData };
    if (!updated[key]) updated[key] = {};
    if (!updated[key][orixaIdx]) updated[key][orixaIdx] = { link: "", audio: "", text: "" };
    updated[key][orixaIdx][field] = value;
    setDayData(updated);
    if (isAdmin) {
      setSaving(true);
      await setDoc(doc(db, "settings", "oseData"), updated, { merge: true });
      setSaving(false);
    }
  }

  function changeMonth(dir) {
    let m = curMonth + dir;
    let y = curYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCurMonth(m);
    setCurYear(y);
    setSelDay(null);
  }

  // Build calendar
  const firstDay = new Date(curYear, curMonth, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const today = new Date();

  const selectedDate = selDay ? new Date(curYear, curMonth, selDay) : null;
  const selectedOse = selectedDate ? getOseType(selectedDate) : null;
  const dayKey = selectedDate ? `${curYear}-${curMonth}-${selDay}` : null;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Agenda de Ọ̀SẸ̀</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Calendário litúrgico com o ciclo de 4 tipos de Osè — clique em um dia para ver os Orixás e anexar orações.
      </p>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button onClick={() => setFilter(null)} className="btn" style={{ padding: "0.35rem 0.9rem", fontSize: "0.78rem", background: !filter ? "var(--egbe-green)" : "white", color: !filter ? "white" : "#666", border: "1.5px solid", borderColor: !filter ? "var(--egbe-green)" : "#e5e7eb" }}>Todos</button>
        {OSE_TYPES.map(t => t.orixas.map(ox => (
          <button key={ox} onClick={() => setFilter(filter === ox ? null : ox)} style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem", borderRadius: "20px", cursor: "pointer", border: "1.5px solid", fontWeight: 600, borderColor: filter === ox ? t.color : "#e5e7eb", background: filter === ox ? t.bg : "white", color: t.color, fontFamily: "inherit" }}>{ox}</button>
        )))}
      </div>

      {/* Navegação */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button onClick={() => changeMonth(-1)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>←</button>
        <h2 style={{ fontSize: "1.2rem" }}>{MONTHS[curMonth]} {curYear}</h2>
        <button onClick={() => changeMonth(1)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>→</button>
      </div>

      {/* Calendário */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
          {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#888", padding: "0.4rem" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const date = new Date(curYear, curMonth, d);
            const ose = getOseType(date);
            const isToday = date.toDateString() === today.toDateString();
            const isSel = selDay === d;
            const isDimmed = filter && !ose.orixas.includes(filter);
            return (
              <div key={d} onClick={() => setSelDay(d)} style={{
                padding: "0.5rem 0.25rem", borderRadius: "8px", cursor: "pointer", textAlign: "center",
                background: isSel ? ose.color : isToday ? "#f0f0f0" : "transparent",
                opacity: isDimmed ? 0.25 : 1,
                border: isToday && !isSel ? "2px solid var(--egbe-green)" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isSel ? "white" : "#333" }}>{d}</div>
                <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "2px" }}>
                  {ose.orixas.map(ox => (
                    <div key={ox} style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.7)" : ose.color }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhe do dia */}
      {selectedDate && selectedOse && (
        <div className="card" style={{ borderLeft: `4px solid ${selectedOse.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{selDay} de {MONTHS[curMonth]} de {curYear}</h3>
              <p style={{ color: "#888", fontSize: "0.85rem" }}>Osè de {selectedOse.orixas.join(" e ")}</p>
            </div>
            {saving && <span style={{ fontSize: "0.8rem", color: "var(--egbe-green)" }}>Salvando...</span>}
          </div>

          {selectedOse.orixas.map((ox, idx) => {
            const data = dayData[dayKey]?.[idx] || { link: "", audio: "", text: "" };
            return (
              <div key={ox} style={{ padding: "1rem", background: selectedOse.bg, borderRadius: "8px", marginBottom: "0.75rem" }}>
                <h4 style={{ color: selectedOse.color, fontSize: "1rem", marginBottom: "0.75rem" }}>{ox}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div>
                    <label className="label">Link</label>
                    <input className="input-field" type="url" placeholder="https://..." value={data.link} onChange={e => saveOseData(dayKey, idx, "link", e.target.value)} disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="label">URL do áudio (Drive, SoundCloud...)</label>
                    <input className="input-field" type="url" placeholder="https://drive.google.com/..." value={data.audio} onChange={e => saveOseData(dayKey, idx, "audio", e.target.value)} disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="label">Texto da oração</label>
                    <textarea className="input-field" rows={3} placeholder={`Ẹ káàárọ̀ ${ox}...`} value={data.text} onChange={e => saveOseData(dayKey, idx, "text", e.target.value)} disabled={!isAdmin} style={{ resize: "vertical" }} />
                  </div>
                </div>
                {data.link && <a href={data.link} target="_blank" rel="noopener" style={{ display: "inline-block", marginTop: "0.5rem", fontSize: "0.82rem", color: selectedOse.color }}>Abrir link ↗</a>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
