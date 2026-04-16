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
    compra: [
      { nome: "Inhame branco", qtd: "1" },
      { nome: "Mel puro", qtd: "250ml" },
      { nome: "Azeite de dendê", qtd: "100ml" },
      { nome: "Obí", qtd: "4 gomos" },
      { nome: "Orobô", qtd: "1" },
      { nome: "Pemba branca", qtd: "1" },
      { nome: "Vela branca", qtd: "2" },
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
      { nome: "Vela branca", qtd: "6" },
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
      { nome: "Vela preta", qtd: "3" },
      { nome: "Vela vermelha", qtd: "3" },
      { nome: "Carvão vegetal", qtd: "1 pacote" },
      { nome: "Mel", qtd: "100ml" },
      { nome: "Pimentas dedo-de-moça", qtd: "7" },
      { nome: "Moeda de 1 real", qtd: "7" },
      { nome: "Obí", qtd: "4 gomos" },
      { nome: "Fumo de corda", qtd: "1 pedaço" },
    ],
    preparo: ["Escolher encruzilhada às 0h ou 6h", "Preparar farofa com dendê e pimenta", "Dispor os 7 pratos", "Acender velas pretas e vermelhas", "Acender o charuto para Exu", "Derramar cachaça no sentido horário", "Rezar Oríkì de Exu e Legbá", "Jogar obi para confirmar", "Recolher sem olhar para trás"],
  },
  "ebo-cliente": {
    nome: "Ebó Cliente", cor: "#1a4080",
    compra: [
      { nome: "*Consultar Odù antes de comprar*", qtd: "—" },
      { nome: "Obí (sempre)", qtd: "4 gomos" },
      { nome: "Orobô (sempre)", qtd: "1" },
      { nome: "Mel (sempre)", qtd: "100ml" },
      { nome: "Vela branca (sempre)", qtd: "2" },
      { nome: "Sal grosso", qtd: "1 pacote" },
      { nome: "Pano branco", qtd: "50cm" },
      { nome: "[Materiais específicos do Odù]", qtd: "—" },
    ],
    preparo: ["Consultar Ifá para identificar Odù", "Confirmar materiais pelo Odù revelado", "Escolher local conforme prescrição", "Preparar consulente com banho prévio", "Montar o ebó conforme Ifá", "Rezar Ìtàn do Odù", "Confirmar aceitação pelo obi", "Orientar sobre tabus pós-ebó"],
  },
};

export default function FRituaisAdmin() {
  const { isAdmin } = useAuth();
  const [selected, setSelected] = useState("bori-normal");
  const [checkedCompra, setCheckedCompra] = useState({});
  const [checkedPreparo, setCheckedPreparo] = useState({});
  const [quantities, setQuantities] = useState({});
  const [extras, setExtras] = useState("");
  const [whatsappNum, setWhatsappNum] = useState("");
  const [savedNumbers, setSavedNumbers] = useState([{ name: "Fornecedor 1", num: "5511999999999" }]);

  if (!isAdmin) return null;

  const ritual = RITUAIS[selected];

  function toggleCheck(type, idx) {
    const setter = type === "compra" ? setCheckedCompra : setCheckedPreparo;
    setter(prev => ({ ...prev, [`${selected}-${idx}`]: !prev[`${selected}-${idx}`] }));
  }

  function getQtd(idx) {
    const key = `${selected}-${idx}`;
    return quantities[key] !== undefined ? quantities[key] : ritual.compra[idx].qtd;
  }

  function setQtd(idx, value) {
    setQuantities(prev => ({ ...prev, [`${selected}-${idx}`]: value }));
  }

  function getWhatsAppLink() {
    const items = ritual.compra
      .map((item, i) => ({ ...item, qtd: getQtd(i), checked: !!checkedCompra[`${selected}-${i}`] }))
      .filter(item => item.checked);
    if (items.length === 0) return alert("Selecione pelo menos um item da lista de compra");
    const text = `*${ritual.nome} — Lista de Compra*\n\n${items.map((m, i) => `${i + 1}. ${m.nome} — ${m.qtd}`).join("\n")}${extras ? `\n\n*Extras:*\n${extras}` : ""}`;
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Lista de compra */}
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>🛒 Lista de Compra</h3>
          {ritual.compra.map((item, i) => {
            const key = `${selected}-${i}`;
            const checked = !!checkedCompra[key];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid #f3f4f6" }}>
                <input type="checkbox" checked={checked} onChange={() => toggleCheck("compra", i)} style={{ accentColor: ritual.cor, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.88rem", textDecoration: checked ? "line-through" : "none", color: checked ? "#888" : "#1a1a1a" }}>
                  {item.nome}
                </span>
                <input
                  type="text"
                  value={getQtd(i)}
                  onChange={(e) => setQtd(i, e.target.value)}
                  style={{
                    width: "80px", padding: "0.25rem 0.4rem", border: "1px solid #d1d5db",
                    borderRadius: "6px", fontSize: "0.8rem", textAlign: "center",
                    background: checked ? "#f3f4f6" : "white", color: checked ? "#888" : "#1a1a1a",
                  }}
                />
              </div>
            );
          })}
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
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
