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

const createCaseSchema = z.object({
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
  })
});

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ ok: false, message: "Acesso admin necessário." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCaseSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, message: "Caso inválido.", errors: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const { data, error } = await supabaseAdmin
    .from("clinical_cases")
    .insert({
      title: payload.title,
      protocol: payload.protocol,
      difficulty: payload.difficulty,
      stem: payload.stem,
      vital_signs: payload.vitalSigns,
      answer_key: payload.answerKey,
      active: true
    })
    .select("*")
    .single();

  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });

  return Response.json({ ok: true, case: mapClinicalCase(data as ClinicalCaseRow) }, { status: 201 });
}
