import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { AdminCaseForm } from "@/components/AdminCaseForm";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { mapClinicalCase, type ClinicalCaseRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminSession } from "@/lib/adminAuth";

export const revalidate = 0;

export default async function AdminCasesPage() {
  if (!(await isAdminSession())) redirect("/admin");

  const { data, error } = await supabaseAdmin
    .from("clinical_cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  const cases = (data as ClinicalCaseRow[]).map(mapClinicalCase);

  return (
    <>
      <AdminNav currentPage="casos" />
      <main className="container" style={{ padding: "34px 0 60px" }}>
        <section className="admin-title-row">
          <div>
            <div className="kicker">Administração</div>
            <h1>Cadastrar e revisar casos clínicos</h1>
            <p>Use esta área para transformar seus casos prontos em gabaritos estruturados para correção automática.</p>
          </div>
        </section>

        <div className="hero-grid" style={{ alignItems: "start" }}>
          <AdminCaseForm cases={cases} />
        </div>
      </main>
    </>
  );
}
