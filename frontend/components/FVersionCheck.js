// ========================================
// components/FVersionCheck.js
// Verifica se há versão nova deployada e oferece reload
// ========================================

"use client";

import { useState, useEffect } from "react";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export default function FVersionCheck() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    let initialBuildId = null;

    async function checkVersion() {
      try {
        const res = await fetch("/?_check=" + Date.now(), { method: "HEAD", cache: "no-store" });
        const buildId = res.headers.get("x-nextjs-build-id") || res.headers.get("x-vercel-id") || "";
        if (!initialBuildId) {
          initialBuildId = buildId;
          return;
        }
        if (buildId && buildId !== initialBuildId) {
          setShowUpdate(true);
        }
      } catch {}
    }

    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (!showUpdate) return null;

  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9998,
      background: "var(--egbe-green)", color: "white", borderRadius: "12px",
      padding: "0.75rem 1.25rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.88rem",
      maxWidth: "360px",
    }}>
      <span style={{ flex: 1 }}>Nova versão disponível.</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "0.4rem 0.8rem", background: "white", color: "var(--egbe-green-dark)",
          border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer",
          fontSize: "0.82rem", fontFamily: "inherit",
        }}
      >
        Atualizar
      </button>
    </div>
  );
}
