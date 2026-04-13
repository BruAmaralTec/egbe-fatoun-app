// ========================================
// components/admin/FOseAdmin.js
// [F = Frontend Component]
// Gestão do Calendário de Ọ̀sẹ̀ — admin
// Abas: Conteúdo por Òrìṣà, Ciclos de Ọ̀sẹ̀, Configuração do Período
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import FRichTextEditor from "@/components/FRichTextEditor";
import { DEFAULT_ORIXAS, buildOrixaMaps, DEFAULT_CYCLES } from "@/lib/LOse";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function dayKey(y, m, d) { return `${y}-${m}-${d}`; }

export default function FOseAdmin() {
  const { profile, isConselho } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("cycles");
  const [defaults, setDefaults] = useState({});
  const [cycles, setCycles] = useState(DEFAULT_CYCLES);
  const [orixas, setOrixas] = useState(DEFAULT_ORIXAS);
  const [dayOverrides, setDayOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(new Date().getMonth());
  const [selDay, setSelDay] = useState(null);

  const [resetStart, setResetStart] = useState("");
  const [resetEnd, setResetEnd] = useState("");

  const [genStart, setGenStart] = useState("");
  const [genEnd, setGenEnd] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => { if (profile && !isConselho) router.push("/dashboard"); }, [profile, isConselho, router]);

  useEffect(() => {
    async function load() {
      try {
        const [defSnap, daySnap, cycSnap, oxSnap] = await Promise.all([
          getDoc(doc(db, "settings", "oseDefaults")),
          getDoc(doc(db, "settings", "oseData")),
          getDoc(doc(db, "settings", "oseCycles")),
          getDoc(doc(db, "settings", "oseOrixas")),
        ]);
        if (defSnap.exists()) setDefaults(defSnap.data());
        if (daySnap.exists()) setDayOverrides(daySnap.data());
        if (cycSnap.exists()) setCycles(cycSnap.data());
        if (oxSnap.exists() && oxSnap.data().list) setOrixas(oxSnap.data().list);
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

  async function saveCycles(next) {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "oseCycles"), next);
    } catch (err) { alert("Erro ao salvar ciclos: " + err.message); }
    setSaving(false);
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

  function updateCycle(id, field, value) {
    const next = { ...cycles, [id]: { ...cycles[id], [field]: value } };
    setCycles(next);
    saveCycles(next);
  }

  function addCycle() {
    const id = "cycle-" + Date.now();
    const next = { ...cycles, [id]: { id, name: "Novo Ciclo", orixas: [], startDate: "", cycleDays: 4, color: "#6b7280" } };
    setCycles(next);
    saveCycles(next);
  }

  function removeCycle(id) {
    if (!confirm(`Remover o ciclo "${cycles[id]?.name}"?`)) return;
    const next = { ...cycles };
    delete next[id];
    setCycles(next);
    saveCycles(next);
  }

  function toggleOrixaInCycle(id, orixaName) {
    const cur = cycles[id].orixas || [];
    const next = cur.includes(orixaName) ? cur.filter((o) => o !== orixaName) : [...cur, orixaName];
    updateCycle(id, "orixas", next);
  }

  function getOrixasForDay(y, m, d) {
    const key = dayKey(y, m, d);
    if (dayOverrides[key]?.orixas) return dayOverrides[key].orixas;
    return [];
  }

  async function setOrixasForDay(y, m, d, orixas) {
    const key = dayKey(y, m, d);
    const updated = { ...dayOverrides, [key]: { orixas } };
    setDayOverrides(updated);
    await persistOverrides(updated);
  }

  async function resetKeys(keys, scopeLabel = "esse período") {
    if (keys.length === 0) {
      alert(`Nenhuma customização para resetar em ${scopeLabel}.`);
      return;
    }
    if (!confirm(`Resetar ${keys.length} dia(s) customizado(s)?`)) return;
    const updated = { ...dayOverrides };
    keys.forEach((k) => { delete updated[k]; });
    setDayOverrides(updated);
    await persistOverrides(updated);
    alert(`${keys.length} dia(s) resetado(s).`);
  }

  async function resetDay() {
    if (!selDay) { alert("Selecione um dia no calendário primeiro."); return; }
    const key = dayKey(curYear, curMonth, selDay);
    if (!dayOverrides[key]) { alert("Este dia não tem customização."); return; }
    await resetKeys([key], `${selDay} de ${MONTHS[curMonth]}`);
  }
  async function resetMonth() {
    const keys = Object.keys(dayOverrides).filter((k) => {
      const [y, m] = k.split("-").map(Number);
      return y === curYear && m === curMonth;
    });
    await resetKeys(keys, `${MONTHS[curMonth]} de ${curYear}`);
  }
  async function resetYear() {
    const keys = Object.keys(dayOverrides).filter((k) => {
      const [y] = k.split("-").map(Number);
      return y === curYear;
    });
    await resetKeys(keys, `o ano de ${curYear}`);
  }
  async function resetPeriod() {
    if (!resetStart || !resetEnd) { alert("Selecione as duas datas."); return; }
    const start = new Date(resetStart + "T00:00:00").getTime();
    const end = new Date(resetEnd + "T00:00:00").getTime();
    if (start > end) { alert("Data inicial deve ser anterior à final."); return; }
    const keys = Object.keys(dayOverrides).filter((k) => {
      const [y, m, d] = k.split("-").map(Number);
      const t = new Date(y, m, d).getTime();
      return t >= start && t <= end;
    });
    await resetKeys(keys, `o período selecionado`);
  }

  async function generateCalendar() {
    if (!genStart || !genEnd) { alert("Selecione as duas datas do período."); return; }
    const start = new Date(genStart + "T00:00:00");
    const end = new Date(genEnd + "T00:00:00");
    if (start > end) { alert("Data inicial deve ser anterior à final."); return; }

    const validCycles = Object.values(cycles).filter((c) => c.startDate && c.cycleDays > 0 && (c.orixas || []).length > 0);
    if (validCycles.length === 0) {
      alert("Nenhum ciclo válido. Configure na aba 'Ciclos de Ọ̀sẹ̀' com data inicial, período e Òrìṣà.");
      return;
    }

    const totalDays = Math.floor((end - start) / 86400000) + 1;
    if (!confirm(`Gerar calendário com ${validCycles.length} ciclo(s) para ${totalDays} dia(s)?\n\nIsso vai SOBRESCREVER as customizações existentes no período.`)) return;

    setGenerating(true);
    try {
      const updated = { ...dayOverrides };
      const oneDay = 86400000;
      const cycleStarts = validCycles.map((c) => ({ ...c, startTs: new Date(c.startDate + "T00:00:00").getTime() }));

      for (let t = start.getTime(); t <= end.getTime(); t += oneDay) {
        const matching = new Set();
        for (const c of cycleStarts) {
          const diff = Math.floor((t - c.startTs) / oneDay);
          if (diff >= 0 && diff % c.cycleDays === 0) {
            (c.orixas || []).forEach((o) => matching.add(o));
          }
        }
        const d = new Date(t);
        const key = dayKey(d.getFullYear(), d.getMonth(), d.getDate());
        if (matching.size > 0) updated[key] = { orixas: Array.from(matching) };
        else delete updated[key];
      }
      setDayOverrides(updated);
      await persistOverrides(updated);
      alert(`Calendário gerado para ${totalDays} dia(s).`);
    } catch (err) {
      alert("Erro ao gerar: " + err.message);
    } finally {
      setGenerating(false);
    }
  }

  const { colors: ORIXA_COLOR } = buildOrixaMaps(orixas);

  async function saveOrixas(next) {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "oseOrixas"), { list: next });
    } catch (err) { alert("Erro: " + err.message); }
    setSaving(false);
  }

  function updateOrixa(index, field, value) {
    const next = [...orixas];
    next[index] = { ...next[index], [field]: value };
    setOrixas(next);
    saveOrixas(next);
  }

  function addOrixa() {
    const next = [...orixas, { name: "Novo Òrìṣà", color: "#6b7280", bg: "#f3f4f6" }];
    setOrixas(next);
    saveOrixas(next);
  }

  async function removeOrixa(index) {
    const target = orixas[index];
    if (!confirm(`Remover o Òrìṣà "${target.name}"?\n\nIsso também vai retirá-lo dos ciclos que o incluem.`)) return;
    const next = orixas.filter((_, i) => i !== index);
    setOrixas(next);
    await saveOrixas(next);

    // Remove das ciclos
    const cleanedCycles = { ...cycles };
    let changed = false;
    for (const id of Object.keys(cleanedCycles)) {
      const cur = cleanedCycles[id].orixas || [];
      if (cur.includes(target.name)) {
        cleanedCycles[id] = { ...cleanedCycles[id], orixas: cur.filter((o) => o !== target.name) };
        changed = true;
      }
    }
    if (changed) {
      setCycles(cleanedCycles);
      await saveCycles(cleanedCycles);
    }
  }

  if (!isConselho) return null;
  if (loading) return <p style={{ color: "#888" }}>Carregando...</p>;

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
        Configure conteúdos por Òrìṣà, monte ciclos de Ọ̀sẹ̀ e gere o calendário do período.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "cycles", label: "Ciclos de Ọ̀sẹ̀" },
          { id: "orixas", label: "Òrìṣà" },
          { id: "period", label: "Gerar Calendário" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "0.85rem" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Òrìṣà — CRUD unificado (metadados + conteúdo) */}
      {tab === "orixas" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <p style={{ fontSize: "0.82rem", color: "#888", margin: 0 }}>
              Cada card tem os dados do Òrìṣà (nome, cores) e seu conteúdo padrão (oração, áudio e link) aplicado a todos os dias regidos por ele.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={addOrixa} className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "0.4rem 1rem" }}>+ Novo Òrìṣà</button>
              <button onClick={saveDefaults} className="btn btn-primary" disabled={saving} style={{ fontSize: "0.82rem", padding: "0.4rem 1rem" }}>
                {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar conteúdos"}
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>
            {orixas.map((ox, i) => {
              const data = defaults[ox.name] || {};
              return (
                <div key={i} className="card" style={{ borderTop: `4px solid ${ox.color}` }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.72rem", color: "#888" }}>Nome</label>
                      <input className="input-field" value={ox.name} onChange={(e) => updateOrixa(i, "name", e.target.value)} style={{ padding: "0.4rem 0.6rem", fontSize: "1rem", fontWeight: 600, color: ox.color }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#888", display: "block" }}>Cor</label>
                      <input type="color" value={ox.color} onChange={(e) => updateOrixa(i, "color", e.target.value)} style={{ width: "36px", height: "34px", padding: 0, border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#888", display: "block" }}>Fundo</label>
                      <input type="color" value={ox.bg} onChange={(e) => updateOrixa(i, "bg", e.target.value)} style={{ width: "36px", height: "34px", padding: 0, border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer" }} />
                    </div>
                    <button onClick={() => removeOrixa(i)} title="Remover Òrìṣà" style={{ padding: "0.4rem 0.6rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "6px", color: "var(--egbe-red)", cursor: "pointer", fontSize: "0.85rem", height: "34px" }}>✕</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <div>
                      <label className="label">Oração padrão</label>
                      <FRichTextEditor value={data.text || ""} onChange={(html) => updateDefault(ox.name, "text", html)} placeholder={`Ẹ káàárọ̀ ${ox.name}...`} minHeight="140px" />
                    </div>
                    <div>
                      <label className="label">Áudio (URL)</label>
                      <input className="input-field" type="url" value={data.audio || ""} onChange={(e) => updateDefault(ox.name, "audio", e.target.value)} placeholder="https://drive.google.com/..." />
                    </div>
                    <div>
                      <label className="label">Link</label>
                      <input className="input-field" type="url" value={data.link || ""} onChange={(e) => updateDefault(ox.name, "link", e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Ciclos de Ọ̀sẹ̀ */}
      {tab === "cycles" && (
        <div>
          {/* Gerar calendário */}
          <div className="card" style={{ marginBottom: "1rem", padding: "0.85rem 1rem", background: "#f0f7f3", border: "1px solid #d1fae5" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--egbe-green-dark)" }}>🗓️ Gerar calendário:</span>
              <input type="date" value={genStart} onChange={(e) => setGenStart(e.target.value)} className="input-field" style={{ padding: "0.35rem 0.5rem", width: "160px", fontSize: "0.8rem" }} />
              <span style={{ fontSize: "0.8rem", color: "#666" }}>até</span>
              <input type="date" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} className="input-field" style={{ padding: "0.35rem 0.5rem", width: "160px", fontSize: "0.8rem" }} />
              <button onClick={generateCalendar} disabled={generating} className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "0.4rem 1rem" }}>
                {generating ? "Gerando..." : "Gerar calendário"}
              </button>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#666", marginTop: "0.5rem" }}>
              Aplica os ciclos abaixo ao período escolhido. Sobrescreve customizações existentes.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.82rem", color: "#888" }}>
              Cada ciclo agrupa vários Òrìṣà sob um nome e se repete a cada X dias a partir da data inicial.
            </p>
            <button onClick={addCycle} className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "0.4rem 1rem" }}>+ Novo ciclo</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1rem" }}>
            {Object.values(cycles).map((cycle) => (
              <div key={cycle.id} className="card" style={{ borderTop: `4px solid ${cycle.color || "#6b7280"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem" }}>
                  <input
                    value={cycle.name}
                    onChange={(e) => updateCycle(cycle.id, "name", e.target.value)}
                    className="input-field"
                    style={{ fontWeight: 600, fontSize: "1rem", color: cycle.color, flex: 1 }}
                    placeholder="Nome do ciclo"
                  />
                  <input
                    type="color"
                    value={cycle.color || "#6b7280"}
                    onChange={(e) => updateCycle(cycle.id, "color", e.target.value)}
                    style={{ width: "40px", height: "40px", padding: 0, border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer" }}
                    title="Cor do ciclo"
                  />
                  <button onClick={() => removeCycle(cycle.id)} style={{ padding: "0.4rem 0.6rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "6px", color: "var(--egbe-red)", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#888" }}>Primeiro dia</label>
                    <input className="input-field" type="date" value={cycle.startDate || ""} onChange={(e) => updateCycle(cycle.id, "startDate", e.target.value)} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#888" }}>A cada (dias)</label>
                    <input className="input-field" type="number" min="1" max="365" value={cycle.cycleDays || ""} onChange={(e) => updateCycle(cycle.id, "cycleDays", parseInt(e.target.value) || 0)} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }} />
                  </div>
                </div>

                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#666", marginBottom: "0.4rem", display: "block" }}>Òrìṣà do ciclo</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.35rem" }}>
                  {orixas.map(({ name, color }) => {
                    const active = (cycle.orixas || []).includes(name);
                    return (
                      <label key={name} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.5rem", background: active ? color + "15" : "white", border: `1px solid ${active ? color : "#e5e7eb"}`, borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem" }}>
                        <span style={{ width: "14px", height: "14px", borderRadius: "50%", border: `2px solid ${color}`, background: active ? color : "white", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {active && <span style={{ color: "white", fontSize: "0.55rem", fontWeight: 700 }}>✓</span>}
                        </span>
                        <input type="checkbox" checked={active} onChange={() => toggleOrixaInCycle(cycle.id, name)} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                        <span style={{ color: active ? color : "#444", fontWeight: active ? 600 : 500 }}>{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Gerar Calendário (visualização + resets + edição por dia) */}
      {tab === "period" && (
        <div>
          <div className="card" style={{ marginBottom: "1rem", padding: "0.85rem 1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#666", marginRight: "0.25rem" }}>Resetar:</span>
              <button onClick={resetDay} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>Dia selecionado</button>
              <button onClick={resetMonth} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>{MONTHS[curMonth]} inteiro</button>
              <button onClick={resetYear} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>Ano {curYear}</button>
              <span style={{ color: "#ccc", margin: "0 0.25rem" }}>|</span>
              <input type="date" value={resetStart} onChange={(e) => setResetStart(e.target.value)} className="input-field" style={{ padding: "0.35rem 0.5rem", width: "160px", fontSize: "0.8rem" }} />
              <span style={{ fontSize: "0.8rem", color: "#888" }}>até</span>
              <input type="date" value={resetEnd} onChange={(e) => setResetEnd(e.target.value)} className="input-field" style={{ padding: "0.35rem 0.5rem", width: "160px", fontSize: "0.8rem" }} />
              <button onClick={resetPeriod} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>Período</button>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.5rem" }}>Reset apaga customizações no(s) dia(s).</p>
          </div>

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
                const mainColor = orixas[0] ? ORIXA_COLOR[orixas[0]] : "#ccc";
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
          </div>

          {selDay && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{selDay} de {MONTHS[curMonth]} de {curYear}</h3>
                <div style={{ fontSize: "0.8rem", color: "#888" }}>
                  {selectedIsOverride ? "Customizado" : "Sem customização"} {saving && <span style={{ color: "var(--egbe-green)" }}>· Salvando...</span>}
                </div>
              </div>

              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#666", marginBottom: "0.5rem", display: "block" }}>
                Òrìṣà que regem este dia
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.5rem" }}>
                {orixas.map(({ name, color }) => {
                  const active = selectedOrixas.includes(name);
                  return (
                    <label key={name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: active ? color + "15" : "white", border: `1.5px solid ${active ? color : "#e5e7eb"}`, borderRadius: "8px", cursor: "pointer" }}>
                      <span style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${color}`, background: active ? color : "white", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {active && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 700 }}>✓</span>}
                      </span>
                      <input type="checkbox" checked={active} onChange={() => {
                        const next = active ? selectedOrixas.filter((o) => o !== name) : [...selectedOrixas, name];
                        setOrixasForDay(curYear, curMonth, selDay, next);
                      }} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                      <span style={{ fontSize: "0.85rem", color: active ? color : "#444", fontWeight: active ? 600 : 500 }}>{name}</span>
                    </label>
                  );
                })}
              </div>
              {selectedIsOverride && (
                <button onClick={resetDay} className="btn btn-secondary" style={{ marginTop: "1rem", fontSize: "0.82rem", padding: "0.4rem 0.9rem" }}>
                  Remover customização deste dia
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
