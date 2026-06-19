import { notFound } from "next/navigation";
import { TestForm } from "@/components/TestForm";
import { PrintCaseButton } from "@/components/PrintCaseButton";
import { mapClinicalCase, type ClinicalCaseRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("clinical_cases")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) notFound();

  const uiCase = mapClinicalCase(data as ClinicalCaseRow);

  return (
    <main className="container" style={{ padding: "34px 0 60px" }}>
      <div className="hero-grid" style={{ alignItems: "start" }}>
        <section className="card">
          <div className="meta">
            <span className="badge">{uiCase.protocol}</span>
            <span className="badge badge-yellow">{uiCase.difficulty}</span>
          </div>
          <h1 style={{ fontSize: 36 }}>{uiCase.title}</h1>
          <p>{uiCase.stem}</p>
          <h3>Sinais vitais e dados do caso</h3>
          <div className="vitals">
            {Object.entries(uiCase.vitalSigns).map(([key, value]) => (
              <div className="vital" key={key}>
                <strong>{key}</strong>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
          <PrintCaseButton clinicalCase={uiCase} />
        </section>
        <TestForm clinicalCase={uiCase} />
      </div>
    </main>
  );
}
