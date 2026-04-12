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
import { doc, getDoc } from "firebase/firestore";
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

const ALL_ORIXAS_META = OSE_TYPES.flatMap((t) => t.orixas.map((ox) => ({ name: ox, color: t.color, bg: t.bg })));
const ORIXA_META = Object.fromEntries(ALL_ORIXAS_META.map((o) => [o.name, o]));

export default function FOseCalendar() {
  const { isAdmin } = useAuth();
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(new Date().getMonth());
  const [selDay, setSelDay] = useState(null);
  const [filters, setFilters] = useState([]);
  const [dayOverrides, setDayOverrides] = useState({});
  const [defaults, setDefaults] = useState({});

  useEffect(() => {
    async function load() {
      const [daySnap, defSnap] = await Promise.all([
        getDoc(doc(db, "settings", "oseData")),
        getDoc(doc(db, "settings", "oseDefaults")),
      ]);
      if (daySnap.exists()) setDayOverrides(daySnap.data());
      if (defSnap.exists()) setDefaults(defSnap.data());
    }
    load();
  }, []);

  function getOrixasForDay(y, m, d) {
    const key = `${y}-${m}-${d}`;
    if (dayOverrides[key]?.orixas) return dayOverrides[key].orixas;
    return getOseType(new Date(y, m, d)).orixas;
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
  const selectedOrixas = selDay ? getOrixasForDay(curYear, curMonth, selDay) : [];
  const selectedMainColor = selectedOrixas[0] ? ORIXA_META[selectedOrixas[0]]?.color : null;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Calendário de Ọ̀sẹ̀</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Calendário litúrgico com o ciclo de 4 tipos de Osè — clique em um dia para ver os Orixás e anexar orações.
      </p>

      {/* Filtros multi-select */}
      <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#666" }}>Filtrar por Orixá</span>
          {filters.length > 0 && (
            <button onClick={() => setFilters([])} style={{ background: "none", border: "none", color: "var(--egbe-green)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
              Limpar ({filters.length})
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {OSE_TYPES.map((t) => t.orixas.map((ox) => {
            const active = filters.includes(ox);
            return (
              <label key={ox} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", userSelect: "none" }}>
                <span style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  border: `2px solid ${t.color}`,
                  background: active ? t.color : "white",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", flexShrink: 0,
                }}>
                  {active && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 700 }}>✓</span>}
                </span>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => setFilters(active ? filters.filter((f) => f !== ox) : [...filters, ox])}
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                />
                <span style={{ fontSize: "0.82rem", color: active ? t.color : "#666", fontWeight: active ? 600 : 500 }}>
                  {ox}
                </span>
              </label>
            );
          }))}
        </div>
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
            const orixas = getOrixasForDay(curYear, curMonth, d);
            const mainColor = orixas[0] ? ORIXA_META[orixas[0]]?.color : "#888";
            const isToday = date.toDateString() === today.toDateString();
            const isSel = selDay === d;
            const isDimmed = filters.length > 0 && !orixas.some((ox) => filters.includes(ox));
            return (
              <div key={d} onClick={() => setSelDay(d)} style={{
                padding: "0.5rem 0.25rem", borderRadius: "8px", cursor: "pointer", textAlign: "center",
                background: isSel ? mainColor : isToday ? "#f0f0f0" : "transparent",
                opacity: isDimmed ? 0.25 : 1,
                border: isToday && !isSel ? "2px solid var(--egbe-green)" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isSel ? "white" : "#333" }}>{d}</div>
                <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "2px", flexWrap: "wrap", maxWidth: "60px", marginLeft: "auto", marginRight: "auto" }}>
                  {orixas.map((ox) => (
                    <div key={ox} style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.7)" : (ORIXA_META[ox]?.color || "#888") }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhe do dia */}
      {selectedDate && selectedOrixas.length > 0 && (
        <div className="card" style={{ borderLeft: `4px solid ${selectedMainColor}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{selDay} de {MONTHS[curMonth]} de {curYear}</h3>
              <p style={{ color: "#888", fontSize: "0.85rem" }}>Ọ̀sẹ̀ de {selectedOrixas.join(" e ")}</p>
            </div>
          </div>

          {selectedOrixas.map((ox) => {
            const meta = ORIXA_META[ox] || { color: "#888", bg: "#f3f4f6" };
            const data = defaults[ox] || {};
            const hasContent = data.link || data.audio || data.text;
            return (
              <div key={ox} style={{ padding: "1rem", background: meta.bg, borderRadius: "8px", marginBottom: "0.75rem" }}>
                <h4 style={{ color: meta.color, fontSize: "1rem", marginBottom: "0.75rem" }}>{ox}</h4>
                {!hasContent ? (
                  <p style={{ fontSize: "0.85rem", color: "#888", fontStyle: "italic" }}>
                    Nenhum conteúdo cadastrado para este Òrìṣà.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {data.text && <p style={{ fontSize: "0.88rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.text}</p>}
                    {data.audio && (
                      <div>
                        <audio controls src={data.audio} style={{ width: "100%", maxWidth: "400px" }}>Seu navegador não suporta áudio.</audio>
                      </div>
                    )}
                    {data.link && <a href={data.link} target="_blank" rel="noopener" style={{ display: "inline-block", fontSize: "0.85rem", color: meta.color, fontWeight: 600 }}>🔗 Abrir link ↗</a>}
                  </div>
                )}
              </div>
            );
          })}

          {isAdmin && (
            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#f0f7f3", borderRadius: "8px", border: "1px solid #d1fae5", fontSize: "0.82rem", color: "var(--egbe-green-dark)" }}>
              ⚙️ Para editar orações/áudios por Òrìṣà ou ajustar os Òrìṣà de cada dia, acesse a <a href="/dashboard/admin/ose" style={{ color: "var(--egbe-green-dark)", fontWeight: 600, textDecoration: "underline" }}>Gestão do Calendário de Ọ̀sẹ̀</a>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
