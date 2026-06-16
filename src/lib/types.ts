export type Protocol = "NEWS2" | "MEOWS" | "PEWS";
export type Difficulty = "FACIL" | "MEDIO" | "DIFICIL";

export type ScoreItemKey = string;

export type VitalSigns = Record<string, string | number | boolean | null>;

export type AnswerKeyItem = {
  key: ScoreItemKey;
  label: string;
  correctScore: number;
  explanation?: string;
};

export type AnswerKey = {
  items: AnswerKeyItem[];
  totalScore: number;
  riskLevel: string;
  expectedConduct: string;
  explanation: string;
};

export type StudentAnswer = {
  protocol: Protocol;
  itemScores: Record<ScoreItemKey, number>;
  totalScore: number;
  riskLevel: string;
  conduct: string;
  reasoning: string;
};

export type GradingItem = {
  key: string;
  label: string;
  studentScore: number | null;
  correctScore: number;
  correct: boolean;
  explanation?: string;
};

export type GradingResult = {
  protocolCorrect: boolean;
  totalCorrect: boolean;
  riskCorrect: boolean;
  items: GradingItem[];
  errors: string[];
  strengths: string[];
  score: number;
  maxScore: number;
  percentage: number;
};

export type CaseForUi = {
  id: string;
  title: string;
  protocol: Protocol;
  difficulty: Difficulty;
  stem: string;
  vitalSigns: VitalSigns;
  answerKey: AnswerKey;
};
