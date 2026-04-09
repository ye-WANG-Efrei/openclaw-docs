"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://openclaw.aiedi.cn/api/annotations";
const UNLOCK_MS = 5 * 60 * 1000; // 5 minutes

interface Reply {
  id: string;
  comment: string;
  author: string;
  createdAt: number;
}

interface Annotation {
  id: string;
  pageSlug: string;
  selectedText: string;
  comment: string;
  author: string;
  createdAt: number;
  replies: Reply[];
}

interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

export function AnnotationSystem({ pageSlug }: { pageSlug: string }) {
  const [unlocked, setUnlocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");

  // ── 5-minute countdown timer ────────────────────────────────────────────────
  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const remaining = Math.max(0, UNLOCK_MS - (Date.now() - start));
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining === 0) {
        setUnlocked(true);
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Fetch annotations for current page ─────────────────────────────────────
  const fetchAnnotations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}?slug=${encodeURIComponent(pageSlug)}`);
      if (res.ok) setAnnotations(await res.json());
    } catch {
      // silently ignore — annotation panel will show empty state
    }
  }, [pageSlug]);

  useEffect(() => { fetchAnnotations(); }, [fetchAnnotations]);

  // ── Text selection listener ─────────────────────────────────────────────────
  useEffect(() => {
    if (!unlocked) return;

    const onMouseUp = (e: MouseEvent) => {
      // Ignore clicks inside annotation UI
      const target = e.target as HTMLElement;
      if (target.closest(".annot-form-popup") || target.closest(".annot-panel")) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        if (!showForm) setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      setSelection({ text: sel.toString().trim(), rect: range.getBoundingClientRect() });
      setShowForm(false);
    };

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [unlocked, showForm]);

  // ── Submit new annotation ───────────────────────────────────────────────────
  const submitAnnotation = async () => {
    if (!selection || !comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          selectedText: selection.text,
          comment: comment.trim(),
          author: author.trim() || "Anonymous",
        }),
      });
      if (res.ok) {
        setComment(""); setAuthor("");
        setShowForm(false); setSelection(null);
        await fetchAnnotations();
        setPanelOpen(true);
      }
    } catch {
      // network error — keep form open so user can retry
    }
    setSubmitting(false);
  };

  // ── Submit reply ────────────────────────────────────────────────────────────
  const submitReply = async (annotationId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/${annotationId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: replyText.trim(),
          author: replyAuthor.trim() || "Anonymous",
        }),
      });
      if (res.ok) {
        setReplyText(""); setReplyAuthor(""); setReplyingTo(null);
        await fetchAnnotations();
      }
    } catch {}
    setSubmitting(false);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmt = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const cancelForm = () => { setShowForm(false); setSelection(null); setComment(""); setAuthor(""); };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Timer / Annotate badge ──────────────────────────────────────── */}
      <button
        className={`annot-badge${unlocked ? " annot-badge--unlocked" : ""}`}
        onClick={() => unlocked && setPanelOpen(true)}
        title={unlocked ? "View comments" : `Annotation unlocks in ${fmt(secondsLeft)}`}
      >
        <span className="annot-badge-icon">{unlocked ? "💬" : "🔒"}</span>
        <span className="annot-badge-label">
          {unlocked
            ? annotations.length > 0
              ? `${annotations.length} comment${annotations.length !== 1 ? "s" : ""}`
              : "Leave a comment"
            : fmt(secondsLeft)}
        </span>
      </button>

      {/* ── Floating toolbar on text selection ─────────────────────────── */}
      {unlocked && selection && !showForm && (
        <div
          className="annot-toolbar"
          style={{
            top: selection.rect.top + window.scrollY - 48,
            left: selection.rect.left + selection.rect.width / 2,
          }}
        >
          <button className="annot-toolbar-btn" onClick={() => setShowForm(true)}>
            💬 Comment on this
          </button>
        </div>
      )}

      {/* ── Inline comment form ─────────────────────────────────────────── */}
      {unlocked && selection && showForm && (
        <div
          className="annot-form-popup"
          style={{
            top: selection.rect.bottom + window.scrollY + 8,
            left: Math.max(16, Math.min(selection.rect.left, (typeof window !== "undefined" ? window.innerWidth : 800) - 336)),
          }}
        >
          <div className="annot-form-quote">
            &ldquo;{selection.text.length > 120 ? selection.text.slice(0, 120) + "…" : selection.text}&rdquo;
          </div>
          <textarea
            className="annot-textarea"
            placeholder="What's confusing? Ask your question…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            autoFocus
          />
          <input
            className="annot-input"
            placeholder="Your name (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <div className="annot-form-actions">
            <button className="annot-btn-ghost" onClick={cancelForm}>Cancel</button>
            <button
              className="annot-btn-primary"
              onClick={submitAnnotation}
              disabled={submitting || !comment.trim()}
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </div>
      )}

      {/* ── Annotations panel ───────────────────────────────────────────── */}
      {panelOpen && (
        <div className="annot-overlay" onClick={() => setPanelOpen(false)}>
          <aside className="annot-panel" onClick={(e) => e.stopPropagation()}>
            <div className="annot-panel-header">
              <h3>Comments{annotations.length > 0 ? ` (${annotations.length})` : ""}</h3>
              <button className="annot-panel-close" onClick={() => setPanelOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="annot-panel-body">
              {annotations.length === 0 ? (
                <p className="annot-empty">
                  No comments yet.<br />
                  Select any text on the page to leave a question or note.
                </p>
              ) : (
                [...annotations]
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((ann) => (
                    <div key={ann.id} className="annot-thread">
                      <div className="annot-thread-quote">&ldquo;{ann.selectedText.length > 100 ? ann.selectedText.slice(0, 100) + "…" : ann.selectedText}&rdquo;</div>
                      <div className="annot-comment">
                        <p className="annot-comment-text">{ann.comment}</p>
                        <span className="annot-meta">{ann.author} · {fmtDate(ann.createdAt)}</span>
                      </div>

                      {/* Replies */}
                      {ann.replies.length > 0 && (
                        <div className="annot-replies">
                          {ann.replies.map((r) => (
                            <div key={r.id} className="annot-reply">
                              <p className="annot-comment-text">{r.comment}</p>
                              <span className="annot-meta">{r.author} · {fmtDate(r.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply input */}
                      {replyingTo === ann.id ? (
                        <div className="annot-reply-form">
                          <textarea
                            className="annot-textarea annot-textarea--sm"
                            placeholder="Write a reply…"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            autoFocus
                          />
                          <input
                            className="annot-input"
                            placeholder="Your name (optional)"
                            value={replyAuthor}
                            onChange={(e) => setReplyAuthor(e.target.value)}
                          />
                          <div className="annot-form-actions">
                            <button className="annot-btn-ghost" onClick={() => { setReplyingTo(null); setReplyText(""); setReplyAuthor(""); }}>Cancel</button>
                            <button
                              className="annot-btn-primary"
                              onClick={() => submitReply(ann.id)}
                              disabled={submitting || !replyText.trim()}
                            >
                              {submitting ? "…" : "Reply"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="annot-reply-btn" onClick={() => setReplyingTo(ann.id)}>↩ Reply</button>
                      )}
                    </div>
                  ))
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
