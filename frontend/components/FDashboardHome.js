// ========================================
// components/FDashboardHome.js
// [F = Frontend Component]
// Painel Administrativo — resumos do sistema
// ========================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/LAuthContext";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { ROLES } from "@/lib/LPermissions";

export default function FDashboardHome() {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    async function load() {
      try {
        const [usersSnap, eventsSnap, coursesSnap, notifSnap, paymentsSnap, librarySnap, ritualsSnap, groupsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "events")),
          getDocs(collection(db, "courses")),
          getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(200))),
          getDocs(collection(db, "payments")).catch(() => ({ docs: [] })),
          getDocs(collection(db, "library")).catch(() => ({ docs: [] })),
          getDocs(collection(db, "rituals")).catch(() => ({ docs: [] })),
          getDocs(collection(db, "groups")).catch(() => ({ docs: [] })),
        ]);

        const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const payments = paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const notifications = notifSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const roleCounts = {};
        ROLES.forEach((r) => { roleCounts[r.value] = 0; });
        users.forEach((u) => { if (roleCounts[u.role] !== undefined) roleCounts[u.role]++; });

        const coursesOpen = courses.filter((c) => c.status === "open").length;
        const coursesProgress = courses.filter((c) => c.status === "in_progress").length;
        const coursesFinished = courses.filter((c) => c.status === "finished").length;

        const eventsPublished = events.filter((e) => e.status === "published" || !e.status).length;

        const confirmedPayments = payments.filter((p) => p.status === "confirmed" || p.status === "received");
        const totalReceived = confirmedPayments.reduce((s, p) => s + (p.value || 0), 0);
        const pendingPayments = payments.filter((p) => p.status === "created" || p.status === "pending");
        const totalPending = pendingPayments.reduce((s, p) => s + (p.value || 0), 0);

        const unreadNotifs = notifications.filter((n) => !n.read).length;

        setStats({
          totalUsers: users.length,
          roleCounts,
          totalEvents: events.length,
          eventsPublished,
          totalCourses: courses.length,
          coursesOpen,
          coursesProgress,
          coursesFinished,
          totalPayments: payments.length,
          totalReceived,
          totalPending,
          totalLibrary: librarySnap.docs.length,
          totalRituals: ritualsSnap.docs.length,
          totalGroups: groupsSnap.docs.length,
          unreadNotifs,
        });
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
          Àṣẹ, {profile?.communityName || profile?.displayName || "Visitante"}! 🙏
        </h1>
        <p style={{ color: "#666", fontSize: "0.95rem" }}>Bem-vinda(o) ao Ẹgbẹ́ Fátọ́ún</p>
      </div>
    );
  }

  const roleLabel = ROLES.find((r) => r.value === profile?.role)?.label || "Admin";

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Painel Administrativo</h1>
      <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
        Àṣẹ, {profile?.communityName || profile?.displayName}! · {roleLabel}
      </p>

      {loading ? <p style={{ color: "#888" }}>Carregando resumos...</p> : stats && (
        <>
          {/* Resumo principal */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Usuários", value: stats.totalUsers, color: "var(--egbe-green)", href: "/dashboard/membros" },
              { label: "Eventos", value: stats.totalEvents, color: "#f59e0b", href: "/dashboard/admin/eventos" },
              { label: "Cursos", value: stats.totalCourses, color: "#6366f1", href: "/dashboard/admin/cursos" },
              { label: "Materiais", value: stats.totalLibrary, color: "#0891b2", href: "/dashboard/biblioteca" },
              { label: "Rituais", value: stats.totalRituals, color: "#B22222", href: "/dashboard/admin/rituais" },
              { label: "Grupos", value: stats.totalGroups, color: "#3b82f6", href: "/dashboard/membros" },
            ].map((card) => (
              <Link key={card.label} href={card.href} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ background: "white", borderRadius: "12px", padding: "1rem", borderTop: `3px solid ${card.color}` }}>
                  <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "0.15rem" }}>{card.label}</p>
                  <p style={{ fontSize: "1.6rem", fontFamily: "var(--font-display)", fontWeight: 700, color: card.color }}>{card.value}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Usuários por perfil */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>👥 Usuários por perfil</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {ROLES.map((r) => (
                <div key={r.value} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.9rem", background: r.color + "15", borderRadius: "10px", border: `1px solid ${r.color}30` }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 700, color: r.color }}>{stats.roleCounts[r.value] || 0}</span>
                  <span style={{ fontSize: "0.85rem", color: "#333" }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            {/* Cursos */}
            <div className="card">
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>📚 Cursos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {[
                  { label: "Inscrições Abertas", value: stats.coursesOpen, color: "#22c55e" },
                  { label: "Em Andamento", value: stats.coursesProgress, color: "#3b82f6" },
                  { label: "Finalizados", value: stats.coursesFinished, color: "#6366f1" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: "0.88rem", color: "#555" }}>{item.label}</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/admin/cursos" style={{ display: "block", marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--egbe-green)", fontWeight: 600, textDecoration: "none" }}>
                Gerenciar cursos →
              </Link>
            </div>

            {/* Financeiro */}
            <div className="card">
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>💰 Financeiro</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: "0.88rem", color: "#555" }}>Recebido</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--egbe-green)" }}>R$ {stats.totalReceived.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: "0.88rem", color: "#555" }}>Pendente</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#D4A017" }}>R$ {stats.totalPending.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0" }}>
                  <span style={{ fontSize: "0.88rem", color: "#555" }}>Total de cobranças</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#333" }}>{stats.totalPayments}</span>
                </div>
              </div>
              <Link href="/dashboard/admin/financeiro" style={{ display: "block", marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--egbe-green)", fontWeight: 600, textDecoration: "none" }}>
                Ver financeiro →
              </Link>
            </div>

            {/* Eventos */}
            <div className="card">
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>🎉 Eventos</h3>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0" }}>
                <span style={{ fontSize: "0.88rem", color: "#555" }}>Publicados</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f59e0b" }}>{stats.eventsPublished}</span>
              </div>
              <Link href="/dashboard/admin/eventos" style={{ display: "block", marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--egbe-green)", fontWeight: 600, textDecoration: "none" }}>
                Gerenciar eventos →
              </Link>
            </div>

            {/* Notificações */}
            <div className="card">
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>🔔 Notificações</h3>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0" }}>
                <span style={{ fontSize: "0.88rem", color: "#555" }}>Não lidas (sistema)</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: stats.unreadNotifs > 0 ? "var(--egbe-red)" : "#888" }}>{stats.unreadNotifs}</span>
              </div>
              <Link href="/dashboard/admin/notificacoes" style={{ display: "block", marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--egbe-green)", fontWeight: 600, textDecoration: "none" }}>
                Gerenciar notificações →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
