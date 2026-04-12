// ========================================
// components/admin/FRituaisAdmin.js
// [F = Frontend Component]
// Gestão de rituais — agenda, materiais, WhatsApp
// ========================================

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/LAuthContext";

const RITUAIS = {
  "bori-normal": {
    nome: "Bori Normal", cor: "#D4A017",
    compra: ["Inhame branco (1)", "Mel puro (250ml)", "Azeite de dendê (100ml)", "Obí (4 gomos)", "Orobô (1)", "Pemba branca (1)", "Vela branca (2)", "Efun (1 pacote)", "Fio branco (1m)", "Pano branco (50x50cm)"],
    preparo: ["Cozinhar inhame no leite de coco", "Preparar o obi para divisão", "Limpar e consagrar o ori", "Invocar Egúngún e ancestrais", "Montar altar de Ori com inhame e mel", "Defumar o espaço", "Rezar Oríkì de Ori", "Fechar com efun e pemba"],
  },
  "bori-funfun": {
    nome: "Bori Funfun", cor: "#1B6B3A",
    compra: ["Inhame branco (2)", "Leite de coco (200ml)", "Efun (2 pacotes)", "Obí (8 gomos)", "Orobô (2)", "Flores brancas (buquê)", "Vela branca (6)", "Manteiga de karité (50g)", "Pano branco (1m x 1m)", "Osun pó branco", "Iyefá (pitada)"],
    preparo: ["Preparar banho de efun e flores brancas", "Cozinhar inhame somente em água e sal", "Preparar Ori com manteiga de karité", "Vestir consulente de branco", "Montar altar de Obàtálá", "Rezar Oríkì de Obàtálá e Ori", "Lavar cabeça com mistura sagrada", "Selar com efun e inhame branco"],
  },
  "feitura-osun": {
    nome: "Feitura Ọ́ṣun", cor: "#B22222",
    compra: ["Mel puro (500ml)", "Canela em pó (50g)", "Cravo da Índia (1 pacote)", "Obí (8 gomos)", "Orobô (2)", "Efun (1 pacote)", "Osun pó vermelho (1 pacote)", "Tecido amarelo (2m)", "Contas amarelas (fio)", "Igba (metade da cabaça)", "Dendê (100ml)", "Espelho (1 pequeno)"],
    preparo: ["Preparar ewé de Ọ́ṣun", "Lavar e consagrar Igba com mel", "Preparar pemba amarela", "Montar altar de Ọ́ṣun com espelho", "Banho de descarrego", "Consagrar joias e contas", "Rezar Odù do consulente", "Fechar com iyefá"],
  },
  "ebo-exu": {
    nome: "Ebó Exu", cor: "#1a1a1a",
    compra: ["Farofa de dendê (300g)", "Cachaça 51 (500ml)", "Charuto (3)", "Vela preta (3)", "Vela vermelha (3)", "Carvão vegetal (pacote)", "Mel (100ml)", "7 Pimentas dedo-de-moça", "Moeda de 1 real (7)", "Obí (4 gomos)", "Fumo de corda (1 pedaço)"],
    preparo: ["Escolher encruzilhada às 0h ou 6h", "Preparar farofa com dendê e pimenta", "Dispor os 7 pratos", "Acender velas pretas e vermelhas", "Acender o charuto para Exu", "Derramar cachaça no sentido horário", "Rezar Oríkì de Exu e Legbá", "Jogar obi para confirmar", "Recolher sem olhar para trás"],
  },
  "ebo-cliente": {
    nome: "Ebó Cliente", cor: "#1a4080",
    compra: ["*Consultar Odù antes de comprar*", "Obí (4 gomos — sempre)", "Orobô (1 — sempre)", "Mel (100ml — sempre)", "Vela branca (2 — sempre)", "Sal grosso (1 pacote)", "Pano branco (50cm)", "[Materiais específicos do Odù]"],
    preparo: ["Consultar Ifá para identificar Odù", "Confirmar materiais pelo Odù revelado", "Escolher local conforme prescrição", "Preparar consulente com banho prévio", "Montar o ebó conforme Ifá", "Rezar Ìtàn do Odù", "Confirmar aceitação pelo obi", "Orientar sobre tabus pós-ebó"],
  },
};

export default function FRituaisAdmin() {
  const { isAdmin } = useAuth();
  const [selected, setSelected] = useState("bori-normal");
  const [checkedCompra, setCheckedCompra] = useState({});
  const [checkedPreparo, setCheckedPreparo] = useState({});
  const [extras, setExtras] = useState("");
  const [whatsappNum, setWhatsappNum] = useState("");
  const [savedNumbers, setSavedNumbers] = useState([{ name: "Fornecedor 1", num: "5511999999999" }]);

  if (!isAdmin) return null;

  const ritual = RITUAIS[selected];

  function toggleCheck(type, idx) {
    const setter = type === "compra" ? setCheckedCompra : setCheckedPreparo;
    setter(prev => ({ ...prev, [`${selected}-${idx}`]: !prev[`${selected}-${idx}`] }));
  }

  function getWhatsAppLink() {
    const items = ritual.compra.filter((_, i) => checkedCompra[`${selected}-${i}`]);
    if (items.length === 0) return alert("Selecione pelo menos um item da lista de compra");
    const text = `*${ritual.nome} — Lista de Compra*\n\n${items.map((m, i) => `${i + 1}. ${m}`).join("\n")}${extras ? `\n\n*Extras:*\n${extras}` : ""}`;
    const num = whatsappNum.replace(/\D/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Gestão de Rituais</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Listas de materiais por ritual · Envio via WhatsApp</p>

      {/* Seletor de ritual */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {Object.entries(RITUAIS).map(([key, r]) => (
          <button key={key} onClick={() => setSelected(key)} style={{
            padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            background: selected === key ? r.cor : "white", color: selected === key ? "white" : r.cor,
            border: `2px solid ${r.cor}`, fontFamily: "inherit",
          }}>{r.nome}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Lista de compra */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>🛒 Lista de Compra</h3>
          {ritual.compra.map((item, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}>
              <input type="checkbox" checked={!!checkedCompra[`${selected}-${i}`]} onChange={() => toggleCheck("compra", i)} style={{ accentColor: ritual.cor }} />
              <span style={{ fontSize: "0.88rem", textDecoration: checkedCompra[`${selected}-${i}`] ? "line-through" : "none", color: checkedCompra[`${selected}-${i}`] ? "#888" : "#1a1a1a" }}>{item}</span>
            </label>
          ))}
          <p style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.5rem" }}>
            {Object.keys(checkedCompra).filter(k => k.startsWith(selected) && checkedCompra[k]).length} / {ritual.compra.length} selecionados
          </p>
        </div>

        {/* Lista de preparo */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>🔥 Lista de Preparo</h3>
          {ritual.preparo.map((item, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}>
              <input type="checkbox" checked={!!checkedPreparo[`${selected}-${i}`]} onChange={() => toggleCheck("preparo", i)} style={{ accentColor: ritual.cor }} />
              <span style={{ fontSize: "0.88rem", textDecoration: checkedPreparo[`${selected}-${i}`] ? "line-through" : "none", color: checkedPreparo[`${selected}-${i}`] ? "#888" : "#1a1a1a" }}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Extras e WhatsApp */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Acréscimos extras</h3>
          <textarea className="input-field" rows={3} value={extras} onChange={e => setExtras(e.target.value)} placeholder="Materiais adicionais..." style={{ resize: "vertical" }} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Enviar via WhatsApp</h3>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input className="input-field" value={whatsappNum} onChange={e => setWhatsappNum(e.target.value)} placeholder="5511999999999" style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={getWhatsAppLink} style={{ whiteSpace: "nowrap" }}>Enviar</button>
          </div>
          {savedNumbers.map((n, i) => (
            <button key={i} onClick={() => setWhatsappNum(n.num)} style={{ display: "block", width: "100%", padding: "0.4rem 0.6rem", background: "#f0f7f3", border: "1px solid #d1fae5", borderRadius: "6px", cursor: "pointer", textAlign: "left", fontSize: "0.82rem", marginBottom: "0.3rem", fontFamily: "inherit" }}>
              {n.name} · {n.num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
