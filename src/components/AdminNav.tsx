"use client";

import Link from "next/link";
import { AdminLogoutButton } from "./AdminLogoutButton";

type AdminNavProps = {
  currentPage?: "casos" | "resultados";
};

export function AdminNav({ currentPage }: AdminNavProps) {
  return (
    <nav style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb", padding: "16px 0", marginBottom: 32 }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/admin/casos" style={{ textDecoration: "none" }}>
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontWeight: currentPage === "casos" ? 600 : 400,
                  color: currentPage === "casos" ? "#2563eb" : "#6b7280",
                  background: currentPage === "casos" ? "#dbeafe" : "transparent"
                }}
              >
                Casos
              </span>
            </Link>
            <Link href="/admin/resultados" style={{ textDecoration: "none" }}>
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontWeight: currentPage === "resultados" ? 600 : 400,
                  color: currentPage === "resultados" ? "#2563eb" : "#6b7280",
                  background: currentPage === "resultados" ? "#dbeafe" : "transparent"
                }}
              >
                Resultados
              </span>
            </Link>
          </div>
          <AdminLogoutButton />
        </div>
      </div>
    </nav>
  );
}
