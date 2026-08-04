import { useEffect, useState } from "react";
import { api, BrowseLevel, Subject } from "../api";
import SpeakButton from "../components/SpeakButton";
import { hanziFontSizeRem } from "../format";

type BrowseSubject = Subject & { srsStage: number; srsStageName: string };

function stageBadgeClass(stage: number): string {
  if (stage === 0) return "stage-locked";
  if (stage <= 4) return "stage-apprentice";
  if (stage <= 6) return "stage-guru";
  return "stage-master";
}

export default function Browse() {
  const [levels, setLevels] = useState<BrowseLevel[] | null>(null);
  const [selected, setSelected] = useState<BrowseSubject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .subjects()
      .then((res) => setLevels(res.levels))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page-empty">Failed to load: {error}</div>;
  if (!levels) return <div className="page-loading">Loading…</div>;

  return (
    <div>
      {selected && (
        <div className="panel">
          <span className={`card-type-badge ${selected.type}`}>{selected.type}</span>{" "}
          <span className={`badge ${stageBadgeClass(selected.srsStage)}`}>
            {selected.srsStageName}
          </span>
          <div
            className="card-hanzi"
            style={{ fontSize: `${hanziFontSizeRem(selected.hanzi, 3)}rem` }}
          >
            {selected.hanzi}
            <SpeakButton text={selected.hanzi} />
          </div>
          <div className="card-section">
            <h4>Meaning</h4>
            <div className="value">{selected.meanings.join(", ")}</div>
            <p>{selected.meaningMnemonic}</p>
          </div>
          <div className="card-section">
            <h4>Reading (Jyutping)</h4>
            <div className="value">{selected.jyutping.join(", ")}</div>
            <p>{selected.readingMnemonic}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}

      {levels.map((level) => (
        <div key={level.level} className={`level-section ${level.unlocked ? "" : "locked"}`}>
          <h3>
            Level {level.level} {!level.unlocked && "(locked)"}
          </h3>
          <div className="subject-grid mb-1">
            {level.characters.map((c) => (
              <button
                key={`c-${c.id}`}
                className={`subject-chip ${level.unlocked ? "character" : "locked"}`}
                title={c.meanings.join(", ")}
                onClick={() => level.unlocked && setSelected(c)}
              >
                {c.hanzi}
                {c.srsStage > 0 && <span className="stage-dot" />}
              </button>
            ))}
          </div>
          <div className="subject-grid mb-1">
            {level.vocabulary.map((v) => (
              <button
                key={`v-${v.id}`}
                className={`subject-chip ${level.unlocked ? "vocabulary" : "locked"}`}
                title={v.meanings.join(", ")}
                onClick={() => level.unlocked && setSelected(v)}
              >
                {v.hanzi}
                {v.srsStage > 0 && <span className="stage-dot" />}
              </button>
            ))}
          </div>
          {level.expressions.length > 0 && (
            <div className="subject-grid">
              {level.expressions.map((e) => (
                <button
                  key={`e-${e.id}`}
                  className={`subject-chip ${level.unlocked ? "expression" : "locked"}`}
                  title={e.meanings.join(", ")}
                  onClick={() => level.unlocked && setSelected(e)}
                >
                  {e.hanzi}
                  {e.srsStage > 0 && <span className="stage-dot" />}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
