import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function HomePage() {
  const [{ count: totalCases }, { count: totalAttempts }] = await Promise.all([
    supabaseAdmin.from("clinical_cases").select("id", { count: "exact", head: true }).eq("active", true),
    supabaseAdmin.from("attempts").select("id", { count: "exact", head: true })
  ]);

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="card">
            <div className="kicker">Simulação clínica com correção objetiva</div>
            <h1>Treine NEWS2, MEOWS e PEWS com casos clínicos e feedback por IA.</h1>
            <p>
              O aluno responde ao caso, o sistema compara com o gabarito e a IA gera um feedback didático sobre erros,
              acertos, risco e pontos de melhoria.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/casos">Começar teste</Link>
              <Link className="btn btn-secondary" href="/admin">Cadastrar casos</Link>
            </div>
          </div>
          <div className="card">
            <h2>Visão do MVP</h2>
            <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="alert"><strong>{totalCases ?? 0}</strong><br />casos ativos cadastrados</div>
              <div className="alert"><strong>{totalAttempts ?? 0}</strong><br />tentativas registradas</div>
              <div className="alert"><strong>IA + gabarito</strong><br />feedback sem depender de cálculo inventado</div>
            </div>
          </div>
        </div>
      </section>
      <section className="container grid" style={{ paddingBottom: 60 }}>
        <div className="card"><h3>1. Caso clínico</h3><p>O aluno visualiza sinais vitais, contexto e protocolo esperado.</p></div>
        <div className="card"><h3>2. Correção</h3><p>O motor de regras compara item por item com o gabarito estruturado.</p></div>
        <div className="card"><h3>3. Feedback IA</h3><p>A IA explica os erros em linguagem educacional e orienta revisão.</p></div>
      </section>
    </main>
  );
}
