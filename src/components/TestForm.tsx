"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseForUi, Protocol, StudentAnswer } from "@/lib/types";

export function TestForm({ clinicalCase }: { clinicalCase: CaseForUi }) {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [protocol, setProtocol] = useState<Protocol | "">();
  const [itemScores, setItemScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState("");
  const [conduct, setConduct] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const suggestedTotal = useMemo(
    () => Object.values(itemScores).reduce((sum, value) => sum + (Number.isFinite(Number(value)) ? Number(value) : 0), 0),
    [itemScores]
  );

  async function submit() {
    setError("");
    setSubmitting(true);

    if (!protocol) {
      setError("Por favor, selecione um protocolo.");
      setSubmitting(false);
      return;
    }

    const answer: StudentAnswer = {
      protocol: protocol as Protocol,
      itemScores,
      totalScore: Number(totalScore),
      riskLevel,
      conduct,
      reasoning
    };

    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: clinicalCase.id, studentName, studentEmail, answer })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erro ao enviar tentativa.");
      router.push(`/resultado/${data.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Responder caso</h2>
      <div className="form">
        <div className="field">
          <label>Nome do aluno</label>
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Ex.: Ana Souza" />
        </div>

        <div className="field">
          <label>E-mail para receber o feedback</label>
          <input
            type="email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            placeholder="Ex.: aluno@email.com"
          />
          <small style={{ color: "var(--muted)" }}>Se preenchido, o feedback será enviado automaticamente por e-mail após a correção.</small>
        </div>

        <div className="field">
          <label>Protocolo usado</label>
          <select value={protocol ?? ""} onChange={(e) => setProtocol(e.target.value as Protocol)}>
            <option value="">-- Selecione o protocolo --</option>
            <option value="NEWS2">NEWS2</option>
            <option value="MEOWS">MEOWS</option>
            <option value="PEWS">PEWS/PEOWS</option>
          </select>
        </div>

        <div>
          <h3>Pontuação por parâmetro</h3>
          <p>Preencha a pontuação que você atribuiu para cada item do protocolo.</p>
          <div className="form">
            {clinicalCase.answerKey.items.map((item) => (
              <div className="score-row" key={item.key}>
                <div className="field">
                  <label>{item.label}</label>
                  <small style={{ color: "var(--muted)" }}>{item.explanation || "Item do protocolo."}</small>
                </div>
                <input
                  value={itemScores[item.key] ?? ""}
                  onChange={(e) => setItemScores((prev) => ({ ...prev, [item.key]: Number(e.target.value) || 0 }))}
                  placeholder="Ex.: 3"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="alert">Soma dos itens preenchidos: <strong>{suggestedTotal}</strong></div>

        <div className="field">
          <label>Pontuação total informada pelo aluno</label>
          <input value={totalScore === 0 ? "" : totalScore} onChange={(e) => setTotalScore(Number(e.target.value) || 0)} placeholder="Ex.: 17" />
        </div>

        <div className="field">
          <label>Classificação de risco</label>
          <input value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} placeholder="Ex.: alto risco" />
        </div>

        <div className="field">
          <label>Conduta proposta</label>
          <textarea value={conduct} onChange={(e) => setConduct(e.target.value)} placeholder="Descreva o que você faria." />
        </div>

        <div className="field">
          <label>Justificativa do raciocínio</label>
          <textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="Explique seu raciocínio clínico." />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <button className="btn btn-primary" onClick={submit} disabled={submitting}>
          {submitting ? "Corrigindo..." : "Enviar e receber feedback"}
        </button>
      </div>
    </div>
  );
}
