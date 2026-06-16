import { z } from "zod";
import { generateAiFeedback } from "@/lib/aiFeedback";
import { mapClinicalCase, mapAttempt, type AttemptRow, type ClinicalCaseRow } from "@/lib/db";
import { gradeAttempt } from "@/lib/grading";
import { sendFeedbackEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { StudentAnswer } from "@/lib/types";

const attemptSchema = z.object({
  caseId: z.string().min(1),
  studentId: z.string().optional().nullable(),
  studentName: z.string().optional().nullable(),
  studentEmail: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed.toLowerCase();
    },
    z.string().email("E-mail inválido.").nullable().optional()
  ),
  answer: z.object({
    protocol: z.enum(["NEWS2", "MEOWS", "PEWS"]),
    itemScores: z.record(z.coerce.number()),
    totalScore: z.coerce.number(),
    riskLevel: z.string().min(1),
    conduct: z.string().optional().default(""),
    reasoning: z.string().optional().default("")
  })
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = attemptSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { data: caseData, error: caseError } = await supabaseAdmin
    .from("clinical_cases")
    .select("*")
    .eq("id", parsed.data.caseId)
    .eq("active", true)
    .maybeSingle();

  if (caseError) return Response.json({ ok: false, message: caseError.message }, { status: 500 });
  if (!caseData) {
    return Response.json({ ok: false, message: "Caso clínico não encontrado ou inativo." }, { status: 404 });
  }

  const clinicalCase = mapClinicalCase(caseData as ClinicalCaseRow);
  const answerKey = clinicalCase.answerKey;
  const studentAnswer = parsed.data.answer as StudentAnswer;
  const grading = gradeAttempt(answerKey, studentAnswer, clinicalCase.protocol);

  const feedback = await generateAiFeedback({
    caseTitle: clinicalCase.title,
    protocol: clinicalCase.protocol,
    stem: clinicalCase.stem,
    vitalSigns: clinicalCase.vitalSigns,
    answerKey,
    studentAnswer,
    grading
  });

  const studentEmail = parsed.data.studentEmail || null;

  const { data: attemptData, error: attemptError } = await supabaseAdmin
    .from("attempts")
    .insert({
      student_id: parsed.data.studentId || null,
      student_name: parsed.data.studentName || null,
      case_id: clinicalCase.id,
      answer: studentAnswer,
      grading,
      total_score: grading.score,
      max_score: grading.maxScore,
      feedback
    })
    .select("*")
    .single();

  if (attemptError) return Response.json({ ok: false, message: attemptError.message }, { status: 500 });

  const attempt = mapAttempt(attemptData as AttemptRow);

  const emailResult = await sendFeedbackEmail({
    to: studentEmail || "",
    studentName: parsed.data.studentName,
    caseTitle: clinicalCase.title,
    protocol: clinicalCase.protocol,
    stem: clinicalCase.stem,
    vitalSigns: clinicalCase.vitalSigns,
    answerKey,
    studentAnswer,
    grading,
    feedback,
    resultUrl: new URL(`/resultado/${attempt.id}`, request.url).toString()
  }).catch((error) => {
    console.error("Erro ao enviar e-mail de feedback:", error);
    return { sent: false, skipped: false, reason: error instanceof Error ? error.message : "Erro inesperado." };
  });

  return Response.json({ ok: true, attemptId: attempt.id, grading, feedback, email: emailResult });
}
