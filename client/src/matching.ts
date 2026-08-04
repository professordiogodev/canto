function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function normalizeMeaning(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/^(to|a|an|the)\s+/, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

export function meaningMatches(input: string, meanings: string[]): boolean {
  const normInput = normalizeMeaning(input);
  if (!normInput) return false;
  return meanings.some((m) => {
    const normMeaning = normalizeMeaning(m);
    if (normInput === normMeaning) return true;
    // Allow one small typo on meanings of reasonable length.
    if (normMeaning.length >= 4) {
      return levenshtein(normInput, normMeaning) <= 1;
    }
    return false;
  });
}

function normalizeJyutping(str: string): string {
  // Strip spaces entirely so multi-syllable answers can be typed with or
  // without spaces between syllables (e.g. "nei5hou2" or "nei5 hou2").
  return str.toLowerCase().trim().replace(/\s+/g, "");
}

export function readingMatches(input: string, jyutpingOptions: string[]): boolean {
  const normInput = normalizeJyutping(input);
  if (!normInput) return false;
  return jyutpingOptions.some((j) => normalizeJyutping(j) === normInput);
}
