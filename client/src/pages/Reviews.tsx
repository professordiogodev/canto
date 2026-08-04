import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ReviewSubject } from "../api";
import QuizRunner, { QuizResult } from "../components/QuizRunner";

type Phase = "loading" | "quiz" | "done" | "empty" | "error";

interface SummaryRow {
  hanzi: string;
  type: string;
  stageBefore: number;
  stageAfter: number;
  stageName: string;
}

export default function Reviews() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<ReviewSubject[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .reviews()
      .then((res) => {
        if (res.items.length === 0) {
          setPhase("empty");
          return;
        }
        setItems(res.items);
        setPhase("quiz");
      })
      .catch((e) => {
        setError(e.message);
        setPhase("error");
      });
  }, []);

  if (phase === "loading") return <div className="page-loading">Loading…</div>;
  if (phase === "error") return <div className="page-empty">Failed to load reviews: {error}</div>;
  if (phase === "empty") {
    return (
      <div className="page-empty">
        <p>No reviews due right now. Check back later!</p>
        <Link className="btn" to="/">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <QuizRunner
        items={items}
        onFinish={async (results: QuizResult[]) => {
          const rows: SummaryRow[] = [];
          for (const r of results) {
            try {
              const res = await api.submitReview(r.type, r.id, r.meaningCorrect, r.readingCorrect);
              const subject = items.find((it) => it.type === r.type && it.id === r.id);
              rows.push({
                hanzi: subject?.hanzi || "?",
                type: r.type,
                stageBefore: res.stageBefore,
                stageAfter: res.stageAfter,
                stageName: res.stageName,
              });
            } catch {
              // If a single submission fails, continue with the rest.
            }
          }
          setSummary(rows);
          setPhase("done");
        }}
      />
    );
  }

  const improved = summary.filter((s) => s.stageAfter > s.stageBefore).length;
  const dropped = summary.filter((s) => s.stageAfter < s.stageBefore).length;

  return (
    <div>
      <div className="panel text-center">
        <h2>Review session complete</h2>
        <p style={{ color: "var(--text-muted)" }}>
          {summary.length} items reviewed — {improved} advanced, {dropped} dropped back.
        </p>
        <Link className="btn" to="/">
          Back to dashboard
        </Link>
      </div>
      <div className="panel">
        <ul className="summary-list">
          {summary.map((s, i) => (
            <li key={i}>
              <span>
                {s.hanzi} <span style={{ color: "var(--text-muted)" }}>({s.type})</span>
              </span>
              <span>
                {s.stageAfter > s.stageBefore ? "↑ " : s.stageAfter < s.stageBefore ? "↓ " : "= "}
                {s.stageName}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
