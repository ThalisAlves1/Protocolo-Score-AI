"use client";

import { useState } from "react";

export function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin";
    }
  }

  return (
    <button className="btn btn-ghost" type="button" onClick={logout} disabled={loading}>
      {loading ? "Saindo..." : "Sair do admin"}
    </button>
  );
}
