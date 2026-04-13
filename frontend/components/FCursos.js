// ========================================
// components/FCursos.js
// [F = Frontend Component]
// Lista de cursos para usuários
// ========================================

"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const STATUS_LABELS = {
  open: { label: "Inscrições Abertas", color: "#22c55e", bg: "#dcfce7" },
  in_progress: { label: "Em Andamento", color: "#3b82f6", bg: "#dbeafe" },
  finished: { label: "Finalizado", color: "#6366f1", bg: "#e0e7ff" },
};

export default function FCursos() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "courses"), orderBy("startDate", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c) => c.status !== "draft" && c.visibility === "public");
        setCourses(data);
      } catch (err) {
        console.error("Erro ao carregar cursos:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === "all" ? courses : courses.filter((c) => c.status === filter);

  if (loading) return <p style={{ color: "#888" }}>Carregando cursos...</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Cursos</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Formações e estudos do Ẹgbẹ́ Fátọ́ún</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[{ value: "all", label: "Todos" }, ...Object.entries(STATUS_LABELS).map(([value, { label }]) => ({ value, label }))].map((opt) => (
          <button key={opt.value} onClick={() => setFilter(opt.value)} className={`btn ${filter === opt.value ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }}>
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📚</p>
          <p>Nenhum curso disponível no momento.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map((course) => {
            const st = STATUS_LABELS[course.status];
            return (
              <div key={course.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  {st && (
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: st.bg, color: st.color, fontWeight: 500 }}>
                      {st.label}
                    </span>
                  )}
                  {course.certificateEnabled && (
                    <span style={{ fontSize: "0.75rem", color: "#888" }}>📜 Certificado</span>
                  )}
                </div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{course.title}</h3>
                {course.instructor && (
                  <p style={{ fontSize: "0.82rem", color: "var(--egbe-green-dark)", marginBottom: "0.25rem", fontWeight: 500 }}>
                    👨‍🏫 {course.instructor}
                  </p>
                )}
                {course.description && (() => {
                  const plain = course.description.replace(/<[^>]*>/g, "").trim();
                  return plain ? (
                    <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.75rem", flex: 1 }}>
                      {plain.length > 150 ? plain.slice(0, 150) + "..." : plain}
                    </p>
                  ) : null;
                })()}
                <div style={{ fontSize: "0.82rem", color: "#888", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {course.startDate && <span>📅 Início: {course.startDate}</span>}
                  {course.schedule && <span>🕐 {course.schedule}</span>}
                  {course.price > 0 ? (
                    <span>💰 R$ {Number(course.price).toFixed(2)}</span>
                  ) : (
                    <span style={{ color: "var(--egbe-green)" }}>✨ Gratuito</span>
                  )}
                  {course.certificateHours > 0 && (
                    <span>⏱️ {course.certificateHours}h de certificado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
