import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import LessonListPage from "./pages/LessonList";
import LessonReaderPage from "./pages/LessonReader";
import PianoPage from "./pages/Piano";
import AdminPage from "./pages/Admin";
import { apiFetch, clearTokens, getToken } from "./api";

type UserInfo = {
  id: number;
  email: string;
  role: string;
};

export default function App() {
  const location = useLocation();
  const token = getToken();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    apiFetch("/auth/me")
      .then((res) => res.json())
      .then(setUser)
      .catch(() => {
        clearTokens();
        setUser(null);
      });
  }, [token]);

  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";
  if (!token && !isAuthRoute) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">Piano Learning</div>
        <nav className="nav">
          {token ? (
            <>
              <Link to="/">Lessons</Link>
              <Link to="/piano">Piano</Link>
              {user?.role === "admin" && <Link to="/admin">Admin</Link>}
              <button
                className="button button-ghost"
                onClick={() => {
                  clearTokens();
                  window.location.href = "/login";
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<LessonListPage />} />
          <Route path="/lessons/:id" element={<LessonReaderPage />} />
          <Route path="/piano" element={<PianoPage />} />
          <Route path="/admin" element={user?.role === "admin" ? <AdminPage /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}
