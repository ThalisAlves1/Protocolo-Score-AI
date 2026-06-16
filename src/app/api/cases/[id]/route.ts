import { mapClinicalCase, type ClinicalCaseRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("clinical_cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });
  if (!data) return Response.json({ ok: false, message: "Caso não encontrado." }, { status: 404 });

  return Response.json({ ok: true, case: mapClinicalCase(data as ClinicalCaseRow) });
}
