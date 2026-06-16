import { mapClinicalCase, type ClinicalCaseRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("clinical_cases")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ ok: false, message: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, cases: (data as ClinicalCaseRow[]).map(mapClinicalCase) });
}
