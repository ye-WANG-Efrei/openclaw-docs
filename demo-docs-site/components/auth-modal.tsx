"use client";
import { useState } from "react";

const API = "https://openclaw.aiedi.cn/api/auth";

export interface AuthUser {
  id: string;
  username: string;
  token: string;
}

function saveUser(user: AuthUser) {
  localStorage.setItem("oc_user", JSON.stringify(user));
}
export function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("oc_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearUser() {
  localStorage.removeItem("oc_user");
}

export function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (u: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "请求失败"); return; }
      const user: AuthUser = { id: data.id, username: data.username, token: data.token };
      saveUser(user);
      onAuth(user);
      onClose();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label="关闭">×</button>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => { setMode("login"); setError(""); }}
          >登录</button>
          <button
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => { setMode("register"); setError(""); }}
          >注册</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">
            用户名
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="至少 2 个字符"
              autoFocus
              required
            />
          </label>
          <label className="auth-label">
            密码
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === "register" ? "至少 6 位" : ""}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "处理中…" : mode === "login" ? "登录" : "注册"}
          </button>
        </form>
      </div>
    </div>
  );
}
