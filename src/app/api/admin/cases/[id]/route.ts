import { z } from "zod";
import { mapClinicalCase, type ClinicalCaseRow } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminRequest } from "@/lib/adminAuth";

const answerKeyItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  correctScore: z.coerce.number(),
  explanation: z.string().optional()
});

const updateCaseSchema = z.object({
  title: z.string().min(3),
  protocol: z.enum(["NEWS2", "MEOWS", "PEWS"]),
  difficulty: z.enum(["FACIL", "MEDIO", "DIFICIL"]).default("MEDIO"),
  stem: z.string().min(10),
  vitalSigns: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  answerKey: z.object({
    items: z.array(answerKeyItemSchema).min(1),
    totalScore: z.coerce.number(),
    riskLevel: z.string().min(1),
    expectedConduct: z.string().min(1),
    explanation: z.string().min(1)
  }),
  active: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isAdminRequest(request)) {
    return Response.json({ ok: false, message: "Acesso admin necessário." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateCaseSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, message: "Caso inválido.", errors: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const updateData: Record<string, unknown> = {
    title: payload.title,
    protocol: payload.protocol,
    difficulty: payload.difficulty,
    stem: payload.stem,
    vital_signs: payload.vitalSigns,
    answer_key: payload.answerKey
  };

  if (typeof payload.active === "boolean") {
    updateData.active = payload.active;
  }

  const { data, error } = await supabaseAdmin
    .from("clinical_cases")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });

  return Response.json({ ok: true, case: mapClinicalCase(data as ClinicalCaseRow) }, { status: 200 });
}

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
