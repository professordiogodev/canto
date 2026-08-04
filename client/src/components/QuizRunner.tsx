import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Subject } from "../api";
import { meaningMatches, readingMatches } from "../matching";
import { hanziFontSizeRem } from "../format";

export interface QuizResult {
  type: Subject["type"];
  id: number;
  meaningCorrect: boolean;
  readingCorrect: boolean;
}

interface QueueEntry {
  key: string;
  part: "meaning" | "reading";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizRunner({
  items,
  onFinish,
}: {
  items: Subject[];
  onFinish: (results: QuizResult[]) => void;
}) {
  const itemsByKey = useMemo(() => {
    const map: Record<string, Subject> = {};
    for (const it of items) map[`${it.type}-${it.id}`] = it;
    return map;
  }, [items]);

  const totalEntries = items.length * 2;
  const [queue, setQueue] = useState<QueueEntry[]>(() =>
    shuffle(items.flatMap((it) => [
      { key: `${it.type}-${it.id}`, part: "meaning" as const },
      { key: `${it.type}-${it.id}`, part: "reading" as const },
    ]))
  );
  const firstTry = useRef<Record<string, { meaningCorrect?: boolean; readingCorrect?: boolean }>>({});
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [revealText, setRevealText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [queue.length, feedback]);

  useEffect(() => {
    if (queue.length === 0 && !finishedRef.current) {
      finishedRef.current = true;
      const results: QuizResult[] = items.map((it) => {
        const key = `${it.type}-${it.id}`;
        const rec = firstTry.current[key] || {};
        return {
          type: it.type,
          id: it.id,
          meaningCorrect: !!rec.meaningCorrect,
          readingCorrect: !!rec.readingCorrect,
        };
      });
      onFinish(results);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  if (queue.length === 0) {
    return null; // parent switches away once onFinish fires
  }

  const current = queue[0];
  const subject = itemsByKey[current.key];
  const answered = totalEntries - queue.length;
  const colorKind =
    subject.type === "expression" ? "expression" : current.part === "reading" ? "reading" : "writing";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (feedback === "wrong") {
      // "Continue" after a wrong answer: requeue later and move on.
      setQueue((q) => {
        const [, ...rest] = q;
        const pos = Math.min(rest.length, 2 + Math.floor(Math.random() * 3));
        const next = [...rest.slice(0, pos), current, ...rest.slice(pos)];
        return next;
      });
      setFeedback("idle");
      setInput("");
      setRevealText(null);
      return;
    }

    const correct =
      current.part === "meaning"
        ? meaningMatches(input, subject.meanings)
        : readingMatches(input, subject.jyutping);

    const rec = firstTry.current[current.key] || {};
    if (current.part === "meaning" && rec.meaningCorrect === undefined) {
      rec.meaningCorrect = correct;
    }
    if (current.part === "reading" && rec.readingCorrect === undefined) {
      rec.readingCorrect = correct;
    }
    firstTry.current[current.key] = rec;

    if (correct) {
      setFeedback("correct");
      setTimeout(() => {
        setQueue((q) => q.slice(1));
        setFeedback("idle");
        setInput("");
      }, 450);
    } else {
      setFeedback("wrong");
      setRevealText(
        current.part === "meaning"
          ? subject.meanings.join(", ")
          : subject.jyutping.join(", ")
      );
    }
  };

  return (
    <div>
      <div className="flow-progress">
        {answered} / {totalEntries} answered
      </div>
      <div className={`quiz-card ${feedback}`}>
        <div className={`quiz-question-type quiz-color-${colorKind}`}>
          {current.part === "meaning" ? "Meaning" : "Reading (Jyutping)"}
        </div>
        <div className="quiz-hanzi" style={{ fontSize: `${hanziFontSizeRem(subject.hanzi, 4)}rem` }}>
          {subject.hanzi}
        </div>
        <form onSubmit={onSubmit}>
          <input
            ref={inputRef}
            className={`quiz-input quiz-color-${colorKind}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={feedback === "wrong"}
            placeholder={current.part === "meaning" ? "English meaning" : "e.g. nei5 hou2"}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {feedback === "wrong" && (
            <div className="quiz-feedback wrong">
              Correct answer: <strong>{revealText}</strong>
              <div style={{ marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {current.part === "meaning" ? subject.meaningMnemonic : subject.readingMnemonic}
              </div>
            </div>
          )}
          {feedback === "correct" && <div className="quiz-feedback correct">Correct!</div>}
          <div className="quiz-footer">
            <button
              className={`btn quiz-color-${colorKind}`}
              type="submit"
              disabled={feedback === "correct"}
            >
              {feedback === "wrong" ? "Continue" : "Answer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
