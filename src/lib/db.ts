import type { AnswerKey, CaseForUi, Difficulty, GradingResult, Protocol, StudentAnswer, VitalSigns } from "@/lib/types";

export type ClinicalCaseRow = {
  id: string;
  title: string;
  protocol: Protocol;
  difficulty: Difficulty;
  stem: string;
  vital_signs: VitalSigns;
  answer_key: AnswerKey;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type AttemptRow = {
  id: string;
  student_id: string | null;
  student_name: string | null;
  case_id: string;
  answer: StudentAnswer;
  grading: GradingResult;
  total_score: number;
  max_score: number;
  feedback: string;
  created_at: string;
};

export type AttemptForUi = {
  id: string;
  studentId: string | null;
  studentName: string | null;
  caseId: string;
  answer: StudentAnswer;
  grading: GradingResult;
  totalScore: number;
  maxScore: number;
  feedback: string;
  createdAt: string;
};

export function mapClinicalCase(row: ClinicalCaseRow): CaseForUi & { active: boolean; createdAt: string; updatedAt: string } {
  return {
    id: row.id,
    title: row.title,
    protocol: row.protocol,
    difficulty: row.difficulty,
    stem: row.stem,
    vitalSigns: row.vital_signs,
    answerKey: row.answer_key,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapAttempt(row: AttemptRow): AttemptForUi {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    caseId: row.case_id,
    answer: row.answer,
    grading: row.grading,
    totalScore: row.total_score,
    maxScore: row.max_score,
    feedback: row.feedback,
    createdAt: row.created_at
  };
}
