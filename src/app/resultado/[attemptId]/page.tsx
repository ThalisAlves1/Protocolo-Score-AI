import Link from "next/link";
import { notFound } from "next/navigation";
import { mapAttempt, mapClinicalCase, type AttemptRow, type ClinicalCaseRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  const { data: attemptData, error: attemptError } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptError) throw new Error(attemptError.message);
  if (!attemptData) notFound();

  const attempt = mapAttempt(attemptData as AttemptRow);

  const { data: caseData, error: caseError } = await supabaseAdmin
    .from("clinical_cases")
    .select("*")
    .eq("id", attempt.caseId)
    .maybeSingle();

  if (caseError) throw new Error(caseError.message);
  if (!caseData) notFound();

  const clinicalCase = mapClinicalCase(caseData as ClinicalCaseRow);
  const grading = attempt.grading;
  const answer = attempt.answer;
  const answerKey = clinicalCase.answerKey;

  return (
    <main className="container" style={{ padding: "34px 0 60px" }}>
      <section className="card">
        <div className="kicker">Resultado</div>
        <h1 style={{ fontSize: 40 }}>{clinicalCase.title}</h1>
        <div className="meta">
          <span className="badge">{clinicalCase.protocol}</span>
          <span className="badge badge-yellow">{attempt.studentName || "Aluno sem nome"}</span>
        </div>
        <div className={grading.percentage >= 70 ? "alert alert-success" : "alert alert-danger"}>
          Nota objetiva: <strong>{grading.score}/{grading.maxScore}</strong> — {grading.percentage}%
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 18 }}>
        <div className="card">
          <h2>Resposta do aluno</h2>
          <p><strong>Protocolo:</strong> {answer.protocol}</p>
          <p><strong>Total:</strong> {answer.totalScore}</p>
          <p><strong>Risco:</strong> {answer.riskLevel}</p>
          <p><strong>Conduta:</strong> {answer.conduct}</p>
        </div>
        <div className="card">
          <h2>Gabarito</h2>
          <p><strong>Protocolo:</strong> {clinicalCase.protocol}</p>
          <p><strong>Total:</strong> {answerKey.totalScore}</p>
          <p><strong>Risco:</strong> {answerKey.riskLevel}</p>
          <p><strong>Conduta:</strong> {answerKey.expectedConduct}</p>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Correção por parâmetro</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Aluno</th>
              <th>Correto</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {grading.items.map((item) => (
              <tr key={item.key}>
                <td>{item.label}</td>
                <td>{item.studentScore ?? "Não informado"}</td>
                <td>{item.correctScore}</td>
                <td>{item.correct ? "Acertou" : "Errou"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Feedback da IA</h2>
        <pre>{attempt.feedback}</pre>
      </section>

      <div className="actions">
        <Link className="btn btn-secondary" href="/casos">Responder outro caso</Link>
      </div>
    </main>
  );
}
