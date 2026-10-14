/**
 * Quiz card View: renders the quiz from the show_quiz tool result and runs it in the browser.
 */
import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
  type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import { answer, isCorrect, next, type Quiz, type QuizState, score, startQuiz, validateQuiz } from "./quiz";
import "./mcp-app.css";

const card = document.getElementById("card")!;

let quiz: Quiz | null = null;
let state: QuizState | null = null;

/** Small DOM helper. Text is always set with textContent, never parsed as HTML. */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { className?: string; text?: string } = {},
  ...children: Node[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  node.append(...children);
  return node;
}

function showStatus(text: string, isError = false) {
  card.replaceChildren(el("p", { className: isError ? "status error" : "status", text }));
}

function render() {
  if (!quiz || !state) return;
  const { topic, questions } = quiz;

  if (state.finished) {
    const { correct, total } = score(quiz, state);
    card.replaceChildren(
      el("div", { className: "meta" }, el("span", { text: topic }), el("span", { text: "Finished" })),
      el("p", { className: "score", text: `${correct}/${total}` }),
      el("p", { text: correct === total ? "Perfect score!" : `You got ${correct} out of ${total} right.` }),
    );
    return;
  }

  const index = state.current;
  const q = questions[index];
  const chosen = state.answers[index];
  const answered = chosen !== null;

  const optionButtons = q.options.map((option, i) => {
    const button = el("button", { className: "option" }, el("span", { text: option }));
    button.type = "button";
    if (answered) {
      button.disabled = true;
      if (i === q.correctIndex) {
        button.classList.add("correct");
        button.append(el("span", { className: "mark", text: "✓ Correct answer" }));
      } else if (i === chosen) {
        button.classList.add("wrong");
        button.append(el("span", { className: "mark", text: "✗ Your answer" }));
      }
    } else {
      button.addEventListener("click", () => {
        state = answer(state!, quiz!, i);
        render();
      });
    }
    return el("li", {}, button);
  });

  const children: Node[] = [
    el("div", { className: "meta" }, el("span", { text: topic }), el("span", { text: `Question ${index + 1} of ${questions.length}` })),
    el("p", { className: "question", text: q.question }),
    el("ul", { className: "options" }, ...optionButtons),
  ];

  const feedback = el("p", { className: "feedback" });
  feedback.setAttribute("aria-live", "polite");
  children.push(feedback);

  if (answered) {
    const right = isCorrect(q, chosen);
    feedback.classList.add(right ? "correct" : "wrong");
    feedback.textContent = right ? "Correct!" : `Not quite. The answer is ${q.options[q.correctIndex]}.`;

    const isLast = index === questions.length - 1;
    const nextButton = el("button", { className: "next", text: isLast ? "See score" : "Next" });
    nextButton.type = "button";
    nextButton.addEventListener("click", () => {
      state = next(state!);
      render();
    });
    children.push(nextButton);
  }

  card.replaceChildren(...children);
  if (answered) card.querySelector<HTMLButtonElement>(".next")?.focus();
}

function handleHostContextChanged(ctx: McpUiHostContext) {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
  if (ctx.safeAreaInsets) {
    const { top, right, bottom, left } = ctx.safeAreaInsets;
    document.body.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
  }
}

const app = new App({ name: "Quiz Card", version: "1.0.0" });

// Register handlers before connecting so the initial tool result isn't missed.
app.ontoolresult = (result) => {
  if (result.isError) {
    showStatus("This quiz couldn't be shown. Claude will try again.", true);
    return;
  }
  const validation = validateQuiz(result.structuredContent);
  if (!validation.ok) {
    showStatus(`This quiz couldn't be shown: ${validation.errors.join("; ")}`, true);
    return;
  }
  quiz = validation.quiz;
  state = startQuiz(quiz);
  render();
};

app.ontoolcancelled = () => {
  if (!quiz) showStatus("Quiz cancelled.");
};

app.onerror = console.error;
app.onhostcontextchanged = handleHostContextChanged;

app.connect().then(() => {
  const ctx = app.getHostContext();
  if (ctx) handleHostContextChanged(ctx);
});
