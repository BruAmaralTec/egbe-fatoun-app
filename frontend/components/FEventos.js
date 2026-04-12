// ========================================
// components/FEventos.js
// [F = Frontend Component]
// Lista de eventos para usuários
// ========================================

"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const TYPE_LABELS = {
  festival: "Festival / Odún",
  encontro: "Encontro",
  ritual: "Ritual",
  palestra: "Palestra",
  workshop: "Workshop",
};

export default function FEventos() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "events"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.status === "published" || e.visibility === "public");
        setEvents(data);
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  if (loading) return <p style={{ color: "#888" }}>Carregando eventos...</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Eventos</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Festivais, encontros e atividades do Ẹgbẹ́ Fátọ́ún</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[{ value: "all", label: "Todos" }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))].map((opt) => (
          <button key={opt.value} onClick={() => setFilter(opt.value)} className={`btn ${filter === opt.value ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }}>
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📅</p>
          <p>Nenhum evento disponível no momento.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map((event) => (
            <div key={event.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "#f0f7f3", color: "var(--egbe-green-dark)", fontWeight: 500 }}>
                  {TYPE_LABELS[event.type] || event.type}
                </span>
                {event.registrationOpen && (
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "#dcfce7", color: "#166534", fontWeight: 500 }}>
                    Inscrições abertas
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{event.title}</h3>
              {event.description && (
                <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.75rem", flex: 1 }}>
                  {event.description.length > 150 ? event.description.slice(0, 150) + "..." : event.description}
                </p>
              )}
              <div style={{ fontSize: "0.82rem", color: "#888", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {event.date && <span>📅 {event.date}</span>}
                {event.location && <span>📍 {event.location}</span>}
                {event.price > 0 ? (
                  <span>💰 R$ {Number(event.price).toFixed(2)}</span>
                ) : (
                  <span style={{ color: "var(--egbe-green)" }}>✨ Gratuito</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
