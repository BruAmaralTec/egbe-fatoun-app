// ========================================
// components/FOseCalendar.js
// [F = Frontend Component]
// Calendário de Ọ̀sẹ̀ — visualização
// ========================================

"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { DEFAULT_ORIXAS, buildOrixaMaps, DEFAULT_CYCLES } from "@/lib/LOse";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function FOseCalendar() {
  const { user, profile, setProfile, isAdmin } = useAuth();
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(new Date().getMonth());
  const [selDay, setSelDay] = useState(null);
  const [filters, setFilters] = useState([]);
  const [cycleFilters, setCycleFilters] = useState([]);
  const [timeFilter, setTimeFilter] = useState("mes");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [showOrixaDropdown, setShowOrixaDropdown] = useState(false);
  const orixaDropdownRef = useRef(null);
  const [dayOverrides, setDayOverrides] = useState({});
  const [defaults, setDefaults] = useState({});
  const [cycles, setCycles] = useState(DEFAULT_CYCLES);
  const [orixas, setOrixas] = useState(DEFAULT_ORIXAS);

  useEffect(() => {
    async function load() {
      const [daySnap, defSnap, cycSnap, oxSnap] = await Promise.all([
        getDoc(doc(db, "settings", "oseData")).catch((e) => { console.warn("oseData:", e.message); return null; }),
        getDoc(doc(db, "settings", "oseDefaults")).catch((e) => { console.warn("oseDefaults:", e.message); return null; }),
        getDoc(doc(db, "settings", "oseCycles")).catch((e) => { console.warn("oseCycles:", e.message); return null; }),
        getDoc(doc(db, "settings", "oseOrixas")).catch((e) => { console.warn("oseOrixas:", e.message); return null; }),
      ]);
      if (daySnap?.exists()) setDayOverrides(daySnap.data());
      if (defSnap?.exists()) setDefaults(defSnap.data());
      if (cycSnap?.exists()) setCycles(cycSnap.data());
      if (oxSnap?.exists() && oxSnap.data().list) setOrixas(oxSnap.data().list);
    }
    load();
  }, []);

  const { colors: ORIXA_COLOR, bgs: ORIXA_BG } = buildOrixaMaps(orixas);

  // Drill-down: Òrìṣà disponíveis limitam-se aos ciclos selecionados
  const availableOrixas = cycleFilters.length === 0
    ? orixas
    : orixas.filter((o) => cycleFilters.some((cid) => (cycles[cid]?.orixas || []).includes(o.name)));

  // Limpa seleção de Òrìṣà que saíram do drill-down
  useEffect(() => {
    const names = availableOrixas.map((o) => o.name);
    setFilters((prev) => prev.filter((f) => names.includes(f)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleFilters, cycles, orixas]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (orixaDropdownRef.current && !orixaDropdownRef.current.contains(e.target)) {
        setShowOrixaDropdown(false);
      }
    }
    if (showOrixaDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showOrixaDropdown]);

  function getOrixasForDay(y, m, d) {
    const key = `${y}-${m}-${d}`;
    if (dayOverrides[key]?.orixas) return dayOverrides[key].orixas;
    return [];
  }

  function getCyclesForDay(y, m, d) {
    const t = new Date(y, m, d).getTime();
    return Object.values(cycles || {}).filter((c) => {
      if (!c.startDate || !c.cycleDays) return false;
      const start = new Date(c.startDate + "T00:00:00").getTime();
      const diff = Math.floor((t - start) / 86400000);
      return diff >= 0 && diff % c.cycleDays === 0;
    });
  }

  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const today = new Date();

  // Info do dia de hoje (sempre exibido no topo)
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();
  const todayOrixas = getOrixasForDay(todayY, todayM, todayD);
  const todayCycles = getCyclesForDay(todayY, todayM, todayD);
  const todayMainColor = todayOrixas[0] ? ORIXA_COLOR[todayOrixas[0]] : "var(--egbe-green)";

  function changeMonth(dir) {
    let m = curMonth + dir;
    let y = curYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCurMonth(m);
    setCurYear(y);
    setSelDay(null);
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Calendário de Ọ̀sẹ̀</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Calendário — clique num dia para ver os Òrìṣà que regem e suas orações.
      </p>

      {/* Card do dia de hoje (padrão no topo) */}
      <div className="card" style={{ marginBottom: "1.25rem", borderLeft: `4px solid ${todayMainColor}` }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: todayMainColor, marginBottom: "0.25rem" }}>
          Ọ̀sẹ̀ de Hoje
        </p>
        <h3 style={{ fontSize: "1.05rem", margin: 0 }}>
          {todayD} de {MONTHS[todayM]} de {todayY}
        </h3>
        {todayCycles.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
            {todayCycles.map((c) => (
              <span key={c.id} style={{ fontSize: "0.78rem", padding: "0.2rem 0.6rem", borderRadius: "12px", background: (c.color || "#6b7280") + "20", color: c.color || "#374151", fontWeight: 600 }}>
                {c.name}
              </span>
            ))}
          </div>
        )}
        {todayOrixas.length > 0 ? (
          <p style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            {todayOrixas.join(" • ")}
          </p>
        ) : (
          <p style={{ color: "#aaa", fontSize: "0.85rem", marginTop: "0.5rem", fontStyle: "italic" }}>
            Nenhum Òrìṣà registrado para hoje.
          </p>
        )}
      </div>

      {/* Mutirão de Ọ̀sẹ̀ — se o usuário tem grupo e é dia de ọ̀sẹ̀ */}
      {profile?.mutiraoGrupo && todayOrixas.length > 0 && (() => {
        const rsvpKey = `${todayY}-${todayM}-${todayD}`;
        const rsvp = profile.mutiraoRsvp?.[rsvpKey];
        const hasResponded = rsvp?.confirmed === true || rsvp?.confirmed === false;

        async function handleRsvp(confirmed) {
          const newRsvp = { ...profile.mutiraoRsvp, [rsvpKey]: { confirmed, motivo: rsvp?.motivo || "", respondedAt: new Date().toISOString() } };
          setProfile({ ...profile, mutiraoRsvp: newRsvp });
          try { await updateDoc(doc(db, "users", user.uid), { mutiraoRsvp: newRsvp }); } catch {}
        }

        async function handleMotivo(motivo) {
          const newRsvp = { ...profile.mutiraoRsvp, [rsvpKey]: { ...rsvp, motivo } };
          setProfile({ ...profile, mutiraoRsvp: newRsvp });
          try { await updateDoc(doc(db, "users", user.uid), { mutiraoRsvp: newRsvp }); } catch {}
        }

        return (
          <div className="card" style={{ marginBottom: "1.25rem", borderLeft: "4px solid #D4A017", background: "#fffbeb" }}>
            <h3 style={{ fontSize: "1.05rem", color: "#92400e", marginBottom: "0.4rem" }}>Mutirão de Ọ̀sẹ̀ na Ẹgbẹ́</h3>
            <p style={{ fontSize: "0.88rem", color: "#555", marginBottom: "0.25rem" }}>
              {todayD} de {MONTHS[todayM]} de {todayY} · {profile.mutiraoGrupo === "grupo1" ? "Mutirão Grupo 1" : "Mutirão Grupo 2"}
            </p>
            <p style={{ fontSize: "0.88rem", color: "#555", marginBottom: "0.75rem" }}>
              Você está convocado para estar na Ẹgbẹ́ ajudando nas atividades.
            </p>
            <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#333", marginBottom: "0.5rem" }}>Você poderá comparecer?</p>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <button
                onClick={() => handleRsvp(true)}
                style={{
                  padding: "0.4rem 1rem", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  background: rsvp?.confirmed === true ? "#22c55e" : "white", color: rsvp?.confirmed === true ? "white" : "#22c55e",
                  border: "2px solid #22c55e",
                }}
              >
                {rsvp?.confirmed === true ? "✓ " : ""}Sim
              </button>
              <button
                onClick={() => handleRsvp(false)}
                style={{
                  padding: "0.4rem 1rem", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  background: rsvp?.confirmed === false ? "#ef4444" : "white", color: rsvp?.confirmed === false ? "white" : "#ef4444",
                  border: "2px solid #ef4444",
                }}
              >
                {rsvp?.confirmed === false ? "✓ " : ""}Não
              </button>
            </div>
            {rsvp?.confirmed === false && (
              <div>
                <label style={{ fontSize: "0.82rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>Motivo:</label>
                <input
                  className="input-field"
                  value={rsvp?.motivo || ""}
                  onChange={(e) => handleMotivo(e.target.value)}
                  placeholder="Informe o motivo..."
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
            )}
            {hasResponded && rsvp?.confirmed && (
              <p style={{ fontSize: "0.82rem", color: "#22c55e", fontWeight: 600 }}>✓ Presença confirmada. Àṣẹ!</p>
            )}
          </div>
        );
      })()}

      {/* Filtros no topo: Òrìṣà (drilldown multi) + período */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Dropdown multi-select de Òrìṣà (respeita drilldown pelos ciclos) */}
        <div ref={orixaDropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowOrixaDropdown((s) => !s)}
            className={`btn ${filters.length > 0 ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "0.82rem", padding: "0.35rem 0.9rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            {filters.length === 0 ? "Filtrar Òrìṣà" : `Òrìṣà (${filters.length})`}
            <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>▼</span>
          </button>
          {showOrixaDropdown && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 20,
              minWidth: "240px", maxWidth: "320px", maxHeight: "320px", overflowY: "auto",
              background: "white", border: "1px solid #e5e7eb", borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "0.6rem 0.75rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}>
                  {cycleFilters.length > 0 ? "Dos ciclos selecionados" : "Todos os Òrìṣà"}
                </span>
                {filters.length > 0 && (
                  <button onClick={() => setFilters([])} style={{ background: "none", border: "none", color: "var(--egbe-green)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
                    Limpar
                  </button>
                )}
              </div>
              {availableOrixas.length === 0 ? (
                <span style={{ fontSize: "0.82rem", color: "#aaa", fontStyle: "italic" }}>
                  Nenhum Òrìṣà nos ciclos selecionados.
                </span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {availableOrixas.map(({ name, color }) => {
                    const active = filters.includes(name);
                    return (
                      <label key={name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}>
                        <span style={{
                          width: "18px", height: "18px", borderRadius: "50%",
                          border: `2px solid ${color}`,
                          background: active ? color : "white",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {active && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 700 }}>✓</span>}
                        </span>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => setFilters(active ? filters.filter((f) => f !== name) : [...filters, name])}
                          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                        />
                        <span style={{ fontSize: "0.85rem", color: active ? color : "#444", fontWeight: active ? 600 : 500 }}>
                          {name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {[
          { id: "semana", label: "Semana" },
          { id: "mes", label: "Mês" },
          { id: "periodo", label: "Período" },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              setTimeFilter(opt.id);
              if (opt.id === "semana") {
                const now = new Date();
                if (now.getMonth() !== curMonth || now.getFullYear() !== curYear) {
                  setCurMonth(now.getMonth());
                  setCurYear(now.getFullYear());
                }
              }
            }}
            className={`btn ${timeFilter === opt.id ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "0.82rem", padding: "0.35rem 0.9rem" }}
          >
            {opt.label}
          </button>
        ))}
        {timeFilter === "periodo" && (
          <>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="input-field" style={{ padding: "0.35rem 0.5rem", width: "150px", fontSize: "0.8rem" }} />
            <span style={{ fontSize: "0.8rem", color: "#888" }}>até</span>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="input-field" style={{ padding: "0.35rem 0.5rem", width: "150px", fontSize: "0.8rem" }} />
          </>
        )}
      </div>

      {/* Navegação do mês (só quando não está em Período) */}
      {timeFilter !== "periodo" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <button onClick={() => changeMonth(-1)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>←</button>
          <h2 style={{ fontSize: "1.2rem" }}>{MONTHS[curMonth]} {curYear}</h2>
          <button onClick={() => changeMonth(1)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>→</button>
        </div>
      )}

      {/* Lista de dias */}
      {(() => {
        if (timeFilter === "periodo" && (!periodStart || !periodEnd)) {
          return (
            <div className="card" style={{ marginBottom: "1.5rem", textAlign: "center", padding: "1.5rem", color: "#888" }}>
              Escolha as datas de início e fim do período.
            </div>
          );
        }

        let dates = [];
        if (timeFilter === "periodo") {
          const s = new Date(periodStart + "T00:00:00");
          const e = new Date(periodEnd + "T00:00:00");
          if (s <= e) {
            const cur = new Date(s);
            while (cur <= e) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
          }
        } else if (timeFilter === "semana") {
          const t0 = new Date(); t0.setHours(0, 0, 0, 0);
          const dow = t0.getDay() === 0 ? 6 : t0.getDay() - 1;
          const start = new Date(t0); start.setDate(t0.getDate() - dow);
          const week = [];
          for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); week.push(d); }
          const idx = week.findIndex((x) => x.getFullYear() === todayY && x.getMonth() === todayM && x.getDate() === todayD);
          dates = idx > 0 ? [...week.slice(idx), ...week.slice(0, idx)] : week;
        } else {
          const month = [];
          for (let d = 1; d <= daysInMonth; d++) month.push(new Date(curYear, curMonth, d));
          const isCurrentMonth = curMonth === todayM && curYear === todayY;
          if (isCurrentMonth) {
            const idx = month.findIndex((x) => x.getDate() === todayD);
            dates = idx > 0 ? [...month.slice(idx), ...month.slice(0, idx)] : month;
          } else {
            dates = month;
          }
        }

        const matchingDays = dates.map((date) => {
          const y = date.getFullYear(); const m = date.getMonth(); const d = date.getDate();
          const dayOrixas = getOrixasForDay(y, m, d);
          const dayCycles = getCyclesForDay(y, m, d);
          const matchesOrixa = filters.length === 0 || dayOrixas.some((ox) => filters.includes(ox));
          const matchesCycle = cycleFilters.length === 0 || dayCycles.some((c) => cycleFilters.includes(c.id));
          return { y, m, d, dayOrixas, dayCycles, match: matchesOrixa && matchesCycle && dayOrixas.length > 0 };
        }).filter((x) => x.match);

        const rangeLabel = timeFilter === "mes" ? `em ${MONTHS[curMonth]}` : timeFilter === "semana" ? "nesta semana" : "no período";

        if (matchingDays.length === 0) return (
          <div className="card" style={{ marginBottom: "1.5rem", textAlign: "center", padding: "1.5rem", color: "#aaa" }}>
            Nenhum dia de Ọ̀sẹ̀ encontrado {rangeLabel}.
          </div>
        );

        const onToggle = (y, m, d) => {
          const isOpen = selDay === d && curMonth === m && curYear === y;
          if (isOpen) { setSelDay(null); return; }
          if (y !== curYear) setCurYear(y);
          if (m !== curMonth) setCurMonth(m);
          setSelDay(d);
        };

        return (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>
              {matchingDays.length} dia(s) encontrado(s) {rangeLabel}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {matchingDays.map(({ y, m, d, dayOrixas, dayCycles }) => {
                const mainColor = dayOrixas[0] ? ORIXA_COLOR[dayOrixas[0]] : "#888";
                const isSel = selDay === d && curMonth === m && curYear === y;
                return (
                  <div
                    key={`${y}-${m}-${d}`}
                    style={{
                      background: isSel ? mainColor + "15" : "#f9fafb",
                      borderRadius: "8px", border: `1px solid ${isSel ? mainColor : "#e5e7eb"}`,
                      borderLeft: `4px solid ${mainColor}`,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => onToggle(y, m, d)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0.6rem 0.9rem", background: "transparent", border: "none",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          {d} de {MONTHS[m]}{timeFilter === "periodo" ? ` de ${y}` : ""}
                        </span>
                        {dayCycles.length > 0 && (
                          <span style={{ fontSize: "0.75rem", color: dayCycles[0].color || "#666", marginLeft: "0.5rem" }}>
                            {dayCycles.map((c) => c.name).join(", ")}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.82rem", color: "#555", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {dayOrixas.join(" • ")}
                        <span style={{ color: "#888", fontSize: "0.7rem", transform: isSel ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
                      </span>
                    </button>
                    {isSel && (
                      <div style={{ padding: "0 0.9rem 0.9rem 0.9rem" }}>
                        {dayOrixas.map((ox) => {
                          const color = ORIXA_COLOR[ox] || "#888";
                          const bg = ORIXA_BG[ox] || "#f3f4f6";
                          const data = defaults[ox] || {};
                          const hasContent = data.link || data.audio || data.text;
                          return (
                            <div key={ox} style={{ padding: "0.8rem", background: bg, borderRadius: "8px", marginBottom: "0.5rem" }}>
                              <h4 style={{ color, fontSize: "0.95rem", marginBottom: "0.5rem" }}>{ox}</h4>
                              {!hasContent ? (
                                <p style={{ fontSize: "0.82rem", color: "#888", fontStyle: "italic" }}>
                                  Nenhum conteúdo cadastrado para este Òrìṣà.
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                  {data.text && <div className="rich-editor-content" style={{ fontSize: "0.85rem", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: data.text }} />}
                                  {data.audio && (
                                    <div>
                                      <audio controls src={data.audio} style={{ width: "100%", maxWidth: "400px" }}>Seu navegador não suporta áudio.</audio>
                                    </div>
                                  )}
                                  {data.link && <a href={data.link} target="_blank" rel="noopener" style={{ display: "inline-block", fontSize: "0.82rem", color, fontWeight: 600 }}>🔗 Abrir link ↗</a>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {isAdmin && (
                          <div style={{ marginTop: "0.5rem", padding: "0.6rem 0.9rem", background: "#f0f7f3", borderRadius: "8px", border: "1px solid #d1fae5", fontSize: "0.8rem", color: "var(--egbe-green-dark)" }}>
                            ⚙️ Para editar, acesse a <a href="/dashboard/admin/ose" style={{ color: "var(--egbe-green-dark)", fontWeight: 600, textDecoration: "underline" }}>Gestão do Calendário de Ọ̀sẹ̀</a>.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Filtro de Ciclo embaixo do calendário (bolinhas) */}
      <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#666" }}>Filtrar por Ciclo</span>
          {cycleFilters.length > 0 && (
            <button onClick={() => setCycleFilters([])} style={{ background: "none", border: "none", color: "var(--egbe-green)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
              Limpar ({cycleFilters.length})
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {Object.values(cycles || {}).map((c) => {
            const color = c.color || "#6b7280";
            const active = cycleFilters.includes(c.id);
            return (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", userSelect: "none" }}>
                <span style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  border: `2px solid ${color}`,
                  background: active ? color : "white",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {active && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 700 }}>✓</span>}
                </span>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => setCycleFilters(active ? cycleFilters.filter((f) => f !== c.id) : [...cycleFilters, c.id])}
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                />
                <span style={{ fontSize: "0.82rem", color: active ? color : "#666", fontWeight: active ? 600 : 500 }}>
                  {c.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
