import Link from "next/link";
import type { CaseForUi } from "@/lib/types";

export function CaseCard({
  clinicalCase,
  caseNumber
}: {
  clinicalCase: CaseForUi;
  caseNumber: number;
}) {
  return (
    <article className="card case-card-hidden">
      <div className="meta">
        <span className="badge">Caso disponível</span>
      </div>
      <h3>Caso {caseNumber}</h3>
      <p>Abra para visualizar o cenário clínico e responder ao teste.</p>
      <div className="actions">
        <Link className="btn btn-primary" href={`/teste/${clinicalCase.id}`}>Responder caso</Link>
      </div>
    </article>
  );
}
