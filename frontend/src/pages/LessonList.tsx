import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

type LessonCategory = "lesson" | "track";
type LessonLevel = "beginners" | "intermediate" | "professional";

interface Lesson {
  id: number;
  title: string;
  description?: string | null;
  category: LessonCategory;
  level: LessonLevel;
  page_count?: number | null;
}

const CATEGORY_LABELS: Record<LessonCategory, string> = {
  lesson: "Lesson",
  track: "Track",
};

const LEVEL_LABELS: Record<LessonLevel, string> = {
  beginners: "Beginners",
  intermediate: "Intermediate",
  professional: "Professional",
};

export default function LessonListPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/lessons")
      .then((res) => res.json())
      .then(setLessons)
      .catch((err) => setError(err.message));
  }, []);

  const grouped = useMemo(() => {
    const base: Record<LessonLevel, Lesson[]> = {
      beginners: [],
      intermediate: [],
      professional: [],
    };
    for (const lesson of lessons) {
      base[lesson.level].push(lesson);
    }
    return base;
  }, [lessons]);

  return (
    <div>
      <h2>Lesson Library</h2>
      {error && <div>{error}</div>}
      {(["beginners", "intermediate", "professional"] as LessonLevel[]).map((level) => (
        <section key={level} className="lesson-group">
          <h3>{LEVEL_LABELS[level]}</h3>
          <div className="lesson-grid">
            {grouped[level].length === 0 && <div className="card">No items yet.</div>}
            {grouped[level].map((lesson) => (
              <div className="card lesson-card" key={lesson.id}>
                <strong>{lesson.title}</strong>
                <span>{lesson.description}</span>
                <span className="category-badge">{CATEGORY_LABELS[lesson.category]}</span>
                <span className="level-badge">{LEVEL_LABELS[lesson.level]}</span>
                <span>Pages: {lesson.page_count ?? "-"}</span>
                <Link className="button" to={`/lessons/${lesson.id}`}>Open</Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
