import { CaseCard } from "@/components/CaseCard";
import { mapClinicalCase, type ClinicalCaseRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function CasesPage() {
  const { data, error } = await supabaseAdmin
    .from("clinical_cases")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const cases = (data as ClinicalCaseRow[]).map(mapClinicalCase);

  return (
    <main className="container">
      <section style={{ paddingTop: 34 }}>
        <div className="kicker">Banco de casos</div>
        <h1>Escolha um caso para responder</h1>
        <p>Os cards não antecipam o conteúdo do caso. Abra um teste para visualizar o cenário clínico completo.</p>
      </section>

      <section className="case-grid">
        {cases.map((clinicalCase, index) => (
          <CaseCard key={clinicalCase.id} clinicalCase={clinicalCase} caseNumber={index + 1} />
        ))}
      </section>
    </main>
  );
}
