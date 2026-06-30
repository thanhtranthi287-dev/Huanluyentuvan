/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'parent' | 'student';

export type Personality = 'difficult' | 'angry' | 'shy' | 'friendly' | 'skeptical' | 'indecisive';

export type Difficulty = 'only_docs' | 'mix_external';

export interface SessionConfig {
  role: Role;
  personality: Personality;
  difficulty: Difficulty;
  documentText: string;
  targetMajor: string;
}

export interface ChatMessage {
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  metadata?: {
    documentStick?: boolean;
    trickyQuestion?: boolean;
    emotion?: string;
  };
}

export interface TurnEvaluation {
  questionIndex: number;
  question: string;
  userAnswer: string;
  status: 'correct' | 'partially_correct' | 'incorrect' | 'missing_info';
  analysis: string;
  sampleAnswer: string;
  handlingTip: string;
}

export interface EvaluationResult {
  accuracyScore: number;
  persuasionScore: number;
  attitudeScore: number;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  turnEvaluations: TurnEvaluation[];
  recommendations: string[];
}
