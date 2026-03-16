"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { SiteNavigation } from "@/lib/docs";
import { buildLanguageHref, type Language } from "@/lib/i18n";

export function MobileNav({
  currentSlug,
  language,
  navigation,
}: {
  currentSlug: string;
  language: Language;
  navigation: SiteNavigation;
}) {
  const [open, setOpen] = useState(false);

  // 路由切换时自动关闭
  useEffect(() => {
    setOpen(false);
  }, [currentSlug]);

  // 打开时禁止 body 滚动
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const allItems = navigation.sections.flatMap((s) => s.items);

  return (
    <>
      {/* 汉堡按钮 */}
      <button
        aria-label={open ? "关闭菜单" : "打开菜单"}
        className="mobile-menu-btn"
        onClick={() => setOpen(!open)}
      >
        <span className={`burger ${open ? "open" : ""}`} />
      </button>

      {/* 浮层遮罩 */}
      {open && (
        <div className="mobile-overlay" onClick={() => setOpen(false)} />
      )}

      {/* 浮窗 */}
      {open && (
        <div className="mobile-popup">
          <nav className="mobile-popup-inner">
            {allItems.map((item) => {
              const active = item.slug === currentSlug;
              return (
                <Link
                  className={`mobile-popup-link${active ? " active" : ""}`}
                  href={buildLanguageHref(`/docs/${item.slug}`, language)}
                  key={item.slug}
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
