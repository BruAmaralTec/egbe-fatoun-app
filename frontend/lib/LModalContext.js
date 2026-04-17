// ========================================
// lib/LModalContext.js
// Provider global de modais (substitui alert/confirm do navegador)
// ========================================

"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ModalContext = createContext({});

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const showAlert = useCallback((message, title) => {
    return new Promise((resolve) => {
      setModal({ type: "alert", message, title: title || "Aviso", resolve });
    });
  }, []);

  const showConfirm = useCallback((message, title) => {
    return new Promise((resolve) => {
      setModal({ type: "confirm", message, title: title || "Confirmação", resolve });
    });
  }, []);

  const showSuccess = useCallback((message, title) => {
    return new Promise((resolve) => {
      setModal({ type: "success", message, title: title || "Sucesso", resolve });
    });
  }, []);

  function close(result) {
    modal?.resolve(result);
    setModal(null);
  }

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showSuccess }}>
      {children}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "1rem" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && modal.type === "alert") close(true); }}
        >
          <div style={{ background: "white", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>
                {modal.type === "success" ? "✅" : modal.type === "confirm" ? "⚠️" : "ℹ️"}
              </span>
              <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{modal.title}</h3>
            </div>
            <p style={{ fontSize: "0.92rem", color: "#333", lineHeight: 1.6, marginBottom: "1.5rem", whiteSpace: "pre-wrap" }}>
              {modal.message}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              {modal.type === "confirm" && (
                <button
                  onClick={() => close(false)}
                  className="btn btn-secondary"
                  style={{ padding: "0.5rem 1.25rem" }}
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => close(true)}
                className={`btn ${modal.type === "confirm" ? "btn-primary" : modal.type === "success" ? "btn-primary" : "btn-primary"}`}
                style={{ padding: "0.5rem 1.25rem" }}
                autoFocus
              >
                {modal.type === "confirm" ? "Confirmar" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
