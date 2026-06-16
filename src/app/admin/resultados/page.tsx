import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { mapAttempt, type AttemptRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminSession } from "@/lib/adminAuth";

export const revalidate = 0;

export default async function AdminResultsPage() {
  if (!(await isAdminSession())) redirect("/admin");

  const { data: attemptData, error: attemptError } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .order("created_at", { ascending: false });

  if (attemptError) throw new Error(attemptError.message);

  const attempts = (attemptData as AttemptRow[]).map(mapAttempt);

  const { data: caseData } = await supabaseAdmin
    .from("clinical_cases")
    .select("id, title");

  const cases = (caseData || []) as Array<{ id: string; title: string }>;

  return (
    <>
      <AdminNav currentPage="resultados" />
      <main className="container" style={{ padding: "34px 0 60px" }}>
        <section className="admin-title-row">
          <div>
            <div className="kicker">Administração</div>
            <h1>Dashboard de resultados</h1>
            <p>Visualize o desempenho dos alunos e revise as respostas de cada tentativa.</p>
          </div>
        </section>

        <div style={{ marginTop: 32 }}>
          <ResultsDashboard attempts={attempts} cases={cases} />
        </div>
      </main>
    </>
  );
}
