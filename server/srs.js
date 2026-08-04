// SRS stage model, closely following WaniKani's scheme:
// 0 = locked (no progress yet)
// 1-4 = Apprentice 1-4
// 5-6 = Guru 1-2
// 7   = Master
// 8   = Enlightened
// 9   = Burned (graduated, no more reviews)

const STAGE_NAMES = {
  0: "Locked",
  1: "Apprentice 1",
  2: "Apprentice 2",
  3: "Apprentice 3",
  4: "Apprentice 4",
  5: "Guru 1",
  6: "Guru 2",
  7: "Master",
  8: "Enlightened",
  9: "Burned",
};

// Hours until next review, indexed by the stage the item is ENTERING.
const STAGE_INTERVAL_HOURS = {
  1: 4,
  2: 8,
  3: 23,
  4: 47,
  5: 24 * 7,
  6: 24 * 14,
  7: 24 * 30,
  8: 24 * 120,
  9: null, // burned: never reviewed again
};

function stageGroup(stage) {
  if (stage === 0) return "locked";
  if (stage <= 4) return "apprentice";
  if (stage <= 6) return "guru";
  if (stage === 7) return "master";
  if (stage === 8) return "enlightened";
  return "burned";
}

// Given the current stage and whether the meaning/reading were both
// answered correctly on first try during the review, compute the new stage.
function nextStage(currentStage, meaningCorrect, readingCorrect) {
  const bothCorrect = meaningCorrect && readingCorrect;
  if (bothCorrect) {
    return Math.min(currentStage + 1, 9);
  }
  const penalty = currentStage >= 5 ? 2 : 1;
  return Math.max(1, currentStage - penalty);
}

function nextAvailableAt(newStage, now = new Date()) {
  const hours = STAGE_INTERVAL_HOURS[newStage];
  if (hours == null) return null;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

module.exports = {
  STAGE_NAMES,
  STAGE_INTERVAL_HOURS,
  stageGroup,
  nextStage,
  nextAvailableAt,
};
