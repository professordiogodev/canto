import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Subject } from "../api";
import QuizRunner, { QuizResult } from "../components/QuizRunner";
import SpeakButton from "../components/SpeakButton";
import { hanziFontSizeRem } from "../format";

const BATCH_SIZE = 5;

type Phase = "loading" | "intro" | "quiz" | "done" | "empty" | "error";

export default function Lessons() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [batch, setBatch] = useState<Subject[]>([]);
  const [introIndex, setIntroIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .lessons()
      .then((res) => {
        if (res.items.length === 0) {
          setPhase("empty");
          return;
        }
        setBatch(res.items.slice(0, BATCH_SIZE));
        setIntroIndex(0);
        setPhase("intro");
      })
      .catch((e) => {
        setError(e.message);
        setPhase("error");
      });
  }, []);

  if (phase === "loading") return <div className="page-loading">Loading…</div>;
  if (phase === "error") return <div className="page-empty">Failed to load lessons: {error}</div>;
  if (phase === "empty") {
    return (
      <div className="page-empty">
        <p>No lessons available right now — nice work staying on top of things!</p>
        <Link className="btn" to="/">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (phase === "intro") {
    const subject = batch[introIndex];
    const isLast = introIndex === batch.length - 1;
    return (
      <div>
        <div className="flow-progress">
          Lesson {introIndex + 1} / {batch.length}
        </div>
        <div className="card">
          <span className={`card-type-badge ${subject.type}`}>{subject.type}</span>
          <div className="card-hanzi" style={{ fontSize: `${hanziFontSizeRem(subject.hanzi)}rem` }}>
            {subject.hanzi}
            <SpeakButton text={subject.hanzi} />
          </div>
          <div className="card-level">Level {subject.level}</div>
          <div className="card-section">
            <h4>Meaning</h4>
            <div className="value">{subject.meanings.join(", ")}</div>
            <p>{subject.meaningMnemonic}</p>
          </div>
          <div className="card-section">
            <h4>Reading (Jyutping)</h4>
            <div className="value">{subject.jyutping.join(", ")}</div>
            <p>{subject.readingMnemonic}</p>
          </div>
          <div className="card-actions">
            <button
              className="btn btn-secondary"
              disabled={introIndex === 0}
              onClick={() => setIntroIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </button>
            {isLast ? (
              <button className="btn" onClick={() => setPhase("quiz")}>
                Start quiz
              </button>
            ) : (
              <button className="btn" onClick={() => setIntroIndex((i) => i + 1)}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <QuizRunner
        items={batch}
        onFinish={(results: QuizResult[]) => {
          api
            .completeLessons(results.map((r) => ({ type: r.type, id: r.id })))
            .then(() => setPhase("done"))
            .catch((e) => {
              setError(e.message);
              setPhase("error");
            });
        }}
      />
    );
  }

  // done
  return (
    <div className="page-empty">
      <p>
        Lesson batch complete! These {batch.length} items have entered your review queue.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
        <Link className="btn btn-secondary" to="/">
          Dashboard
        </Link>
        <button
          className="btn"
          onClick={() => {
            setPhase("loading");
            api
              .lessons()
              .then((res) => {
                if (res.items.length === 0) {
                  setPhase("empty");
                  return;
                }
                setBatch(res.items.slice(0, BATCH_SIZE));
                setIntroIndex(0);
                setPhase("intro");
              })
              .catch((e) => {
                setError(e.message);
                setPhase("error");
              });
          }}
        >
          Continue lessons
        </button>
      </div>
    </div>
  );
}
