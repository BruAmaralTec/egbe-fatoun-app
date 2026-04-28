// ========================================
// components/FCursoDetalhe.js
// [F = Frontend Component]
// Página de detalhe de um curso
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const STATUS_LABELS = {
  open: { label: "Inscrições Abertas", color: "#22c55e", bg: "#dcfce7" },
  in_progress: { label: "Em Andamento", color: "#3b82f6", bg: "#dbeafe" },
  finished: { label: "Finalizado", color: "#6366f1", bg: "#e0e7ff" },
};

const MATERIAL_ICON = {
  pdf: "📄",
  video: "🎬",
  audio: "🎵",
  doc: "📝",
  link: "🔗",
};

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function FCursoDetalhe() {
  const params = useParams();
  const id = params?.id;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const snap = await getDoc(doc(db, "courses", id));
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setCourse({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p style={{ color: "#888" }}>Carregando curso...</p>;

  if (notFound || !course) {
    return (
      <div>
        <Link href="/dashboard/cursos" className="btn btn-secondary" style={{ marginBottom: "1rem", fontSize: "0.85rem", display: "inline-block", textDecoration: "none" }}>← Voltar</Link>
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📚</p>
          <p>Curso não encontrado.</p>
        </div>
      </div>
    );
  }

  const st = STATUS_LABELS[course.status];
  const daysFilled = (course.days || []).filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ maxWidth: "1130px", width: "100%" }}>
      <Link href="/dashboard/cursos" className="btn btn-secondary" style={{ marginBottom: "1rem", fontSize: "0.85rem", display: "inline-block", textDecoration: "none" }}>← Voltar aos cursos</Link>

      {/* Hero */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          {st && (
            <span style={{ fontSize: "0.78rem", padding: "0.25rem 0.7rem", borderRadius: "14px", background: st.bg, color: st.color, fontWeight: 600 }}>
              {st.label}
            </span>
          )}
          {course.certificateEnabled && (
            <span style={{ fontSize: "0.78rem", padding: "0.25rem 0.7rem", borderRadius: "14px", background: "#fef3c7", color: "#92400e", fontWeight: 600 }}>
              📜 Certificado{course.certificateHours > 0 ? ` · ${course.certificateHours}h` : ""}
            </span>
          )}
          {course.price > 0 ? (
            <span style={{ fontSize: "0.78rem", padding: "0.25rem 0.7rem", borderRadius: "14px", background: "#f3f4f6", color: "#1f2937", fontWeight: 600 }}>
              💰 R$ {Number(course.price).toFixed(2)}
            </span>
          ) : (
            <span style={{ fontSize: "0.78rem", padding: "0.25rem 0.7rem", borderRadius: "14px", background: "#dcfce7", color: "#166534", fontWeight: 600 }}>
              ✨ Gratuito
            </span>
          )}
        </div>
        <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", marginBottom: "0.25rem", lineHeight: 1.15, wordBreak: "break-word" }}>{course.title}</h1>
        {course.subtitle && (
          <p style={{ fontSize: "1.2rem", color: "#666", fontStyle: "italic", marginBottom: "0.5rem" }}>{course.subtitle}</p>
        )}
        {course.sacerdotisa && (
          <p style={{ fontSize: "1.1rem", color: "var(--egbe-green-dark)", fontWeight: 500 }}>
            🙏 Com {course.sacerdotisa}
          </p>
        )}
      </div>

      {/* Inscrição */}
      {course.paymentLink && course.status !== "finished" && (
        <div className="card" style={{ marginBottom: "1.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <p style={{ fontSize: "1.05rem", color: "#166534", marginBottom: "0.75rem" }}>
            As inscrições estão abertas.
          </p>
          <a
            href={course.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Inscrever-se ↗
          </a>
        </div>
      )}

      {/* Descrição */}
      {course.description && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.35rem", marginBottom: "0.75rem" }}>Sobre o curso</h2>
          <div className="rich-editor-content" style={{ fontSize: "1.1rem", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: course.description }} />
        </div>
      )}

      {/* Objetivo */}
      {course.objective && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.35rem", marginBottom: "0.75rem" }}>🎯 Objetivo</h2>
          <div className="rich-editor-content" style={{ fontSize: "1.1rem", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: course.objective }} />
        </div>
      )}

      {/* Agenda */}
      {daysFilled.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.35rem", marginBottom: "0.75rem" }}>📅 Agenda</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {daysFilled.map((d, i) => (
              <div key={d.id || i} style={{ padding: "0.6rem 0.9rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>Encontro {i + 1} · {formatDate(d.date)}</span>
                {(d.startTime || d.endTime) && (
                  <span style={{ fontSize: "1rem", color: "#666" }}>
                    {d.startTime || "—"}{d.endTime ? ` → ${d.endTime}` : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Módulos — sempre abertos, título + descrição */}
      {(course.modules?.length || 0) > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.35rem", marginBottom: "1rem" }}>📚 Módulos</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {course.modules.map((m, i) => {
              const descText = m.description ? m.description.replace(/<[^>]*>/g, "").trim() : "";
              return (
                <div key={m.id || i} style={{ padding: "1rem 1.1rem", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb", borderLeft: "4px solid var(--egbe-green)" }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "var(--egbe-green-dark)" }}>
                    {i + 1}. {m.title || "Sem título"}
                  </h3>
                  {descText ? (
                    <div
                      className="rich-editor-content"
                      style={{ fontSize: "1.05rem", lineHeight: 1.65, color: "#333" }}
                      dangerouslySetInnerHTML={{ __html: m.description }}
                    />
                  ) : (
                    <p style={{ fontSize: "0.95rem", color: "#aaa", fontStyle: "italic" }}>Descrição do módulo ainda não cadastrada.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Materiais */}
      {(course.materials?.length || 0) > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.35rem", marginBottom: "0.75rem" }}>📎 Materiais</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {course.materials.map((mat, i) => (
              <a
                key={mat.id || i}
                href={mat.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "0.6rem 0.9rem", background: "white", borderRadius: "8px",
                  border: "1px solid #e5e7eb", textDecoration: "none", color: "#1a1a1a",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{MATERIAL_ICON[mat.type] || "📄"}</span>
                <span style={{ flex: 1, fontSize: "1.05rem", fontWeight: 500 }}>{mat.name}</span>
                <span style={{ fontSize: "0.95rem", color: "var(--egbe-green)", fontWeight: 600 }}>Abrir ↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Transmissão / Gravação */}
      {(course.streamYardUrl || course.youtubeVideoId) && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.35rem", marginBottom: "0.75rem" }}>🎬 Transmissão</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {course.streamYardUrl && (
              <a href={course.streamYardUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                Ao vivo ↗
              </a>
            )}
            {course.recordingAvailable && course.youtubeVideoId && (
              <a href={`https://youtube.com/watch?v=${course.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                Ver gravação ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* CTA inscrição no final */}
      {course.paymentLink && course.status !== "finished" && (
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <a
            href={course.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: "none", display: "inline-block", fontSize: "1rem", padding: "0.75rem 2rem" }}
          >
            Inscrever-se neste curso ↗
          </a>
        </div>
      )}
    </div>
  );
}
