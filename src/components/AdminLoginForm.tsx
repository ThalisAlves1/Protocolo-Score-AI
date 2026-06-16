"use client";

import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Senha inválida.");
        return;
      }

      window.location.href = "/admin/casos";
    } catch {
      setMessage("Não foi possível entrar no admin. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Acesso do administrador</h2>
      <div className="field">
        <label htmlFor="admin-password">Senha do admin</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Digite a senha"
          autoComplete="current-password"
          required
        />
      </div>
      {message && <div className="alert alert-danger">{message}</div>}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <p className="small-text">
        Este login é uma proteção simples para o MVP. Para versão comercial, o ideal é usar Supabase Auth com perfis de aluno,
        professor e administrador.
      </p>
    </form>
  );
}
