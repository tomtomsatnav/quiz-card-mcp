/**
 * Quiz rules: input validation, answer checking and scoring.
 * Pure functions with no dependencies, shared by the server and the card.
 */

export const QUESTION_COUNT = 5;
export const OPTION_COUNT = 4;

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  topic: string;
  questions: Question[];
}

export type ValidationResult =
  | { ok: true; quiz: Quiz }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function describe(value: unknown): string {
  if (Array.isArray(value)) return "an array";
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  return typeof value === "object" ? "an object" : `${typeof value} ${String(value)}`;
}

function validateQuestion(value: unknown, n: number): string[] {
  const at = `question ${n}`;
  if (!isRecord(value)) {
    return [`${at}: expected an object, got ${describe(value)}`];
  }

  const errors: string[] = [];
  if (!isNonEmptyString(value.question)) {
    errors.push(`${at}: "question" must be a non-empty string`);
  }

  const { options, correctIndex } = value;
  if (!Array.isArray(options)) {
    errors.push(`${at}: "options" must be an array of ${OPTION_COUNT} strings`);
  } else {
    if (options.length !== OPTION_COUNT) {
      errors.push(`${at}: expected ${OPTION_COUNT} options, got ${options.length}`);
    }
    options.forEach((option, i) => {
      if (!isNonEmptyString(option)) {
        errors.push(`${at}, option ${i + 1}: must be a non-empty string`);
      }
    });
    const seen = new Set<string>();
    for (const option of options) {
      if (!isNonEmptyString(option)) continue;
      const key = option.trim().toLowerCase();
      if (seen.has(key)) {
        errors.push(`${at}: option ${JSON.stringify(option)} appears more than once`);
      }
      seen.add(key);
    }
  }

  if (!Number.isInteger(correctIndex) || (correctIndex as number) < 0 || (correctIndex as number) >= OPTION_COUNT) {
    errors.push(
      `${at}: "correctIndex" must be an integer from 0 to ${OPTION_COUNT - 1}, got ${describe(correctIndex)}`,
    );
  }

  return errors;
}

/** Checks quiz input and returns every problem found, so the caller can fix them all at once. */
export function validateQuiz(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, errors: [`expected an object with "topic" and "questions", got ${describe(input)}`] };
  }

  const errors: string[] = [];
  if (!isNonEmptyString(input.topic)) {
    errors.push(`"topic" must be a non-empty string`);
  }

  const { questions } = input;
  if (!Array.isArray(questions)) {
    errors.push(`"questions" must be an array of ${QUESTION_COUNT} questions`);
  } else {
    if (questions.length !== QUESTION_COUNT) {
      errors.push(`expected ${QUESTION_COUNT} questions, got ${questions.length}`);
    }
    questions.forEach((q, i) => errors.push(...validateQuestion(q, i + 1)));
  }

  if (errors.length > 0) return { ok: false, errors };

  const quiz: Quiz = {
    topic: (input.topic as string).trim(),
    questions: (questions as Question[]).map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correctIndex: q.correctIndex,
    })),
  };
  return { ok: true, quiz };
}

export function isCorrect(question: Question, optionIndex: number): boolean {
  return optionIndex === question.correctIndex;
}

/** Progress through one quiz. `answers[i]` is the option chosen for question i, or null. */
export interface QuizState {
  current: number;
  answers: (number | null)[];
  finished: boolean;
}

export function startQuiz(quiz: Quiz): QuizState {
  return { current: 0, answers: quiz.questions.map(() => null), finished: false };
}

/** Records an answer to the current question. The first answer is final. */
export function answer(state: QuizState, quiz: Quiz, optionIndex: number): QuizState {
  const options = quiz.questions[state.current]?.options ?? [];
  if (state.finished || state.answers[state.current] !== null) return state;
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) return state;

  const answers = [...state.answers];
  answers[state.current] = optionIndex;
  return { ...state, answers };
}

/** Moves to the next question, or finishes after the last. Only once the current one is answered. */
export function next(state: QuizState): QuizState {
  if (state.finished || state.answers[state.current] === null) return state;
  if (state.current === state.answers.length - 1) return { ...state, finished: true };
  return { ...state, current: state.current + 1 };
}

export function score(quiz: Quiz, state: QuizState): { correct: number; total: number } {
  const correct = quiz.questions.filter((q, i) => {
    const chosen = state.answers[i];
    return chosen != null && isCorrect(q, chosen);
  }).length;
  return { correct, total: quiz.questions.length };
}
