// ========================================
// components/FCursos.js
// [F = Frontend Component]
// Lista de cursos para usuários
// ========================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const STATUS_LABELS = {
  open: { label: "Inscrições Abertas", color: "#22c55e", bg: "#dcfce7" },
  in_progress: { label: "Em Andamento", color: "#3b82f6", bg: "#dbeafe" },
  finished: { label: "Finalizado", color: "#6366f1", bg: "#e0e7ff" },
};

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function agendaSummary(days = []) {
  const filled = days.filter((d) => d.date);
  if (filled.length === 0) return null;
  if (filled.length === 1) {
    const d = filled[0];
    const time = d.startTime ? ` às ${d.startTime}` : "";
    return `${formatDate(d.date)}${time}`;
  }
  const sorted = [...filled].sort((a, b) => a.date.localeCompare(b.date));
  return `${filled.length} encontros · 1º em ${formatDate(sorted[0].date)}`;
}

export default function FCursos() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
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
            const agenda = agendaSummary(course.days);
            const plain = course.description ? course.description.replace(/<[^>]*>/g, "").trim() : "";
            return (
              <div key={course.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", gap: "0.5rem" }}>
                  {st && (
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: st.bg, color: st.color, fontWeight: 500 }}>
                      {st.label}
                    </span>
                  )}
                  {course.certificateEnabled && (
                    <span style={{ fontSize: "0.75rem", color: "#888" }}>📜 Certificado</span>
                  )}
                </div>

                <h3 style={{ fontSize: "1.1rem", marginBottom: course.subtitle ? "0.15rem" : "0.5rem" }}>{course.title}</h3>
                {course.subtitle && (
                  <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem", fontStyle: "italic" }}>
                    {course.subtitle}
                  </p>
                )}

                {course.sacerdotisa && (
                  <p style={{ fontSize: "0.82rem", color: "var(--egbe-green-dark)", marginBottom: "0.25rem", fontWeight: 500 }}>
                    🙏 Com {course.sacerdotisa}
                  </p>
                )}

                <Link href={`/dashboard/cursos/${course.id}`} style={{ fontSize: "0.82rem", color: "var(--egbe-green)", fontWeight: 600, textDecoration: "none", marginBottom: "0.5rem", display: "inline-block" }}>
                  + detalhes
                </Link>

                <div style={{ fontSize: "0.82rem", color: "#888", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {agenda && <span>📅 {agenda}</span>}
                  {(course.modules?.length || 0) > 0 && (
                    <span>📚 {course.modules.length} módulo{course.modules.length > 1 ? "s" : ""}</span>
                  )}
                  {course.price > 0 ? (
                    <span>💰 R$ {Number(course.price).toFixed(2)}</span>
                  ) : (
                    <span style={{ color: "var(--egbe-green)" }}>✨ Gratuito</span>
                  )}
                  {course.certificateHours > 0 && (
                    <span>⏱️ {course.certificateHours}h de certificado</span>
                  )}
                </div>

                {course.paymentLink && course.status !== "finished" && (
                  <a
                    href={course.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ marginTop: "0.75rem", textDecoration: "none", textAlign: "center", justifyContent: "center", width: "100%" }}
                  >
                    Comprar curso ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
