// ========================================
// app/dashboard/layout.js
// Layout do dashboard com sidebar dinâmica
// Permissões lidas do Firestore
// ========================================

"use client";

import { useAuth } from "@/lib/LAuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import Link from "next/link";
import FNotificationBell from "@/components/FNotificationBell";
import { FIXED_AREAS, ALL_AREAS, DEFAULT_PERMISSIONS } from "@/lib/LPermissions";

export default function DashboardLayout({ children }) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [rolePermissions, setRolePermissions] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const snap = await getDoc(doc(db, "config", "permissions"));
        setRolePermissions(snap.exists() ? snap.data() : DEFAULT_PERMISSIONS);
      } catch {
        setRolePermissions(DEFAULT_PERMISSIONS);
      }
    }
    if (user) loadPermissions();
  }, [user]);

  if (loading || !rolePermissions) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--egbe-green)" }}>
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  const role = profile?.role || "cliente";
  const allowedKeys = rolePermissions[role] || DEFAULT_PERMISSIONS[role] || [];
  const dynamicItems = ALL_AREAS.filter((area) => allowedKeys.includes(area.key));
  const visibleMenu = [...FIXED_AREAS, ...dynamicItems];

  // Agrupa por group para mostrar separadores
  let lastGroup = null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "var(--egbe-black)", color: "white", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 40 }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "var(--egbe-yellow)", textDecoration: "none" }}>
            Ẹgbẹ́ Fátọ́ún
          </Link>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginTop: "0.15rem" }}>Templo de Ìfá e Òrìṣà</p>
        </div>

        <nav style={{ flex: 1, padding: "0.5rem 0", overflowY: "auto" }}>
          {visibleMenu.map((item) => {
            const isActive = pathname === item.href;
            const group = item.group || null;
            let showSeparator = false;
            if (group && group !== lastGroup) {
              showSeparator = true;
              lastGroup = group;
            }

            return (
              <div key={item.key || item.href}>
                {showSeparator && (
                  <div style={{ padding: "0.75rem 1.5rem 0.4rem", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "0.3rem" }}>
                    {group}
                  </div>
                )}
                <Link href={item.href} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.55rem 1.5rem",
                  color: isActive ? "var(--egbe-yellow)" : "rgba(255,255,255,0.55)", textDecoration: "none",
                  fontSize: "0.85rem", fontWeight: isActive ? 600 : 400,
                  background: isActive ? "rgba(212,160,23,0.08)" : "transparent",
                  borderRight: isActive ? "3px solid var(--egbe-yellow)" : "3px solid transparent",
                  transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: "0.95rem", width: "20px", textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--egbe-green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
              {profile?.displayName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "white" }}>{profile?.displayName || "Usuário"}</p>
              <span className={`badge badge-${profile?.role || "cliente"}`}>{profile?.role || "cliente"}</span>
            </div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "0.5rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div style={{ marginLeft: "260px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header style={{ padding: "0.75rem 2rem", display: "flex", alignItems: "center", justifyContent: "flex-end", background: "white", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 30 }}>
          <FNotificationBell />
        </header>
        <main style={{ flex: 1, padding: "2rem", background: "#f8f9fa" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
