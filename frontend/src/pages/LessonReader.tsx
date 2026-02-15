import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch, API_BASE } from "../api";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

type ProgressStatus = "not_seen" | "in_practice" | "done";

interface Lesson {
  id: number;
  title: string;
  description?: string | null;
  pdf_file_key?: string | null;
  page_count?: number | null;
}

interface PageAudio {
  id: number;
  file_key: string;
  title?: string | null;
}

interface LessonPage {
  id: number;
  page_number: number;
  audio: PageAudio[];
}

interface LessonPageProgress {
  page_number: number;
  status: ProgressStatus;
  updated_at?: string | null;
}

export default function LessonReaderPage() {
  const params = useParams();
  const lessonId = Number(params.id);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [page, setPage] = useState<LessonPage | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [status, setStatus] = useState<ProgressStatus>("not_seen");
  const [pageStatuses, setPageStatuses] = useState<Record<number, ProgressStatus>>({});
  const [error, setError] = useState<string | null>(null);

  const pageCount = lesson?.page_count || 0;
  const pdfUrl = useMemo(() => {
    if (!lesson?.pdf_file_key) return null;
    return `${API_BASE}/media/${lesson.pdf_file_key}`;
  }, [lesson]);

  useEffect(() => {
    apiFetch(`/lessons/${lessonId}`)
      .then((res) => res.json())
      .then((data) => {
        setLesson(data);
        if (data.page_count) setPageNumber(1);
      })
      .catch((err) => setError(err.message));
  }, [lessonId]);

  useEffect(() => {
    if (!pageNumber) return;
    apiFetch(`/lessons/${lessonId}/pages/${pageNumber}`)
      .then((res) => res.json())
      .then(setPage)
      .catch((err) => setError(err.message));
  }, [lessonId, pageNumber]);

  useEffect(() => {
    apiFetch(`/lessons/${lessonId}/progress`)
      .then((res) => res.json())
      .then((rows: LessonPageProgress[]) => {
        const next = rows.reduce<Record<number, ProgressStatus>>((acc, row) => {
          acc[row.page_number] = row.status;
          return acc;
        }, {});
        setPageStatuses(next);
        setStatus(next[pageNumber] || "not_seen");
      })
      .catch((err) => setError(err.message));
  }, [lessonId, pageNumber]);

  useEffect(() => {
    const render = async () => {
      if (!pdfUrl) return;
      const pdf = await getDocument(pdfUrl).promise;
      const pdfPage = await pdf.getPage(pageNumber);
      const viewport = pdfPage.getViewport({ scale: 1.5 });
      const canvas = document.getElementById("pdf-canvas") as HTMLCanvasElement | null;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await pdfPage.render({ canvasContext: context, viewport }).promise;
    };

    render().catch((err) => setError(err.message));
  }, [pdfUrl, pageNumber]);

  const cycleStatus = async () => {
    const next: ProgressStatus = status === "not_seen" ? "in_practice" : status === "in_practice" ? "done" : "not_seen";
    setStatus(next);
    setPageStatuses((prev) => ({ ...prev, [pageNumber]: next }));
    await apiFetch(`/lessons/${lessonId}/pages/${pageNumber}/progress`, {
      method: "PUT",
      body: JSON.stringify({ status: next }),
    });
  };

  const trackAudioPlay = async (audioId: number) => {
    try {
      await apiFetch("/events/track", {
        method: "POST",
        body: JSON.stringify({
          type: "page_audio_played",
          payload_json: {
            lesson_id: lessonId,
            page_number: pageNumber,
            audio_id: audioId,
          },
        }),
      });
    } catch {
      // Do not block playback UI if analytics fails.
    }
  };

  return (
    <div>
      <h2>{lesson?.title}</h2>
      {error && <div>{error}</div>}
      <div className="reader-layout">
        <div>
          <div className="card page-list">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                className={num === pageNumber ? "active" : ""}
                onClick={() => {
                  setPageNumber(num);
                  setStatus(pageStatuses[num] || "not_seen");
                }}
              >
                <span>Page {num}</span>
                <span className={`page-status page-status-${pageStatuses[num] || "not_seen"}`}>
                  {pageStatuses[num] || "not_seen"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <canvas id="pdf-canvas" className="pdf-canvas" />
          <div className="progress-toggle">
            <span>Status: {status}</span>
            <button className="button" onClick={cycleStatus}>Toggle</button>
          </div>
          <div className="audio-list">
            {page?.audio?.map((audio) => (
              <div key={audio.id} className="card">
                <div>{audio.title || "Voice box"}</div>
                <audio
                  controls
                  src={`${API_BASE}/media/${audio.file_key}`}
                  onPlay={() => trackAudioPlay(audio.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
