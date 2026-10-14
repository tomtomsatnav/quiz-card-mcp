import { describe, expect, it } from "vitest";
import { answer, isCorrect, next, type Quiz, score, startQuiz, validateQuiz } from "./quiz";

function makeInput() {
  return {
    topic: "UK capitals",
    questions: [
      { question: "Capital of England?", options: ["London", "Leeds", "York", "Bath"], correctIndex: 0 },
      { question: "Capital of Scotland?", options: ["Glasgow", "Edinburgh", "Perth", "Dundee"], correctIndex: 1 },
      { question: "Capital of Wales?", options: ["Swansea", "Newport", "Cardiff", "Bangor"], correctIndex: 2 },
      { question: "Capital of Northern Ireland?", options: ["Derry", "Newry", "Armagh", "Belfast"], correctIndex: 3 },
      { question: "Capital of the Isle of Man?", options: ["Douglas", "Ramsey", "Peel", "Castletown"], correctIndex: 0 },
    ],
  };
}

function validQuiz(): Quiz {
  const result = validateQuiz(makeInput());
  if (!result.ok) throw new Error(result.errors.join("; "));
  return result.quiz;
}

function errorsFor(input: unknown): string[] {
  const result = validateQuiz(input);
  if (result.ok) throw new Error("expected validation to fail");
  return result.errors;
}

describe("validateQuiz", () => {
  it("accepts a valid quiz and trims whitespace", () => {
    const input = makeInput();
    input.topic = "  UK capitals  ";
    input.questions[0].options[0] = " London ";
    const result = validateQuiz(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.quiz.topic).toBe("UK capitals");
      expect(result.quiz.questions[0].options[0]).toBe("London");
    }
  });

  it("says exactly how many questions it got", () => {
    const input = makeInput();
    input.questions.push(input.questions[0]);
    expect(errorsFor(input)).toEqual(["expected 5 questions, got 6"]);

    input.questions = input.questions.slice(0, 3);
    expect(errorsFor(input)).toEqual(["expected 5 questions, got 3"]);
  });

  it("says which question has the wrong number of options", () => {
    const input = makeInput();
    input.questions[1].options = ["Glasgow", "Edinburgh", "Perth"];
    expect(errorsFor(input)).toEqual(["question 2: expected 4 options, got 3"]);
  });

  it("rejects an out-of-range or non-integer correctIndex, quoting the value", () => {
    const input = makeInput();
    input.questions[3].correctIndex = 4;
    input.questions[4].correctIndex = 1.5;
    expect(errorsFor(input)).toEqual([
      'question 4: "correctIndex" must be an integer from 0 to 3, got number 4',
      'question 5: "correctIndex" must be an integer from 0 to 3, got number 1.5',
    ]);
  });

  it("rejects empty text, empty options and duplicate options", () => {
    const input = makeInput();
    input.topic = " ";
    input.questions[0].question = "";
    input.questions[2].options = ["Cardiff", "cardiff", "", "Bangor"];
    expect(errorsFor(input)).toEqual([
      '"topic" must be a non-empty string',
      'question 1: "question" must be a non-empty string',
      "question 3, option 3: must be a non-empty string",
      'question 3: option "cardiff" appears more than once',
    ]);
  });

  it("reports wrong types instead of throwing", () => {
    expect(errorsFor(null)).toEqual(['expected an object with "topic" and "questions", got null']);
    expect(errorsFor({ topic: "x", questions: "five" })).toEqual(['"questions" must be an array of 5 questions']);
    const input = makeInput() as { questions: unknown[] };
    input.questions[0] = "not a question";
    expect(errorsFor(input)).toEqual(['question 1: expected an object, got "not a question"']);
  });
});

describe("answer checking", () => {
  it("isCorrect matches only the correct index", () => {
    const q = validQuiz().questions[1];
    expect(isCorrect(q, 1)).toBe(true);
    expect([0, 2, 3].map((i) => isCorrect(q, i))).toEqual([false, false, false]);
  });

  it("records the first answer and ignores changes", () => {
    const quiz = validQuiz();
    let state = answer(startQuiz(quiz), quiz, 2);
    state = answer(state, quiz, 0);
    expect(state.answers[0]).toBe(2);
  });

  it("ignores out-of-range answers", () => {
    const quiz = validQuiz();
    const state = startQuiz(quiz);
    expect(answer(state, quiz, 4)).toBe(state);
    expect(answer(state, quiz, -1)).toBe(state);
  });
});

describe("moving through the quiz", () => {
  it("won't move on until the current question is answered", () => {
    const state = startQuiz(validQuiz());
    expect(next(state)).toBe(state);
  });

  it("goes through all 5 questions, then finishes", () => {
    const quiz = validQuiz();
    let state = startQuiz(quiz);
    for (let i = 0; i < 5; i++) {
      expect(state.current).toBe(i);
      expect(state.finished).toBe(false);
      state = next(answer(state, quiz, 0));
    }
    expect(state.finished).toBe(true);
    expect(state.current).toBe(4);
    expect(next(state)).toBe(state);
  });
});

describe("score", () => {
  function play(choices: number[]) {
    const quiz = validQuiz();
    let state = startQuiz(quiz);
    for (const choice of choices) state = next(answer(state, quiz, choice));
    return score(quiz, state);
  }

  it("scores 5/5 when every answer is right", () => {
    expect(play([0, 1, 2, 3, 0])).toEqual({ correct: 5, total: 5 });
  });

  it("scores 4/5 with one wrong answer", () => {
    expect(play([0, 1, 2, 0, 0])).toEqual({ correct: 4, total: 5 });
  });

  it("scores 0/5 when every answer is wrong", () => {
    expect(play([1, 0, 0, 0, 1])).toEqual({ correct: 0, total: 5 });
  });

  it("counts unanswered questions as wrong", () => {
    expect(score(validQuiz(), startQuiz(validQuiz()))).toEqual({ correct: 0, total: 5 });
  });
});
