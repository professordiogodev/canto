export type SubjectType = "character" | "vocabulary";

export interface Subject {
  id: number;
  type: SubjectType;
  level: number;
  hanzi: string;
  jyutping: string[];
  meanings: string[];
  meaningMnemonic: string;
  readingMnemonic: string;
  characterIds?: number[];
}

export interface ReviewSubject extends Subject {
  srsStage: number;
}

export interface DashboardData {
  currentLevel: number;
  maxLevel: number;
  lessonsAvailable: number;
  reviewsAvailable: number;
  nextReviewAt: string | null;
  levelProgress: {
    level: number;
    charactersTotal: number;
    charactersStarted: number;
    charactersGuru: number;
    vocabularyTotal: number;
    vocabularyStarted: number;
  };
  totals: {
    totalCharacters: number;
    totalVocabulary: number;
    burnedCharacters: number;
    burnedVocabulary: number;
    maxLevel: number;
  };
}

export interface BrowseLevel {
  level: number;
  unlocked: boolean;
  characters: (Subject & { srsStage: number; srsStageName: string })[];
  vocabulary: (Subject & { srsStage: number; srsStageName: string })[];
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body && body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (password: string) =>
    request<{ ok: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  session: () => request<{ authenticated: boolean }>("/auth/session"),
  dashboard: () => request<DashboardData>("/dashboard"),
  lessons: () => request<{ currentLevel: number; items: Subject[] }>("/lessons"),
  completeLessons: (items: { type: SubjectType; id: number }[]) =>
    request<{ ok: boolean }>("/lessons/complete", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  reviews: () => request<{ items: ReviewSubject[] }>("/reviews"),
  submitReview: (
    type: SubjectType,
    id: number,
    meaningCorrect: boolean,
    readingCorrect: boolean
  ) =>
    request<{ ok: boolean; stageBefore: number; stageAfter: number; stageName: string }>(
      "/reviews/submit",
      {
        method: "POST",
        body: JSON.stringify({ type, id, meaningCorrect, readingCorrect }),
      }
    ),
  subjects: () => request<{ currentLevel: number; levels: BrowseLevel[] }>("/subjects"),
};

export { ApiError };
