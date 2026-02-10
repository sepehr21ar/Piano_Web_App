import { useState } from "react";
import { apiFetch, setTokens } from "../api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const body = new URLSearchParams();
      body.set("username", email);
      body.set("password", password);
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = await res.json();
      setTokens(data.access_token, data.refresh_token);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form className="form" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div>{error}</div>}
        <button className="button" type="submit">Login</button>
      </form>
    </div>
  );
}
