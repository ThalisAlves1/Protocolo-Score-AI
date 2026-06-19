import type { AnswerKey, GradingResult, StudentAnswer } from "./types";

function normalizeText(value: string | undefined | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function compareRiskLevel(studentAnswer: string, correctAnswer: string): boolean {
  const normalize = (text: string) => normalizeText(text);
  
  // Se forem exatamente iguais após normalização
  if (normalize(studentAnswer) === normalize(correctAnswer)) {
    return true;
  }
  
  // Extrai palavras-chave de risco (alto, baixo, medio, crítico, etc)
  const riskKeywords = ["alto", "baixo", "medio", "critico", "moderado", "grave", "leve"];
  const severityKeywords = ["risco", "perigo"];
  
  const getKeywords = (text: string): Set<string> => {
    const words = normalize(text).split(/\s+/);
    return new Set(words.filter(w => 
      riskKeywords.some(k => w.includes(k)) || 
      severityKeywords.some(k => w.includes(k))
    ));
  };
  
  const studentKeywords = getKeywords(studentAnswer);
  const correctKeywords = getKeywords(correctAnswer);
  
  // Se contém as mesmas palavras-chave relevantes, considera correto
  if (studentKeywords.size > 0 && 
      Array.from(studentKeywords).every(kw => Array.from(correctKeywords).some(ck => ck.includes(kw) || kw.includes(ck)))) {
    return true;
  }
  
  return false;
}

export function gradeAttempt(answerKey: AnswerKey, answer: StudentAnswer, expectedProtocol?: string): GradingResult {
  const items = answerKey.items.map((item) => {
    const rawStudentScore = answer.itemScores?.[item.key];
    const studentScore = Number.isFinite(Number(rawStudentScore)) ? Number(rawStudentScore) : null;
    return {
      key: item.key,
      label: item.label,
      studentScore,
      correctScore: item.correctScore,
      correct: studentScore === item.correctScore,
      explanation: item.explanation
    };
  });

  const protocolCorrect = expectedProtocol ? normalizeText(answer.protocol) === normalizeText(expectedProtocol) : true;
  const totalCorrect = Number(answer.totalScore) === Number(answerKey.totalScore);
  const riskCorrect = compareRiskLevel(answer.riskLevel, answerKey.riskLevel);

  const errors: string[] = [];
  const strengths: string[] = [];

  for (const item of items) {
    if (item.correct) {
      strengths.push(`Pontuou corretamente ${item.label}.`);
    } else {
      errors.push(`${item.label}: aluno marcou ${item.studentScore ?? "não informado"}, correto era ${item.correctScore}.`);
    }
  }

  if (totalCorrect) strengths.push("Calculou corretamente a pontuação total.");
  else errors.push(`Pontuação total: aluno marcou ${answer.totalScore}, correto era ${answerKey.totalScore}.`);

  if (riskCorrect) {
    strengths.push(`Classificação de risco: corretamente identificado como "${answerKey.riskLevel}".`);
  } else {
    errors.push(`Classificação de risco: aluno respondeu "${answer.riskLevel}", correto era "${answerKey.riskLevel}".`);
  }

  if (protocolCorrect) strengths.push("Identificou corretamente o protocolo do caso.");
  else errors.push(`Protocolo: aluno respondeu "${answer.protocol}", correto era "${expectedProtocol}".`);

  const maxScore = items.length + 3;
  const score = items.filter((item) => item.correct).length + (totalCorrect ? 1 : 0) + (riskCorrect ? 1 : 0) + (protocolCorrect ? 1 : 0);
  const percentage = Math.round((score / maxScore) * 100);

  return {
    protocolCorrect,
    totalCorrect,
    riskCorrect,
    items,
    errors,
    strengths,
    score,
    maxScore,
    percentage
  };
}
