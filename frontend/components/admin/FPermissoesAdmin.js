// ========================================
// components/admin/FPermissoesAdmin.js
// [F = Frontend Component]
// Gestão de permissões por perfil
// Só o Técnico acessa
// ========================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/LAuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/LFirebase";
import { ALL_AREAS, DEFAULT_PERMISSIONS, ROLES } from "@/lib/LPermissions";

export default function FPermissoesAdmin({ embedded = false }) {
  const { profile } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isTecnico = profile?.role === "tecnico";
  const isAdmin = isTecnico || profile?.role === "sacerdote";

  useEffect(() => {
    if (!embedded && profile && !isTecnico) router.push("/dashboard");
  }, [embedded, profile, isTecnico, router]);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "config", "permissions"));
        if (snap.exists()) {
          setPermissions(snap.data());
        } else {
          setPermissions({ ...DEFAULT_PERMISSIONS });
        }
      } catch (err) {
        console.error("Erro ao carregar permissões:", err);
        setPermissions({ ...DEFAULT_PERMISSIONS });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function togglePermission(role, areaKey) {
    setPermissions((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(areaKey)
        ? current.filter((k) => k !== areaKey)
        : [...current, areaKey];
      return { ...prev, [role]: updated };
    });
    setSaved(false);
  }

  function selectAll(role) {
    setPermissions((prev) => ({
      ...prev,
      [role]: ALL_AREAS.map((a) => a.key),
    }));
    setSaved(false);
  }

  function clearAll(role) {
    setPermissions((prev) => ({ ...prev, [role]: [] }));
    setSaved(false);
  }

  function resetDefaults() {
    setPermissions({ ...DEFAULT_PERMISSIONS });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(doc(db, "config", "permissions"), permissions);
      setSaved(true);
    } catch (err) {
      console.error("Erro ao salvar permissões:", err);
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) return null;
  if (loading) return <p style={{ color: "#888" }}>Carregando permissões...</p>;

  const groups = [...new Set(ALL_AREAS.map((a) => a.group))];
  const editableRoles = ROLES.filter((r) => r.value !== "tecnico");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        {!embedded && (
          <div>
            <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Permissões por Perfil</h1>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Configure quais áreas cada perfil pode acessar</p>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#666", borderBottom: "1px solid #e5e7eb", fontSize: "0.8rem", position: "sticky", left: 0, background: "#f9fafb", minWidth: "200px" }}>
                Área
              </th>
              {editableRoles.map((role) => (
                <th key={role.value} style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: 600, borderBottom: "1px solid #e5e7eb", fontSize: "0.78rem", minWidth: "90px" }}>
                  <span className={`badge badge-${role.value}`}>{role.label}</span>
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.25rem", marginTop: "0.4rem" }}>
                    <button onClick={() => selectAll(role.value)} style={{ fontSize: "0.65rem", background: "none", border: "none", color: "var(--egbe-green)", cursor: "pointer", textDecoration: "underline" }}>tudo</button>
                    <button onClick={() => clearAll(role.value)} style={{ fontSize: "0.65rem", background: "none", border: "none", color: "#999", cursor: "pointer", textDecoration: "underline" }}>nada</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <>
                <tr key={`group-${group}`}>
                  <td colSpan={editableRoles.length + 1} style={{ padding: "0.6rem 1rem", background: "#f0f7f3", fontWeight: 700, fontSize: "0.78rem", color: "var(--egbe-green-dark)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {group}
                  </td>
                </tr>
                {ALL_AREAS.filter((a) => a.group === group).map((area) => (
                  <tr key={area.key} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.6rem 1rem", position: "sticky", left: 0, background: "white" }}>
                      <span style={{ marginRight: "0.5rem" }}>{area.icon}</span>
                      {area.label}
                    </td>
                    {editableRoles.map((role) => (
                      <td key={role.value} style={{ padding: "0.4rem", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={permissions[role.value]?.includes(area.key) || false}
                          onChange={() => togglePermission(role.value, area.key)}
                          style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: role.color }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe", fontSize: "0.82rem", color: "#1e40af" }}>
        O perfil <strong>Técnico</strong> sempre tem acesso a todas as áreas e não aparece na tabela. As alterações valem para os próximos logins dos usuários.
      </div>
    </div>
  );
}
