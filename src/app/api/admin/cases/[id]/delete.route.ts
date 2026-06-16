import { isAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isAdminRequest(request)) {
    return Response.json({ ok: false, message: "Acesso admin necessário." }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("clinical_cases")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });

  return Response.json({ ok: true, message: "Caso deletado com sucesso." }, { status: 200 });
}
