import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, DashboardData } from "../api";

function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "now";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `in ${mins} min${mins === 1 ? "" : "s"}`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page-empty">Failed to load dashboard: {error}</div>;
  if (!data) return <div className="page-loading">Loading…</div>;

  const lp = data.levelProgress;
  const charPct = lp.charactersTotal ? Math.round((lp.charactersGuru / lp.charactersTotal) * 100) : 0;
  const vocabPct = lp.vocabularyTotal ? Math.round((lp.vocabularyStarted / lp.vocabularyTotal) * 100) : 0;
  const exprPct = lp.expressionsTotal ? Math.round((lp.expressionsStarted / lp.expressionsTotal) * 100) : 0;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card lessons">
          <div className="stat-number">{data.lessonsAvailable}</div>
          <div className="stat-label">Lessons available</div>
          <Link
            to="/lessons"
            className={`btn btn-block ${data.lessonsAvailable === 0 ? "btn-secondary" : ""}`}
            aria-disabled={data.lessonsAvailable === 0}
            onClick={(e) => data.lessonsAvailable === 0 && e.preventDefault()}
          >
            Start lessons
          </Link>
        </div>
        <div className="stat-card reviews">
          <div className="stat-number">{data.reviewsAvailable}</div>
          <div className="stat-label">Reviews available</div>
          <Link
            to="/reviews"
            className={`btn btn-block ${data.reviewsAvailable === 0 ? "btn-secondary" : ""}`}
            onClick={(e) => data.reviewsAvailable === 0 && e.preventDefault()}
          >
            Start reviews
          </Link>
          {data.reviewsAvailable === 0 && data.nextReviewAt && (
            <div className="stat-hint">Next review {formatRelative(data.nextReviewAt)}</div>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>
          Level {data.currentLevel} of {data.maxLevel}
        </h2>
        <div className="progress-row">
          <span className="progress-tag character">Characters</span>
          <div className="progress-track">
            <div className="progress-fill character" style={{ width: `${charPct}%` }} />
          </div>
          <span className="progress-count">
            {lp.charactersGuru}/{lp.charactersTotal} guru
          </span>
        </div>
        <div className="progress-row">
          <span className="progress-tag vocabulary">Vocabulary</span>
          <div className="progress-track">
            <div className="progress-fill vocabulary" style={{ width: `${vocabPct}%` }} />
          </div>
          <span className="progress-count">
            {lp.vocabularyStarted}/{lp.vocabularyTotal} started
          </span>
        </div>
        {lp.expressionsTotal > 0 && (
          <div className="progress-row">
            <span className="progress-tag expression">Expressions</span>
            <div className="progress-track">
              <div className="progress-fill expression" style={{ width: `${exprPct}%` }} />
            </div>
            <span className="progress-count">
              {lp.expressionsStarted}/{lp.expressionsTotal} started
            </span>
          </div>
        )}
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 0 }}>
          Level {data.currentLevel + 1} unlocks once 90% of this level's characters reach Guru.
        </p>
      </div>

      <div className="panel">
        <h2>Overall progress</h2>
        <ul className="summary-list">
          <li>
            <span>Characters burned</span>
            <span>
              {data.totals.burnedCharacters} / {data.totals.totalCharacters}
            </span>
          </li>
          <li>
            <span>Vocabulary burned</span>
            <span>
              {data.totals.burnedVocabulary} / {data.totals.totalVocabulary}
            </span>
          </li>
          <li>
            <span>Expressions burned</span>
            <span>
              {data.totals.burnedExpressions} / {data.totals.totalExpressions}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
