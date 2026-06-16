import { mapAttempt, type AttemptRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });
  if (!data) return Response.json({ ok: false, message: "Tentativa não encontrada." }, { status: 404 });

  return Response.json({ ok: true, attempt: mapAttempt(data as AttemptRow) });
}
