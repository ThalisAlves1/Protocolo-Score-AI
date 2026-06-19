import type { AnswerKey, GradingResult, StudentAnswer } from "./types";

function fallbackFeedback(grading: GradingResult, answerKey: AnswerKey) {
  const mainErrors = grading.errors.length
    ? grading.errors.map((error) => `- ${error}`).join("\n")
    : "- Nenhum erro objetivo encontrado.";

  return [
    `Resultado: ${grading.score}/${grading.maxScore} (${grading.percentage}%).`,
    "",
    "Pontos que precisam de atenção:",
    mainErrors,
    "",
    grading.strengths.length > 0 ? "Acertos:\n" + grading.strengths.map((s) => `- ${s}`).join("\n") : "",
    "",
    `Conduta esperada conforme o protocolo:`,
    answerKey.expectedConduct,
    "",
    `Explicação clínica:`,
    answerKey.explanation,
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

IMPORTANTE: Você NUNCA deve contar ou avaliar "Conduta proposta" e "Justificativa do raciocínio" como critérios de pontuação.
Apenas corrija os itens OBJETIVOS:
- Pontuação de cada parâmetro vital
- Pontuação total
- Classificação de risco
- Protocolo identificado

Gere feedback educacional, claro, respeitoso e prático.

SOBRE A CLASSIFICAÇÃO DE RISCO:
- Se o aluno respondeu com as palavras-chave certas mas em ordem diferente (ex: "Alto risco" vs "Risco alto"), considere como acerto
- Mas SEMPRE frize qual é o formato CORRETO esperado: "${params.answerKey.riskLevel}"
- Coloque em destaque o padrão correto usando ASTERISCOS: *Risco alto* ou **Risco alto**
- Isso é educacional, não punitivo

Inclua: acertos, erros objetivos, por que os erros importam, conduta esperada conforme protocolo e conceitos a revisar.
Não recalcule a pontuação. A nota já foi calculada pelo sistema.
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
    user,
    "",
    "LEMBRETE: Se a classificação de risco estiver marcada como ACERTO no objeto 'correcaoObjetiva',",
    "frize o padrão correto em negrito: **" + params.answerKey.riskLevel + "** é o formato esperado.",
    "Seja educacional e positivo ao reforçar os padrões corretos."
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
