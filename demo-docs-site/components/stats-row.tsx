"use client";
import { useEffect, useState } from "react";

const API = "https://openclaw.aiedi.cn/api/stats";

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return value;
}

function formatNum(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ raw, suffix, label }: { raw: number; suffix: string; label: string }) {
  const animated = useCountUp(raw);
  return (
    <div className="stat-card">
      <span className="stat-number">{formatNum(animated)}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function StatsRow({
  articleCount,
  lang,
}: {
  articleCount: number;
  lang: "zh" | "en";
}) {
  const [visits, setVisits] = useState(0);
  const [users, setUsers] = useState(0);

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(d => {
        setVisits(d.visits ?? 0);
        setUsers(d.users ?? 0);
      })
      .catch(() => {});
  }, []);

  const L = lang === "zh"
    ? { visits: "总访问量", users: "注册用户", articles: "文档文章", topics: "覆盖主题" }
    : { visits: "Total Visits", users: "Registered Users", articles: "Doc Articles", topics: "Topics Covered" };

  return (
    <div className="stats-row">
      <StatCard raw={visits}       suffix="+" label={L.visits}   />
      <StatCard raw={users}        suffix="+" label={L.users}    />
      <StatCard raw={articleCount} suffix=""  label={L.articles} />
      <StatCard raw={6}            suffix="+" label={L.topics}   />
    </div>
  );
}
