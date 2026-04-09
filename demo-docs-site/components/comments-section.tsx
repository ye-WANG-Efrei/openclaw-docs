"use client";
import { useEffect, useState } from "react";
import { AuthModal, loadUser, clearUser, type AuthUser } from "@/components/auth-modal";

const API = "https://openclaw.aiedi.cn/api/comments";

interface Reply {
  id: string;
  content: string;
  username: string;
  user_id: string;
  parent_id: string;
  created_at: number;
}

interface Comment {
  id: string;
  content: string;
  username: string;
  user_id: string;
  created_at: number;
  replies: Reply[];
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

function Avatar({ name }: { name: string }) {
  const letter = name?.[0]?.toUpperCase() || "?";
  const colors = ["#FF9F0A","#30D158","#32ADE6","#FF375F","#BF5AF2","#FF6961"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="comment-avatar" style={{ background: color }}>{letter}</div>
  );
}

function ReplyForm({ onSubmit, onCancel }: { onSubmit: (content: string) => Promise<void>; onCancel: () => void }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await onSubmit(content.trim());
    setContent("");
    setLoading(false);
  }

  return (
    <form className="reply-form" onSubmit={submit}>
      <textarea
        className="comment-textarea small"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="写下回复…"
        rows={2}
        autoFocus
      />
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>取消</button>
        <button type="submit" className="btn-primary small" disabled={loading || !content.trim()}>
          {loading ? "发送中…" : "回复"}
        </button>
      </div>
    </form>
  );
}

export function CommentsSection({ articleSlug }: { articleSlug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(loadUser());
    fetchComments();
  }, [articleSlug]);

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch(`${API}?slug=${encodeURIComponent(articleSlug)}`);
      if (res.ok) setComments(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setShowAuth(true); return; }
    if (!newComment.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ articleSlug, content: newComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "发送失败"); return; }
      setComments(prev => [...prev, data]);
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  }

  async function postReply(commentId: string, content: string) {
    if (!user) { setShowAuth(true); return; }
    const res = await fetch(`${API}/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const reply = await res.json();
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ));
      setReplyingTo(null);
    }
  }

  async function deleteComment(id: string, isReply: boolean, parentId?: string) {
    if (!user) return;
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (res.ok) {
      if (isReply && parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== id) } : c
        ));
      } else {
        setComments(prev => prev.filter(c => c.id !== id));
      }
    }
  }

  function logout() {
    clearUser();
    setUser(null);
  }

  const totalCount = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <section className="comments-section">
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={(u) => { setUser(u); setShowAuth(false); }}
        />
      )}

      {/* Header */}
      <div className="comments-header">
        <h3 className="comments-title">
          评论
          {totalCount > 0 && <span className="comments-count">{totalCount}</span>}
        </h3>
        <div className="comments-auth-bar">
          {user ? (
            <div className="user-pill">
              <Avatar name={user.username} />
              <span>{user.username}</span>
              <button className="btn-ghost tiny" onClick={logout}>退出</button>
            </div>
          ) : (
            <button className="btn-primary small" onClick={() => setShowAuth(true)}>
              登录 / 注册
            </button>
          )}
        </div>
      </div>

      {/* New comment form */}
      <form className="new-comment-form" onSubmit={postComment}>
        <textarea
          className="comment-textarea"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder={user ? "写下你的评论…" : "登录后参与讨论"}
          rows={3}
          onClick={() => !user && setShowAuth(true)}
          readOnly={!user}
        />
        {error && <p className="comment-error">{error}</p>}
        {user && (
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting || !newComment.trim()}>
              {submitting ? "发送中…" : "发表评论"}
            </button>
          </div>
        )}
      </form>

      {/* Comment list */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">加载中…</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">暂无评论，来抢沙发吧！</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <Avatar name={comment.username} />
              <div className="comment-body">
                <div className="comment-meta">
                  <strong>{comment.username}</strong>
                  <span className="comment-time">{timeAgo(comment.created_at)}</span>
                  {user?.id === comment.user_id && (
                    <button className="btn-delete" onClick={() => deleteComment(comment.id, false)}>删除</button>
                  )}
                </div>
                <p className="comment-content">{comment.content}</p>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="replies-list">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="reply-item">
                        <Avatar name={reply.username} />
                        <div className="comment-body">
                          <div className="comment-meta">
                            <strong>{reply.username}</strong>
                            <span className="comment-time">{timeAgo(reply.created_at)}</span>
                            {user?.id === reply.user_id && (
                              <button className="btn-delete" onClick={() => deleteComment(reply.id, true, comment.id)}>删除</button>
                            )}
                          </div>
                          <p className="comment-content">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply button / form */}
                {replyingTo === comment.id ? (
                  <ReplyForm
                    onSubmit={(content) => postReply(comment.id, content)}
                    onCancel={() => setReplyingTo(null)}
                  />
                ) : (
                  <button className="btn-reply" onClick={() => user ? setReplyingTo(comment.id) : setShowAuth(true)}>
                    回复
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
