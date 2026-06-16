import type { AnswerKey, GradingResult, StudentAnswer } from "./types";

function fallbackFeedback(grading: GradingResult, answerKey: AnswerKey) {
  const mainErrors = grading.errors.length
    ? grading.errors.map((error) => `- ${error}`).join("\n")
    : "- Nenhum erro objetivo encontrado nos campos pontuados.";

  return [
    `Resultado: ${grading.score}/${grading.maxScore} (${grading.percentage}%).`,
    "",
    "Pontos que precisam de atenção:",
    mainErrors,
    "",
    `Conduta esperada: ${answerKey.expectedConduct}`,
    "",
    `Comentário do gabarito: ${answerKey.explanation}`,
    "",
    "Este feedback é educacional e não substitui avaliação clínica real."
  ].join("\n");
}

function extractGeminiText(data: unknown): string | null {
  const anyData = data as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const text = anyData.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter((partText): partText is string => typeof partText === "string" && partText.trim().length > 0)
    .join("\n")
    .trim();

  return text || null;
}

export async function generateAiFeedback(params: {
  caseTitle: string;
  protocol: string;
  stem: string;
  vitalSigns: unknown;
  answerKey: AnswerKey;
  studentAnswer: StudentAnswer;
  grading: GradingResult;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) return fallbackFeedback(params.grading, params.answerKey);

  const system = `Você é um tutor de enfermagem e simulação clínica.
Use apenas os dados enviados. Não recalcule pontuação por conta própria.
A pontuação correta já foi calculada pelo sistema por gabarito.
Gere feedback educacional, claro, respeitoso e prático.
Inclua: acertos, erros, por que os erros importam, conduta esperada e o que revisar.
Não dê diagnóstico definitivo. Não diga que substitui avaliação profissional.
Responda em português do Brasil.`;

  const user = JSON.stringify(
    {
      caso: {
        titulo: params.caseTitle,
        protocolo: params.protocol,
        enunciado: params.stem,
        sinaisVitais: params.vitalSigns
      },
      gabarito: params.answerKey,
      respostaDoAluno: params.studentAnswer,
      correcaoObjetiva: params.grading
    },
    null,
    2
  );

  const prompt = [
    "INSTRUÇÕES DO TUTOR:",
    system,
    "",
    "DADOS PARA GERAR O FEEDBACK:",
    user
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    }
  );

  if (!response.ok) {
    console.error("Gemini feedback error", await response.text());
    return fallbackFeedback(params.grading, params.answerKey);
  }

  const data = await response.json();
  return extractGeminiText(data) ?? fallbackFeedback(params.grading, params.answerKey);
}
