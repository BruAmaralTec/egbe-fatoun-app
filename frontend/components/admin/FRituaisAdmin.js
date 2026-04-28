// ========================================
// components/admin/FRituaisAdmin.js
// [F = Frontend Component]
// Gestão de Rituais — tracker de Consultas e Obrigações
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useModal } from "@/lib/LModalContext";
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import FRichTextEditor from "@/components/FRichTextEditor";
import FOduInput from "@/components/FOduInput";
import { DEFAULT_ORIXAS } from "@/lib/LOse";

// Templates de Obrigação — materiais e preparo pré-definidos
const RITUAIS = {
  "bori-normal": {
    nome: "Bori Normal", cor: "#D4A017",
    compra: [
      { nome: "Inhame branco", qtd: "1" },
      { nome: "Mel puro", qtd: "250ml" },
      { nome: "Azeite de dendê", qtd: "100ml" },
      { nome: "Obí", qtd: "4 gomos" },
      { nome: "Orobô", qtd: "1" },
      { nome: "Pemba branca", qtd: "1" },
      { nome: "Efun", qtd: "1 pacote" },
      { nome: "Fio branco", qtd: "1m" },
      { nome: "Pano branco", qtd: "50x50cm" },
    ],
    preparo: ["Cozinhar inhame no leite de coco", "Preparar o obi para divisão", "Limpar e consagrar o ori", "Invocar Egúngún e ancestrais", "Montar altar de Ori com inhame e mel", "Defumar o espaço", "Rezar Oríkì de Ori", "Fechar com efun e pemba"],
  },
  "bori-funfun": {
    nome: "Bori Funfun", cor: "#1B6B3A",
    compra: [
      { nome: "Inhame branco", qtd: "2" },
      { nome: "Leite de coco", qtd: "200ml" },
      { nome: "Efun", qtd: "2 pacotes" },
      { nome: "Obí", qtd: "8 gomos" },
      { nome: "Orobô", qtd: "2" },
      { nome: "Flores brancas", qtd: "1 buquê" },
      { nome: "Manteiga de karité", qtd: "50g" },
      { nome: "Pano branco", qtd: "1m x 1m" },
      { nome: "Osun pó branco", qtd: "1" },
      { nome: "Iyefá", qtd: "1 pitada" },
    ],
    preparo: ["Preparar banho de efun e flores brancas", "Cozinhar inhame somente em água e sal", "Preparar Ori com manteiga de karité", "Vestir consulente de branco", "Montar altar de Obàtálá", "Rezar Oríkì de Obàtálá e Ori", "Lavar cabeça com mistura sagrada", "Selar com efun e inhame branco"],
  },
  "feitura-osun": {
    nome: "Feitura Ọ́ṣun", cor: "#B22222",
    compra: [
      { nome: "Mel puro", qtd: "500ml" },
      { nome: "Canela em pó", qtd: "50g" },
      { nome: "Cravo da Índia", qtd: "1 pacote" },
      { nome: "Obí", qtd: "8 gomos" },
      { nome: "Orobô", qtd: "2" },
      { nome: "Efun", qtd: "1 pacote" },
      { nome: "Osun pó vermelho", qtd: "1 pacote" },
      { nome: "Tecido amarelo", qtd: "2m" },
      { nome: "Contas amarelas", qtd: "1 fio" },
      { nome: "Igba (metade da cabaça)", qtd: "1" },
      { nome: "Dendê", qtd: "100ml" },
      { nome: "Espelho", qtd: "1 pequeno" },
    ],
    preparo: ["Preparar ewé de Ọ́ṣun", "Lavar e consagrar Igba com mel", "Preparar pemba amarela", "Montar altar de Ọ́ṣun com espelho", "Banho de descarrego", "Consagrar joias e contas", "Rezar Odù do consulente", "Fechar com iyefá"],
  },
  "ebo-exu": {
    nome: "Ebó Exu", cor: "#1a1a1a",
    compra: [
      { nome: "Farofa de dendê", qtd: "300g" },
      { nome: "Cachaça 51", qtd: "500ml" },
      { nome: "Charuto", qtd: "3" },
      { nome: "Carvão vegetal", qtd: "1 pacote" },
      { nome: "Mel", qtd: "100ml" },
      { nome: "Pimentas dedo-de-moça", qtd: "7" },
      { nome: "Moeda de 1 real", qtd: "7" },
      { nome: "Obí", qtd: "4 gomos" },
      { nome: "Fumo de corda", qtd: "1 pedaço" },
    ],
    preparo: ["Escolher encruzilhada às 0h ou 6h", "Preparar farofa com dendê e pimenta", "Dispor os 7 pratos", "Acender o charuto para Exu", "Derramar cachaça no sentido horário", "Rezar Oríkì de Exu e Legbá", "Jogar obi para confirmar", "Recolher sem olhar para trás"],
  },
  "ebo-cliente": {
    nome: "Ebó Cliente", cor: "#1a4080",
    compra: [
      { nome: "*Consultar Odù antes de comprar*", qtd: "—" },
      { nome: "Obí (sempre)", qtd: "4 gomos" },
      { nome: "Orobô (sempre)", qtd: "1" },
      { nome: "Mel (sempre)", qtd: "100ml" },
      { nome: "Sal grosso", qtd: "1 pacote" },
      { nome: "Pano branco", qtd: "50cm" },
      { nome: "[Materiais específicos do Odù]", qtd: "—" },
    ],
    preparo: ["Consultar Ifá para identificar Odù", "Confirmar materiais pelo Odù revelado", "Escolher local conforme prescrição", "Preparar consulente com banho prévio", "Montar o ebó conforme Ifá", "Rezar Ìtàn do Odù", "Confirmar aceitação pelo obi", "Orientar sobre tabus pós-ebó"],
  },
};

const EMPTY_EBO_ITEM = {
  template: "",
  materiaisCheck: {},
  materiaisQtd: {},      // legado (string livre) — mantido pra retrocompat
  materiaisUnidades: {}, // novo: número de unidades por material
  materiaisVolume: {},   // novo: volume/medida em texto (ex: "250ml", "1L")
  materiaisPreparo: {},  // novo: preparo inline por material
  preparoCheck: {},      // legado: checklist procedural (não usado mais na UI do ebó)
  animais: [],           // [{ orixa, qtd, animal, sexo }]
};

// Parse o qtd default do template em unidades + volume.
// "1" → { unidades: 1, volume: "" }
// "250ml" → { unidades: 1, volume: "250ml" }
// "4 gomos" → { unidades: 4, volume: "gomos" }
function parseTemplateQtd(qtd) {
  if (qtd === undefined || qtd === null) return { unidades: 1, volume: "" };
  const s = String(qtd).trim();
  if (!s) return { unidades: 1, volume: "" };
  if (/^\d+$/.test(s)) return { unidades: parseInt(s, 10), volume: "" };
  const m = s.match(/^(\d+)\s+(.+)$/);
  if (m) return { unidades: parseInt(m[1], 10), volume: m[2] };
  return { unidades: 1, volume: s };
}

const EMPTY_CONSULTA = {
  type: "consulta",
  userId: "",
  date: new Date().toISOString().split("T")[0],
  perguntas: [""],
  objetivo: "",
  oduPrincipal: { leftMarks: ["I","I","I","I"], rightMarks: ["I","I","I","I"] },
  odusAuxiliares: [],
  orientacoes: "",
  eboPrescrito: null, // null = não respondido, true/false = Sim/Não
  eboObs: "",
  ebos: [],
  tabus: "",
  preceitoDias: 0,
  preceitoStartDate: "",
  notes: "",
};

// Migra rituais antigos (eboTemplate único + eboExtras) pro novo formato (ebos: [...] + eboObs)
function migrateEbo(data) {
  if (!data || data.type !== "consulta") return data;
  // Já no formato novo: nada a fazer
  if (Array.isArray(data.ebos) || typeof data.eboPrescrito === "boolean") {
    return {
      ...data,
      ebos: Array.isArray(data.ebos) ? data.ebos : [],
      eboObs: data.eboObs || data.eboExtras || "",
      eboPrescrito: typeof data.eboPrescrito === "boolean" ? data.eboPrescrito : (data.ebos?.length > 0),
    };
  }
  // Formato antigo: tem eboTemplate string
  const hasLegacy = !!data.eboTemplate;
  return {
    ...data,
    eboPrescrito: hasLegacy,
    eboObs: data.eboExtras || "",
    ebos: hasLegacy ? [{
      template: data.eboTemplate,
      materiaisCheck: data.eboMateriaisCheck || {},
      materiaisQtd: data.eboMateriaisQtd || {},
      preparoCheck: data.eboPreparoCheck || {},
    }] : [],
  };
}

const EMPTY_OBRIGACAO = {
  type: "obrigacao",
  userId: "",
  date: new Date().toISOString().split("T")[0],
  ritualTemplate: "bori-normal",
  materiaisCheck: {},
  materiaisQtd: {},      // legado (string livre)
  materiaisUnidades: {}, // novo: número de unidades
  materiaisVolume: {},   // novo: volume/medida
  materiaisPreparo: {},  // novo: preparo inline por material
  preparoCheck: {},      // checklist procedural do template
  preparoExtras: "",     // notas adicionais de preparo (free text)
  animais: [],           // [{ orixa, qtd, animal, sexo }]
  extras: "",            // legado — será migrado pra preparoExtras
  notes: "",
};

// Migra obrigações antigas pro novo formato (com animais e novos campos de material)
function migrateObrigacao(data) {
  if (!data || data.type !== "obrigacao") return data;
  return {
    ...data,
    materiaisCheck: data.materiaisCheck || {},
    materiaisQtd: data.materiaisQtd || {},
    materiaisUnidades: data.materiaisUnidades || {},
    materiaisVolume: data.materiaisVolume || {},
    materiaisPreparo: data.materiaisPreparo || {},
    preparoCheck: data.preparoCheck || {},
    preparoExtras: data.preparoExtras || data.extras || "",
    animais: Array.isArray(data.animais) ? data.animais : [],
  };
}

function preceitoEndDate(startDate, days) {
  if (!startDate || !days) return null;
  const d = new Date(startDate + "T00:00:00");
  d.setDate(d.getDate() + Number(days));
  return d;
}

function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

export default function FRituaisAdmin() {
  const { isAdmin, isConselho } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [orixas, setOrixas] = useState(DEFAULT_ORIXAS);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | new | detail
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_CONSULTA });
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isConselho) return;
    async function load() {
      const [eventsSnap, usersSnap, oxSnap] = await Promise.all([
        getDocs(collection(db, "rituals")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "users")).catch(() => ({ docs: [] })),
        getDoc(doc(db, "settings", "oseOrixas")).catch(() => null),
      ]);
      const evts = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      evts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setEvents(evts);
      const usrs = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      usrs.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "pt-BR"));
      setUsers(usrs);
      if (oxSnap?.exists() && oxSnap.data().list) setOrixas(oxSnap.data().list);
      setLoading(false);
    }
    load();
  }, [isConselho]);

  if (!isConselho) return <p>Acesso restrito ao Conselho e Administradores.</p>;

  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  function startNew(type) {
    setForm({ ...(type === "obrigacao" ? EMPTY_OBRIGACAO : EMPTY_CONSULTA) });
    setSelectedId(null);
    setView("new");
  }

  function openDetail(ev) {
    const migrated = ev.type === "obrigacao" ? migrateObrigacao({ ...ev }) : migrateEbo({ ...ev });
    setForm(migrated);
    setSelectedId(ev.id);
    setView("detail");
  }

  async function handleSave() {
    if (!form.userId) return showAlert("Escolha o usuário do ritual.");
    if (!form.date) return showAlert("Informe a data.");
    setSaving(true);
    try {
      if (selectedId) {
        const { id, ...payload } = form;
        await updateDoc(doc(db, "rituals", selectedId), payload);
        setEvents((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...payload } : e)));
      } else {
        const payload = { ...form, createdAt: new Date() };
        const ref = await addDoc(collection(db, "rituals"), payload);
        setEvents((prev) => [{ id: ref.id, ...payload }, ...prev]);
        setSelectedId(ref.id);
      }
      setView("list");
    } catch (err) {
      await showAlert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!(await showConfirm("Remover este ritual?"))) return;
    await deleteDoc(doc(db, "rituals", id));
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setView("list");
  }

  const filtered = events.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (search) {
      const u = userById[e.userId];
      const haystack = [u?.displayName, u?.oruko, u?.email, e.notes, e.objetivo].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  if (view === "new" || view === "detail") {
    return <RitualForm
      form={form}
      setForm={setForm}
      users={users}
      orixas={orixas}
      saving={saving}
      isEditing={!!selectedId}
      isAdmin={isAdmin}
      onCancel={() => setView("list")}
      onSave={handleSave}
      onDelete={selectedId ? () => handleDelete(selectedId) : null}
    />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gestão de Rituais</h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            {events.length} rituais registrados
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => startNew("consulta")}>+ Nova Consulta</button>
          <button className="btn btn-secondary" onClick={() => startNew("obrigacao")}>+ Nova Obrigação</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[
          { id: "all", label: "Todos" },
          { id: "consulta", label: "Consultas" },
          { id: "obrigacao", label: "Obrigações" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`btn ${filterType === f.id ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "0.82rem", padding: "0.35rem 0.9rem" }}
          >
            {f.label}
          </button>
        ))}
        <input className="input-field" placeholder="Buscar por usuário, Orúkọ, objetivo..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: "240px", fontSize: "0.85rem" }} />
      </div>

      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
            Nenhum ritual registrado{filterType !== "all" ? ` como ${filterType === "consulta" ? "consulta" : "obrigação"}` : ""}.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {filtered.map((ev) => {
              const user = userById[ev.userId];
              const preceitoEnd = ev.type === "consulta" ? preceitoEndDate(ev.preceitoStartDate, ev.preceitoDias) : null;
              const daysLeft = preceitoEnd ? daysUntil(preceitoEnd) : null;
              return (
                <button
                  key={ev.id}
                  onClick={() => openDetail(ev)}
                  className="card"
                  style={{ textAlign: "left", cursor: "pointer", border: "1px solid #e5e7eb", background: "white", padding: "1rem", borderLeft: `4px solid ${ev.type === "consulta" ? "#6366f1" : "#D4A017"}` }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: ev.type === "consulta" ? "#6366f1" : "#D4A017" }}>
                      {ev.type === "consulta" ? "Consulta" : "Obrigação"}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#888" }}>{ev.date}</span>
                  </div>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.15rem" }}>{user?.displayName || "—"}</p>
                  {user?.oruko && <p style={{ fontSize: "0.78rem", color: "var(--egbe-green-dark)", fontStyle: "italic", marginBottom: "0.4rem" }}>Orúkọ: {user.oruko}</p>}
                  {ev.type === "consulta" && ev.objetivo && <p style={{ fontSize: "0.82rem", color: "#555", marginBottom: "0.3rem" }}>🎯 {ev.objetivo.length > 80 ? ev.objetivo.slice(0, 80) + "…" : ev.objetivo}</p>}
                  {ev.type === "obrigacao" && ev.ritualTemplate && <p style={{ fontSize: "0.82rem", color: "#555" }}>🕯️ {RITUAIS[ev.ritualTemplate]?.nome || ev.ritualTemplate}</p>}
                  {daysLeft !== null && daysLeft >= 0 && (
                    <p style={{ fontSize: "0.78rem", color: daysLeft <= 3 ? "var(--egbe-red)" : "#888", marginTop: "0.5rem" }}>
                      Preceito: {daysLeft === 0 ? "termina hoje" : `${daysLeft} dia(s) restantes`}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ========================================
// Tab nav reutilizável (Materiais / Animais / Preparos)
// ========================================
const TABS = [
  { id: "materiais", label: "🛒 Materiais" },
  { id: "animais", label: "🐦 Animais" },
  { id: "preparos", label: "🔥 Preparos" },
];

function RitualTabNav({ active, onChange, color }) {
  const accent = color || "var(--egbe-green)";
  const accentDark = color || "var(--egbe-green-dark)";
  return (
    <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid #e5e7eb", marginBottom: "0.85rem" }}>
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              padding: "0.45rem 0.85rem",
              background: "none",
              border: "none",
              borderBottom: isActive ? `2px solid ${accent}` : "2px solid transparent",
              color: isActive ? accentDark : "#666",
              fontWeight: isActive ? 700 : 500,
              cursor: "pointer",
              marginBottom: "-1px",
              fontFamily: "inherit",
              fontSize: "0.85rem",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// Renderiza a aba de Materiais (5 colunas)
function MateriaisTab({ tpl, data, onUpdate }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "20px 1.6fr 70px 90px 1.4fr", gap: "0.4rem", padding: "0 0.25rem 0.3rem 0.25rem", fontSize: "0.7rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e5e7eb" }}>
        <span></span>
        <span>Material</span>
        <span style={{ textAlign: "center" }}>Qtd</span>
        <span style={{ textAlign: "center" }}>Volume</span>
        <span>Preparo</span>
      </div>
      {tpl.compra.map((item, i) => {
        const checked = !!data.materiaisCheck?.[i];
        const def = parseTemplateQtd(item.qtd);
        const unidades = data.materiaisUnidades?.[i] !== undefined ? data.materiaisUnidades[i] : def.unidades;
        const volume = data.materiaisVolume?.[i] !== undefined
          ? data.materiaisVolume[i]
          : (data.materiaisQtd?.[i] !== undefined ? data.materiaisQtd[i] : def.volume);
        const preparoTxt = data.materiaisPreparo?.[i] || "";
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 1.6fr 70px 90px 1.4fr", gap: "0.4rem", alignItems: "center", padding: "0.35rem 0.25rem", borderBottom: "1px solid #f3f4f6" }}>
            <input type="checkbox" checked={checked} onChange={() => onUpdate({ ...data, materiaisCheck: { ...data.materiaisCheck, [i]: !checked } })} style={{ accentColor: tpl.cor }} />
            <span style={{ fontSize: "0.86rem", textDecoration: checked ? "line-through" : "none", color: checked ? "#888" : "#1a1a1a" }}>{item.nome}</span>
            <input
              type="number" min="0" value={unidades}
              onChange={(e) => onUpdate({ ...data, materiaisUnidades: { ...data.materiaisUnidades, [i]: e.target.value === "" ? "" : parseInt(e.target.value, 10) } })}
              style={{ width: "100%", padding: "0.22rem 0.3rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.78rem", textAlign: "center" }}
            />
            <input
              type="text" value={volume}
              onChange={(e) => onUpdate({ ...data, materiaisVolume: { ...data.materiaisVolume, [i]: e.target.value } })}
              placeholder="ml/L"
              style={{ width: "100%", padding: "0.22rem 0.3rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.78rem", textAlign: "center" }}
            />
            <input
              type="text" value={preparoTxt}
              onChange={(e) => onUpdate({ ...data, materiaisPreparo: { ...data.materiaisPreparo, [i]: e.target.value } })}
              placeholder="Notas de preparo deste material..."
              style={{ width: "100%", padding: "0.22rem 0.4rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.78rem" }}
            />
          </div>
        );
      })}
    </>
  );
}

// Renderiza a aba de Animais
function AnimaisTab({ data, onUpdate, orixas, color }) {
  const animais = data.animais || [];
  function addAnimal() {
    onUpdate({ ...data, animais: [...animais, { orixa: "", qtd: 1, animal: "", sexo: "macho" }] });
  }
  function updateAnimal(idx, next) {
    const list = [...animais]; list[idx] = next;
    onUpdate({ ...data, animais: list });
  }
  function removeAnimal(idx) {
    onUpdate({ ...data, animais: animais.filter((_, i) => i !== idx) });
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
        <button type="button" onClick={addAnimal} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.25rem 0.65rem" }}>
          + Adicionar animal
        </button>
      </div>
      {animais.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 60px 1.4fr 110px 30px", gap: "0.4rem", padding: "0 0.25rem 0.3rem 0.25rem", fontSize: "0.7rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e5e7eb" }}>
          <span>Òrìṣà</span>
          <span style={{ textAlign: "center" }}>Qtd</span>
          <span>Animal</span>
          <span>Sexo</span>
          <span></span>
        </div>
      )}
      {animais.map((a, ai) => (
        <div key={ai} style={{ display: "grid", gridTemplateColumns: "1.4fr 60px 1.4fr 110px 30px", gap: "0.4rem", alignItems: "center", padding: "0.35rem 0.25rem", borderBottom: "1px solid #f3f4f6" }}>
          <select value={a.orixa || ""} onChange={(e) => updateAnimal(ai, { ...a, orixa: e.target.value })} style={{ width: "100%", padding: "0.22rem 0.3rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.78rem", background: "white" }}>
            <option value="">—</option>
            {orixas.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
          </select>
          <input type="number" min="1" value={a.qtd || 1} onChange={(e) => updateAnimal(ai, { ...a, qtd: e.target.value === "" ? "" : parseInt(e.target.value, 10) })} style={{ width: "100%", padding: "0.22rem 0.3rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.78rem", textAlign: "center" }} />
          <input type="text" value={a.animal || ""} onChange={(e) => updateAnimal(ai, { ...a, animal: e.target.value })} placeholder="Ex: galo, pomba, cabra..." style={{ width: "100%", padding: "0.22rem 0.4rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.78rem" }} />
          <select value={a.sexo || "macho"} onChange={(e) => updateAnimal(ai, { ...a, sexo: e.target.value })} style={{ width: "100%", padding: "0.22rem 0.3rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.78rem", background: "white" }}>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
          </select>
          <button type="button" onClick={() => removeAnimal(ai)} style={{ background: "none", border: "1.5px solid #fecaca", borderRadius: "5px", color: "var(--egbe-red)", cursor: "pointer", padding: "0.2rem 0.3rem", fontSize: "0.72rem" }} title="Remover">✕</button>
        </div>
      ))}
      {animais.length === 0 && (
        <p style={{ fontSize: "0.78rem", color: "#aaa", fontStyle: "italic", padding: "0.4rem 0.25rem" }}>
          Nenhum animal adicionado.
        </p>
      )}
    </div>
  );
}

// Renderiza a aba de Preparos (checklist procedural + notas livres)
function PreparosTab({ tpl, data, onUpdate }) {
  return (
    <div>
      <h4 style={{ fontSize: "0.92rem", marginBottom: "0.5rem", color: tpl.cor }}>Passos do ritual</h4>
      {tpl.preparo.map((step, i) => (
        <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}>
          <input type="checkbox" checked={!!data.preparoCheck?.[i]} onChange={() => onUpdate({ ...data, preparoCheck: { ...data.preparoCheck, [i]: !data.preparoCheck?.[i] } })} style={{ accentColor: tpl.cor }} />
          <span style={{ fontSize: "0.86rem", textDecoration: data.preparoCheck?.[i] ? "line-through" : "none", color: data.preparoCheck?.[i] ? "#888" : "#1a1a1a" }}>{step}</span>
        </label>
      ))}
      <div style={{ marginTop: "0.85rem" }}>
        <label className="label">Notas adicionais de preparo</label>
        <textarea
          className="input-field"
          rows={3}
          value={data.preparoExtras || ""}
          onChange={(e) => onUpdate({ ...data, preparoExtras: e.target.value })}
          placeholder="Observações específicas de preparo deste ritual..."
          style={{ resize: "vertical" }}
        />
      </div>
    </div>
  );
}

// ========================================
// Form de criação / edição
// ========================================
function RitualForm({ form, setForm, users, orixas, saving, isEditing, isAdmin, onCancel, onSave, onDelete }) {
  const isConsulta = form.type === "consulta";
  const template = !isConsulta ? RITUAIS[form.ritualTemplate] : null;
  const [userSearch, setUserSearch] = useState("");
  // Aba ativa por ebó (idx → "materiais"|"animais"|"preparos") + aba da obrigação
  const [eboTabs, setEboTabs] = useState({});
  const [obrigacaoTab, setObrigacaoTab] = useState("materiais");
  function getEboTab(idx) { return eboTabs[idx] || "materiais"; }
  function setEboTab(idx, tab) { setEboTabs((prev) => ({ ...prev, [idx]: tab })); }

  const sortedUsers = [...users].sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "pt-BR"));
  const selectedUser = users.find((u) => u.id === form.userId);
  const userCandidates = userSearch
    ? sortedUsers.filter((u) =>
        u.id !== form.userId &&
        (u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
         u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
         u.oruko?.toLowerCase().includes(userSearch.toLowerCase()))
      ).slice(0, 8)
    : [];

  const preceitoEnd = isConsulta ? preceitoEndDate(form.preceitoStartDate, form.preceitoDias) : null;
  const daysLeft = preceitoEnd ? daysUntil(preceitoEnd) : null;

  function updatePerg(i, val) {
    const next = [...(form.perguntas || [])]; next[i] = val;
    setForm({ ...form, perguntas: next });
  }
  function addPerg() { setForm({ ...form, perguntas: [...(form.perguntas || []), ""] }); }
  function removePerg(i) { setForm({ ...form, perguntas: (form.perguntas || []).filter((_, idx) => idx !== i) }); }

  function addAux() {
    setForm({ ...form, odusAuxiliares: [...(form.odusAuxiliares || []), { leftMarks: ["I","I","I","I"], rightMarks: ["I","I","I","I"] }] });
  }
  function updateAux(i, next) {
    const list = [...(form.odusAuxiliares || [])]; list[i] = next;
    setForm({ ...form, odusAuxiliares: list });
  }
  function removeAux(i) {
    setForm({ ...form, odusAuxiliares: (form.odusAuxiliares || []).filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      <button className="btn btn-secondary" onClick={onCancel} style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>← Voltar</button>

      <h1 style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>
        {isEditing ? "Editar" : "Novo"} {isConsulta ? "Consulta" : "Obrigação"}
      </h1>
      <p style={{ color: "#666", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        {isConsulta ? "Registro de consulta com Odú e orientações" : "Execução de obrigação com materiais e preparo"}
      </p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <div>
            <label className="label">Tipo</label>
            <select className="input-field" value={form.type} onChange={(e) => setForm({
              ...(e.target.value === "consulta" ? EMPTY_CONSULTA : EMPTY_OBRIGACAO),
              userId: form.userId,
              date: form.date,
              notes: form.notes,
            })} disabled={isEditing}>
              <option value="consulta">Consulta</option>
              <option value="obrigacao">Obrigação</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Usuário</label>
            {selectedUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "#f0fdf4", border: "1.5px solid var(--egbe-green)", borderRadius: "8px" }}>
                <span style={{ flex: 1, fontSize: "0.9rem" }}>
                  <strong>{selectedUser.displayName || "—"}</strong>
                  {selectedUser.oruko && <span style={{ color: "var(--egbe-green-dark)", fontStyle: "italic" }}> · {selectedUser.oruko}</span>}
                  {selectedUser.email && <span style={{ color: "#888" }}> ({selectedUser.email})</span>}
                </span>
                <button onClick={() => { setForm({ ...form, userId: "" }); setUserSearch(""); }} style={{ background: "none", border: "none", color: "var(--egbe-red)", cursor: "pointer", fontSize: "1rem", padding: "0 0.25rem" }}>×</button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input
                  className="input-field"
                  placeholder="Buscar por nome, Orúkọ ou email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ fontSize: "0.88rem" }}
                />
                {(userSearch || !form.userId) && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", marginTop: "2px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 10, maxHeight: "260px", overflowY: "auto" }}>
                    <a
                      href="/dashboard/membros"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: "var(--egbe-green)", fontWeight: 600, borderBottom: "1px solid #e5e7eb", textDecoration: "none" }}
                    >
                      + Novo usuário ↗
                    </a>
                    {(userSearch ? userCandidates : sortedUsers.slice(0, 10)).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setForm({ ...form, userId: u.id }); setUserSearch(""); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", borderBottom: "1px solid #f3f4f6", fontFamily: "inherit" }}
                      >
                        <strong>{u.displayName || "—"}</strong>
                        {u.oruko && <span style={{ color: "var(--egbe-green-dark)", fontStyle: "italic" }}> · {u.oruko}</span>}
                        <span style={{ color: "#888" }}> · {u.email}</span>
                      </button>
                    ))}
                    {userSearch && userCandidates.length === 0 && (
                      <p style={{ padding: "0.6rem 0.75rem", fontSize: "0.82rem", color: "#aaa" }}>Nenhum usuário encontrado.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="label">Data</label>
            <input className="input-field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>
      </div>

      {isConsulta ? (
        <>
          {/* Objetivo & perguntas */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Objetivo e perguntas do consulente</h3>
            <div style={{ marginBottom: "0.75rem" }}>
              <label className="label">Objetivo da consulta</label>
              <textarea className="input-field" rows={2} value={form.objetivo || ""} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} placeholder="Ex: saúde, caminho profissional, proteção..." style={{ resize: "vertical" }} />
            </div>
            <label className="label">Perguntas para o jogo</label>
            {(form.perguntas || []).map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <input className="input-field" value={p} onChange={(e) => updatePerg(i, e.target.value)} placeholder={`Pergunta ${i + 1}`} style={{ flex: 1 }} />
                <button onClick={() => removePerg(i)} style={{ padding: "0 0.75rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "6px", color: "var(--egbe-red)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <button onClick={addPerg} className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "0.35rem 0.8rem" }}>+ Adicionar pergunta</button>
          </div>

          {/* Odú */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Odú do jogo</h3>
            <FOduInput
              label="Odú Principal"
              value={form.oduPrincipal}
              onChange={(next) => setForm({ ...form, oduPrincipal: next })}
            />
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#666", fontWeight: 600 }}>Odús auxiliares</span>
                <button onClick={addAux} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.7rem" }}>+ Adicionar auxiliar</button>
              </div>
              {(form.odusAuxiliares || []).map((aux, i) => (
                <div key={i} style={{ padding: "0.75rem", background: "#f9fafb", borderRadius: "8px", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "#888", fontWeight: 600 }}>Auxiliar #{i + 1}</span>
                    <button onClick={() => removeAux(i)} style={{ background: "none", border: "1.5px solid #fecaca", borderRadius: "6px", color: "var(--egbe-red)", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}>✕ Remover</button>
                  </div>
                  <FOduInput value={aux} onChange={(next) => updateAux(i, next)} compact />
                </div>
              ))}
            </div>
          </div>

          {/* Orientações */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Orientações do Jogo</h3>
            <FRichTextEditor value={form.orientacoes || ""} onChange={(html) => setForm({ ...form, orientacoes: html })} placeholder="Resumo das orientações que saíram..." minHeight="140px" />
          </div>

          {/* Ebó a ser realizado */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>🕯️ Ebó a ser realizado</h3>

            {/* Sim/Não */}
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem", fontWeight: 600 }}>Será realizado ebó?</p>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: form.eboPrescrito ? "1rem" : 0 }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, eboPrescrito: true })}
                className={`btn ${form.eboPrescrito === true ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.85rem", padding: "0.4rem 1.25rem" }}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, eboPrescrito: false, ebos: [], eboObs: "" })}
                className={`btn ${form.eboPrescrito === false ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.85rem", padding: "0.4rem 1.25rem" }}
              >
                Não
              </button>
            </div>

            {form.eboPrescrito === true && (
              <>
                {/* Observações livres */}
                <div style={{ marginBottom: "1rem" }}>
                  <label className="label">Observações sobre o(s) ebó(s)</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={form.eboObs || ""}
                    onChange={(e) => setForm({ ...form, eboObs: e.target.value })}
                    placeholder="Detalhes específicos, materiais extras prescritos, observações do jogo..."
                    style={{ resize: "vertical" }}
                  />
                </div>

                {/* Lista de ebós */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#666", fontWeight: 600 }}>
                    Ebós prescritos ({(form.ebos || []).length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, ebos: [...(form.ebos || []), { ...EMPTY_EBO_ITEM }] })}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.8rem", padding: "0.3rem 0.7rem" }}
                  >
                    + Adicionar ebó
                  </button>
                </div>

                {(form.ebos || []).length === 0 && (
                  <p style={{ fontSize: "0.82rem", color: "#aaa", fontStyle: "italic", padding: "0.5rem 0" }}>
                    Nenhum ebó adicionado. Clique em "+ Adicionar ebó" para escolher um template.
                  </p>
                )}

                {(form.ebos || []).map((ebo, idx) => {
                  const tpl = RITUAIS[ebo.template];
                  function updateThis(next) {
                    const list = [...(form.ebos || [])]; list[idx] = next;
                    setForm({ ...form, ebos: list });
                  }
                  function removeThis() {
                    setForm({ ...form, ebos: (form.ebos || []).filter((_, i) => i !== idx) });
                  }
                  return (
                    <div key={idx} style={{ padding: "0.9rem", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb", marginBottom: "0.75rem", borderLeft: `4px solid ${tpl?.cor || "#9ca3af"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#888", fontWeight: 600 }}>Ebó #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={removeThis}
                          style={{ background: "none", border: "1.5px solid #fecaca", borderRadius: "6px", color: "var(--egbe-red)", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: "0.78rem" }}
                        >
                          ✕ Remover
                        </button>
                      </div>

                      <select
                        className="input-field"
                        value={ebo.template || ""}
                        onChange={(e) => updateThis({ ...EMPTY_EBO_ITEM, template: e.target.value })}
                        style={{ marginBottom: tpl ? "0.75rem" : 0 }}
                      >
                        <option value="">Selecione um template...</option>
                        {Object.entries(RITUAIS).map(([key, r]) => <option key={key} value={key}>{r.nome}</option>)}
                      </select>

                      {tpl && (
                        <>
                          <RitualTabNav active={getEboTab(idx)} onChange={(t) => setEboTab(idx, t)} color={tpl.cor} />
                          {getEboTab(idx) === "materiais" && (
                            <MateriaisTab tpl={tpl} data={ebo} onUpdate={updateThis} />
                          )}
                          {getEboTab(idx) === "animais" && (
                            <AnimaisTab data={ebo} onUpdate={updateThis} orixas={orixas} color={tpl.cor} />
                          )}
                          {getEboTab(idx) === "preparos" && (
                            <PreparosTab tpl={tpl} data={ebo} onUpdate={updateThis} />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Proibições / Tabus */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Proibições / Tabus</h3>
            <FRichTextEditor value={form.tabus || ""} onChange={(html) => setForm({ ...form, tabus: html })} placeholder="Tabus alimentares, comportamentais, etc..." minHeight="100px" />
          </div>

          {/* Preceito */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Preceito</h3>
            <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "0.75rem" }}>
              Período de resguardo pós-consulta. O sistema indica quando o preceito termina.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="label">Dias de preceito</label>
                <input className="input-field" type="number" min="0" value={form.preceitoDias || 0} onChange={(e) => setForm({ ...form, preceitoDias: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="label">Data de início</label>
                <input className="input-field" type="date" value={form.preceitoStartDate || ""} onChange={(e) => setForm({ ...form, preceitoStartDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Data final (auto)</label>
                <input
                  className="input-field"
                  type="date"
                  value={preceitoEnd ? preceitoEnd.toISOString().split("T")[0] : ""}
                  disabled
                  style={{ background: "#f3f4f6", cursor: "not-allowed", color: "#1a1a1a" }}
                />
              </div>
            </div>
            {preceitoEnd && (
              <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: daysLeft !== null && daysLeft <= 0 ? "var(--egbe-green-dark)" : "var(--egbe-green)" }}>
                Termina em {preceitoEnd.toLocaleDateString("pt-BR")}
                {daysLeft !== null && (daysLeft > 0 ? ` (${daysLeft} dia${daysLeft === 1 ? "" : "s"} restante${daysLeft === 1 ? "" : "s"})` : daysLeft === 0 ? " — termina hoje" : " — preceito concluído")}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Obrigação — escolha do template */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <label className="label">Tipo de obrigação</label>
            <select
              className="input-field"
              value={form.ritualTemplate}
              onChange={(e) => setForm({
                ...form,
                ritualTemplate: e.target.value,
                materiaisCheck: {}, materiaisQtd: {}, materiaisUnidades: {}, materiaisVolume: {}, materiaisPreparo: {},
                preparoCheck: {}, preparoExtras: "", animais: [],
              })}
            >
              {Object.entries(RITUAIS).map(([key, r]) => <option key={key} value={key}>{r.nome}</option>)}
            </select>
          </div>

          {template && (
            <div className="card" style={{ marginBottom: "1rem", borderLeft: `4px solid ${template.cor}` }}>
              <RitualTabNav active={obrigacaoTab} onChange={setObrigacaoTab} color={template.cor} />
              {obrigacaoTab === "materiais" && (
                <MateriaisTab tpl={template} data={form} onUpdate={(next) => setForm(next)} />
              )}
              {obrigacaoTab === "animais" && (
                <AnimaisTab data={form} onUpdate={(next) => setForm(next)} orixas={orixas} color={template.cor} />
              )}
              {obrigacaoTab === "preparos" && (
                <PreparosTab tpl={template} data={form} onUpdate={(next) => setForm(next)} />
              )}
            </div>
          )}
        </>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <label className="label">Observações gerais</label>
        <textarea className="input-field" rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas internas..." style={{ resize: "vertical" }} />
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar ritual"}
        </button>
        <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
        {onDelete && isAdmin && (
          <button onClick={onDelete} style={{ marginLeft: "auto", padding: "0.55rem 1rem", background: "none", border: "1.5px solid #fecaca", borderRadius: "8px", color: "var(--egbe-red)", cursor: "pointer", fontWeight: 600 }}>
            Remover ritual
          </button>
        )}
      </div>
    </div>
  );
}
