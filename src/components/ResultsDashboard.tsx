"use client";

import { useMemo, useState } from "react";
import type { AttemptForUi } from "@/lib/db";

type ResultsDashboardProps = {
  attempts: AttemptForUi[];
  cases: Array<{ id: string; title: string }>;
};

export function ResultsDashboard({ attempts, cases }: ResultsDashboardProps) {
  const [searchName, setSearchName] = useState("");
  const [filterCaseId, setFilterCaseId] = useState("");
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = attempts.length;
    const avgScore = total > 0 ? attempts.reduce((sum, a) => sum + a.totalScore, 0) / total : 0;
    const avgPercentage = total > 0 ? attempts.reduce((sum, a) => sum + a.grading.percentage, 0) / total : 0;
    const passed = attempts.filter((a) => a.grading.percentage >= 70).length;
    return { total, avgScore: avgScore.toFixed(1), avgPercentage: avgPercentage.toFixed(1), passed };
  }, [attempts]);

  const filtered = useMemo(() => {
    return attempts.filter((attempt) => {
      const matchName = !searchName || (attempt.studentName || "").toLowerCase().includes(searchName.toLowerCase());
      const matchCase = !filterCaseId || attempt.caseId === filterCaseId;
      return matchName && matchCase;
    });
  }, [attempts, searchName, filterCaseId]);

  const getCaseTitle = (caseId: string) => {
    return cases.find((c) => c.id === caseId)?.title || "Caso desconhecido";
  };

  return (
    <div className="card">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 16, background: "#f0f9ff", borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: "#4b5563" }}>Total de tentativas</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.total}</div>
        </div>
        <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: "#4b5563" }}>Média de desempenho</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.avgPercentage}%</div>
        </div>
        <div style={{ padding: 16, background: "#fef3c7", borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: "#4b5563" }}>Média de pontos</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.avgScore}</div>
        </div>
        <div style={{ padding: 16, background: "#fce7f3", borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: "#4b5563" }}>Aprovados (≥70%)</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.passed}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
        <div className="field">
          <label>Filtrar por aluno</label>
          <input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Digite o nome do aluno" />
        </div>
        <div className="field">
          <label>Filtrar por caso</label>
          <select value={filterCaseId} onChange={(e) => setFilterCaseId(e.target.value)}>
            <option value="">-- Todos os casos --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginBottom: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Caso</th>
              <th>Nota</th>
              <th>Desempenho</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}>
                  Nenhuma tentativa encontrada
                </td>
              </tr>
            ) : (
              filtered.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.studentName || "Sem nome"}</td>
                  <td>{getCaseTitle(attempt.caseId)}</td>
                  <td>
                    {attempt.totalScore}/{attempt.maxScore}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background: attempt.grading.percentage >= 70 ? "#d1fae5" : "#fee2e2",
                        color: attempt.grading.percentage >= 70 ? "#065f46" : "#991b1b"
                      }}
                    >
                      {attempt.grading.percentage}%
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{new Date(attempt.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setExpandedAttemptId(expandedAttemptId === attempt.id ? null : attempt.id)}
                      style={{ fontSize: 12, padding: "6px 12px" }}
                    >
                      {expandedAttemptId === attempt.id ? "Fechar" : "Detalhes"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {expandedAttemptId && (
        <div style={{ marginTop: 24, padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
          {(() => {
            const attempt = filtered.find((a) => a.id === expandedAttemptId);
            if (!attempt) return null;

            return (
              <div>
                <h3 style={{ marginTop: 0 }}>
                  Detalhes da tentativa - {attempt.studentName || "Sem nome"}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <strong>Caso:</strong>
                    <div>{getCaseTitle(attempt.caseId)}</div>
                  </div>
                  <div>
                    <strong>Data:</strong>
                    <div>{new Date(attempt.createdAt).toLocaleString("pt-BR")}</div>
                  </div>
                  <div>
                    <strong>Protocolo escolhido:</strong>
                    <div>{attempt.answer.protocol}</div>
                  </div>
                  <div>
                    <strong>Desempenho:</strong>
                    <div>
                      {attempt.totalScore}/{attempt.maxScore} ({attempt.grading.percentage}%)
                    </div>
                  </div>
                </div>

                <h4>Pontuação por item</h4>
                <table className="table" style={{ fontSize: 13, marginBottom: 20 }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Aluno</th>
                      <th>Correto</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempt.grading.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.label}</td>
                        <td>{item.studentScore ?? "Não informado"}</td>
                        <td>{item.correctScore}</td>
                        <td>
                          <span style={{ color: item.correct ? "#059669" : "#dc2626", fontWeight: 600 }}>
                            {item.correct ? "✓ Acertou" : "✗ Errou"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4>Feedback educacional</h4>
                <div style={{ background: "white", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6 }}>
                  {attempt.feedback}
                </div>

                <h4 style={{ marginTop: 20 }}>Respostas do aluno</h4>
                <div style={{ background: "white", padding: 12, borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
                  <p>
                    <strong>Risco:</strong> {attempt.answer.riskLevel}
                  </p>
                  <p>
                    <strong>Conduta:</strong> {attempt.answer.conduct || "Não informada"}
                  </p>
                  <p>
                    <strong>Raciocínio:</strong> {attempt.answer.reasoning || "Não informado"}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
