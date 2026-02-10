import { useState } from "react";
import { apiFetch } from "../api";

export default function AdminPage() {
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const createLesson = async () => {
    setMessage(null);
    const res = await apiFetch("/admin/lessons", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();
    setLessonId(data.id);
    setMessage(`Lesson created: ${data.id}`);
  };

  const uploadPdf = async () => {
    if (!lessonId || !pdfFile) return;
    setMessage(null);
    const form = new FormData();
    form.append("file", pdfFile);
    await apiFetch(`/admin/lessons/${lessonId}/pdf`, {
      method: "POST",
      body: form,
    });
    setMessage("PDF uploaded.");
  };

  const uploadAudio = async () => {
    if (!lessonId || !audioFile) return;
    setMessage(null);
    const form = new FormData();
    form.append("file", audioFile);
    if (audioTitle) form.append("title", audioTitle);
    await apiFetch(`/admin/lessons/${lessonId}/pages/${pageNumber}/audio`, {
      method: "POST",
      body: form,
    });
    setMessage(`Audio uploaded for page ${pageNumber}.`);
  };

  return (
    <div className="card admin-card">
      <h2>Admin Uploads</h2>
      {message && <div>{message}</div>}
      <div className="admin-section">
        <h3>Create Lesson</h3>
        <input
          type="text"
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="button" onClick={createLesson}>
          Create Lesson
        </button>
      </div>

      <div className="admin-section">
        <h3>Upload PDF (Once)</h3>
        <div>Lesson ID: {lessonId ?? "Create lesson first"}</div>
        <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
        <button className="button" onClick={uploadPdf} disabled={!lessonId || !pdfFile}>
          Upload PDF
        </button>
      </div>

      <div className="admin-section">
        <h3>Upload Audio for Page</h3>
        <input
          type="number"
          min={1}
          value={pageNumber}
          onChange={(e) => setPageNumber(Number(e.target.value))}
        />
        <input
          type="text"
          placeholder="Audio title (optional)"
          value={audioTitle}
          onChange={(e) => setAudioTitle(e.target.value)}
        />
        <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
        <button className="button" onClick={uploadAudio} disabled={!lessonId || !audioFile}>
          Upload Audio
        </button>
      </div>
    </div>
  );
}
