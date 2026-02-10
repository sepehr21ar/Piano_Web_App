import { useState } from "react";
import { apiFetch } from "../api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>
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
        {success && <div>Registration successful. You can log in now.</div>}
        <button className="button" type="submit">Create account</button>
      </form>
    </div>
  );
}
