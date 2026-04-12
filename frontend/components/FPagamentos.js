// ========================================
// components/FPagamentos.js
// [F = Frontend Component]
// Meus pagamentos — histórico via Asaas
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/LFirebase";

const STATUS_MAP = {
  created: { label: "Criado", color: "#9ca3af" },
  confirmed: { label: "Confirmado", color: "#22c55e" },
  received: { label: "Recebido", color: "#22c55e" },
  overdue: { label: "Vencido", color: "#ef4444" },
  refunded: { label: "Reembolsado", color: "#6366f1" },
  pending: { label: "Pendente", color: "#D4A017" },
};

export default function FPagamentos() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const q = query(collection(db, "payments"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Meus Pagamentos</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Histórico de cobranças e pagamentos</p>

      {loading ? <p style={{ color: "#888" }}>Carregando...</p> : payments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💳</p>
          <p style={{ color: "#888" }}>Nenhum pagamento registrado ainda.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Data", "Descrição", "Valor", "Tipo", "Status"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#666", borderBottom: "1px solid #e5e7eb", fontSize: "0.8rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const status = STATUS_MAP[p.status] || STATUS_MAP.pending;
                const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>{date.toLocaleDateString("pt-BR")}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{p.eventId ? `Evento` : p.courseId ? `Curso` : "Pagamento"}</td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--egbe-green)" }}>R$ {(p.value || 0).toFixed(2)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{p.billingType || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "10px", background: status.color + "20", color: status.color }}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
