// ========================================
// components/admin/FFinanceiroAdmin.js
// [F = Frontend Component]
// Painel financeiro — arrecadação por evento
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

export default function FFinanceiroAdmin() {
  const { isAdmin, isConselho } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConselho) return;
    async function load() {
      const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
      try {
        const snap = await getDocs(q);
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* collection may not exist */ }
      setLoading(false);
    }
    load();
  }, [isConselho]);

  if (!isConselho) return null;

  const confirmed = payments.filter(p => p.status === "confirmed" || p.status === "received");
  const totalReceived = confirmed.reduce((sum, p) => sum + (p.value || 0), 0);
  const totalPending = payments.filter(p => p.status === "created" || p.status === "pending").reduce((sum, p) => sum + (p.value || 0), 0);
  const totalOverdue = payments.filter(p => p.status === "overdue").reduce((sum, p) => sum + (p.value || 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Financeiro</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Visível para Sacerdotisa e Conselho · Integração Asaas</p>

      {/* Cards de resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total recebido", value: `R$ ${totalReceived.toFixed(2)}`, color: "var(--egbe-green)" },
          { label: "Pendente", value: `R$ ${totalPending.toFixed(2)}`, color: "var(--egbe-yellow)" },
          { label: "Vencido", value: `R$ ${totalOverdue.toFixed(2)}`, color: "var(--egbe-red)" },
          { label: "Cobranças", value: payments.length, color: "#6366f1" },
        ].map(card => (
          <div key={card.label} style={{ background: "white", borderRadius: "12px", padding: "1.25rem", borderTop: `3px solid ${card.color}` }}>
            <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.25rem" }}>{card.label}</p>
            <p style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 600, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela de cobranças */}
      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : (
        <div className="card">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Últimas cobranças</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  {["Data", "Tipo", "Valor", "Método", "Status"].map(h => (
                    <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontWeight: 600, color: "#666", fontSize: "0.78rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 20).map(p => {
                  const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
                  const statusColors = { confirmed: "#22c55e", received: "#22c55e", overdue: "#ef4444", created: "#D4A017", pending: "#D4A017" };
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.6rem 0.75rem" }}>{date.toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>{p.eventId ? "Evento" : p.courseId ? "Curso" : "Avulso"}</td>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>R$ {(p.value || 0).toFixed(2)}</td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>{p.billingType || "—"}</td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "10px", background: (statusColors[p.status] || "#9ca3af") + "20", color: statusColors[p.status] || "#9ca3af" }}>
                          {p.status || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asaas status */}
      <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#f0f7f3", border: "1px solid #d1fae5", borderRadius: "8px", fontSize: "0.85rem", color: "var(--egbe-green-dark)" }}>
        <strong>Gateway Asaas:</strong> Pix, Boleto e Cartão habilitados. Gerencie as credenciais em Integrações.
      </div>
    </div>
  );
}
