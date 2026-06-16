import type { AnswerKey, GradingResult, Protocol, StudentAnswer, VitalSigns } from "@/lib/types";

type FeedbackEmailPayload = {
  to: string;
  studentName?: string | null;
  caseTitle: string;
  protocol: Protocol;
  stem: string;
  vitalSigns: VitalSigns;
  answerKey: AnswerKey;
  studentAnswer: StudentAnswer;
  grading: GradingResult;
  feedback: string;
  resultUrl?: string;
};

type EmailSendResult =
  | { sent: true; provider: "resend"; id?: string }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; skipped: false; reason: string };

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatVitalSigns(vitalSigns: VitalSigns) {
  return Object.entries(vitalSigns)
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`)
    .join("");
}

function formatGradingRows(grading: GradingResult) {
  return grading.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${escapeHtml(item.studentScore ?? "Não informado")}</td>
          <td>${escapeHtml(item.correctScore)}</td>
          <td>${item.correct ? "Acertou" : "Errou"}</td>
        </tr>`
    )
    .join("");
}

function buildFeedbackEmailHtml(payload: FeedbackEmailPayload) {
  const student = payload.studentName?.trim() || "Aluno(a)";
  const resultLink = payload.resultUrl
    ? `<p><a href="${escapeHtml(payload.resultUrl)}" style="color:#2563eb; font-weight:700;">Abrir resultado completo</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif; line-height:1.55; color:#111827; max-width:760px; margin:0 auto; padding:24px;">
      <h1 style="margin-bottom:6px;">Feedback do teste clínico</h1>
      <p style="margin-top:0; color:#4b5563;">Olá, ${escapeHtml(student)}. Segue o resultado da sua tentativa.</p>

      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:14px; padding:18px; margin:18px 0;">
        <p><strong>Caso:</strong> ${escapeHtml(payload.caseTitle)}</p>
        <p><strong>Protocolo:</strong> ${escapeHtml(payload.protocol)}</p>
        <p><strong>Nota objetiva:</strong> ${payload.grading.score}/${payload.grading.maxScore} — ${payload.grading.percentage}%</p>
        <p><strong>Classificação correta:</strong> ${escapeHtml(payload.answerKey.riskLevel)}</p>
      </div>

      <h2>Resumo do caso</h2>
      <p>${escapeHtml(payload.stem)}</p>
      <ul>${formatVitalSigns(payload.vitalSigns)}</ul>

      <h2>Comparação da resposta</h2>
      <table style="border-collapse:collapse; width:100%; margin:12px 0;">
        <thead>
          <tr>
            <th style="text-align:left; border-bottom:1px solid #d1d5db; padding:8px;">Item</th>
            <th style="text-align:left; border-bottom:1px solid #d1d5db; padding:8px;">Aluno</th>
            <th style="text-align:left; border-bottom:1px solid #d1d5db; padding:8px;">Correto</th>
            <th style="text-align:left; border-bottom:1px solid #d1d5db; padding:8px;">Status</th>
          </tr>
        </thead>
        <tbody>${formatGradingRows(payload.grading)}</tbody>
      </table>

      <h2>Feedback educacional</h2>
      <div style="white-space:pre-wrap; background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:18px;">${escapeHtml(payload.feedback)}</div>

      <h2>Gabarito</h2>
      <p><strong>Total correto:</strong> ${escapeHtml(payload.answerKey.totalScore)}</p>
      <p><strong>Conduta esperada:</strong> ${escapeHtml(payload.answerKey.expectedConduct)}</p>
      <p>${escapeHtml(payload.answerKey.explanation)}</p>

      ${resultLink}

      <p style="font-size:13px; color:#6b7280; margin-top:28px;">
        Este feedback é exclusivamente educacional e não substitui avaliação clínica, protocolos institucionais ou decisão de profissional habilitado.
      </p>
    </div>
  `;
}

function buildFeedbackEmailText(payload: FeedbackEmailPayload) {
  const student = payload.studentName?.trim() || "Aluno(a)";
  const vitalSignsText = Object.entries(payload.vitalSigns)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
  const gradingText = payload.grading.items
    .map((item) => `- ${item.label}: aluno ${item.studentScore ?? "não informado"}, correto ${item.correctScore} (${item.correct ? "acertou" : "errou"})`)
    .join("\n");

  return `Feedback do teste clínico\n\nOlá, ${student}.\n\nCaso: ${payload.caseTitle}\nProtocolo: ${payload.protocol}\nNota objetiva: ${payload.grading.score}/${payload.grading.maxScore} — ${payload.grading.percentage}%\nClassificação correta: ${payload.answerKey.riskLevel}\n\nResumo do caso:\n${payload.stem}\n\nDados vitais:\n${vitalSignsText}\n\nComparação da resposta:\n${gradingText}\n\nFeedback educacional:\n${payload.feedback}\n\nGabarito:\nTotal correto: ${payload.answerKey.totalScore}\nConduta esperada: ${payload.answerKey.expectedConduct}\n${payload.answerKey.explanation}\n\n${payload.resultUrl ? `Resultado completo: ${payload.resultUrl}\n\n` : ""}Uso exclusivamente educacional. Não substitui avaliação clínica, protocolos institucionais ou decisão de profissional habilitado.`;
}

export async function sendFeedbackEmail(payload: FeedbackEmailPayload): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.FEEDBACK_EMAIL_FROM?.trim();
  const replyTo = process.env.FEEDBACK_EMAIL_REPLY_TO?.trim();

  if (!payload.to?.trim()) {
    return { sent: false, skipped: true, reason: "Aluno não informou e-mail." };
  }

  if (!apiKey || !from) {
    return { sent: false, skipped: true, reason: "RESEND_API_KEY ou FEEDBACK_EMAIL_FROM não configurado." };
  }

  const subject = `Feedback do teste: ${payload.caseTitle}`;
  const html = buildFeedbackEmailHtml(payload);
  const text = buildFeedbackEmailText(payload);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [payload.to.trim()],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.error?.message || `Erro HTTP ${response.status}`;
    return { sent: false, skipped: false, reason: message };
  }

  return { sent: true, provider: "resend", id: data?.id };
}
