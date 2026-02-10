import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

interface Lesson {
  id: number;
  title: string;
  description?: string | null;
  page_count?: number | null;
}

export default function LessonListPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/lessons")
      .then((res) => res.json())
      .then(setLessons)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h2>Lesson Library</h2>
      {error && <div>{error}</div>}
      <div className="lesson-grid">
        {lessons.map((lesson) => (
          <div className="card lesson-card" key={lesson.id}>
            <strong>{lesson.title}</strong>
            <span>{lesson.description}</span>
            <span>Pages: {lesson.page_count ?? "-"}</span>
            <Link className="button" to={`/lessons/${lesson.id}`}>Open</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
