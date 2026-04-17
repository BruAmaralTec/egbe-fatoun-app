// ========================================
// components/FOduInput.js
// [F = Frontend Component]
// Grid 2 colunas x 4 linhas para marcar I / II
// ========================================

"use client";

import { composeOdu } from "@/lib/LOdu";

/**
 * value: { leftMarks: ["I"|"II", x4], rightMarks: ["I"|"II", x4] }
 * onChange: (next) => void
 */
export default function FOduInput({ value, onChange, label, compact }) {
  const leftMarks = value?.leftMarks || ["I", "I", "I", "I"];
  const rightMarks = value?.rightMarks || ["I", "I", "I", "I"];
  const composed = composeOdu(leftMarks, rightMarks);

  function toggle(side, idx) {
    const marks = (side === "left" ? leftMarks : rightMarks).slice();
    marks[idx] = marks[idx] === "I" ? "II" : "I";
    onChange({
      ...(value || {}),
      leftMarks: side === "left" ? marks : leftMarks,
      rightMarks: side === "right" ? marks : rightMarks,
    });
  }

  const cellSize = compact ? 34 : 46;
  const fontSize = compact ? "0.95rem" : "1.1rem";

  return (
    <div>
      {label && <label className="label" style={{ marginBottom: "0.5rem", display: "block" }}>{label}</label>}
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gridTemplateColumns: `${cellSize}px ${cellSize}px`, gap: "6px", padding: "0.5rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          {[0, 1, 2, 3].map((row) => (
            <>
              <button
                key={`L${row}`}
                type="button"
                onClick={() => toggle("left", row)}
                style={{
                  width: cellSize, height: cellSize,
                  background: "white",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize,
                  fontWeight: 700,
                  fontFamily: "serif",
                  color: "#1a1a1a",
                }}
                aria-label={`Coluna esquerda linha ${row + 1}: ${leftMarks[row]}`}
              >
                {leftMarks[row]}
              </button>
              <button
                key={`R${row}`}
                type="button"
                onClick={() => toggle("right", row)}
                style={{
                  width: cellSize, height: cellSize,
                  background: "white",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize,
                  fontWeight: 700,
                  fontFamily: "serif",
                  color: "#1a1a1a",
                }}
                aria-label={`Coluna direita linha ${row + 1}: ${rightMarks[row]}`}
              >
                {rightMarks[row]}
              </button>
            </>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          {composed ? (
            <>
              <p style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Odú</p>
              <p style={{ fontSize: "1.1rem", color: "var(--egbe-green-dark)", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "0.3rem" }}>
                {composed.name}
              </p>
              <p style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5 }}>
                {composed.significance}
              </p>
            </>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "#aaa", fontStyle: "italic" }}>
              Toque nos caracteres para alternar entre I e II.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
