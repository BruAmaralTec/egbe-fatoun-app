// ========================================
// components/FRichTextEditor.js
// [F = Frontend Component]
// Editor de texto rico simples: negrito, itálico,
// tab, listas numeradas e com marcadores.
// Baseado em contenteditable + document.execCommand.
// ========================================

"use client";

import { useRef, useEffect } from "react";

const BUTTONS = [
  { cmd: "bold", icon: "B", title: "Negrito (Ctrl+B)", style: { fontWeight: 700 } },
  { cmd: "italic", icon: "I", title: "Itálico (Ctrl+I)", style: { fontStyle: "italic" } },
  { cmd: "insertUnorderedList", icon: "•", title: "Lista com marcadores" },
  { cmd: "insertOrderedList", icon: "1.", title: "Lista numerada" },
  { cmd: "indent", icon: "→|", title: "Aumentar indentação" },
  { cmd: "outdent", icon: "|←", title: "Diminuir indentação" },
];

export default function FRichTextEditor({ value, onChange, placeholder = "Digite aqui...", minHeight = "150px" }) {
  const ref = useRef(null);

  // Sincroniza valor inicial / mudanças externas
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  function exec(cmd) {
    document.execCommand(cmd, false, null);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || "");
  }

  function handleInput() {
    onChange(ref.current?.innerHTML || "");
  }

  function handleKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand(e.shiftKey ? "outdent" : "indent", false, null);
      onChange(ref.current?.innerHTML || "");
    }
  }

  return (
    <div style={{ border: "1.5px solid #d1d5db", borderRadius: "6px", overflow: "hidden", background: "white" }}>
      <div style={{ display: "flex", gap: "0.15rem", padding: "0.35rem 0.5rem", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
        {BUTTONS.map((b) => (
          <button
            key={b.cmd}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); exec(b.cmd); }}
            title={b.title}
            style={{
              minWidth: "32px", padding: "0.3rem 0.5rem", background: "white",
              border: "1px solid #e5e7eb", borderRadius: "4px",
              cursor: "pointer", fontSize: "0.85rem", color: "#374151",
              fontFamily: "inherit", ...b.style,
            }}
          >
            {b.icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{
          minHeight, padding: "0.75rem 1rem", outline: "none",
          fontSize: "0.92rem", lineHeight: 1.6, color: "#1a1a1a",
        }}
        className="rich-editor-content"
      />
    </div>
  );
}
