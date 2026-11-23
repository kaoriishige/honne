"use client";

import React, { useEffect, useRef, useState } from "react";

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * スマートフォン（縦長セクション・iOS Safari等）で非表示のまま残るのを防ぐため、
 * threshold: 0 + 余裕ある rootMargin + フォールバックタイマーで必ず表示される安全設計にしている。
 */
export function FadeInSection({
  children,
  className = "",
}: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [animateReady, setAnimateReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const rect = el.getBoundingClientRect();
    // すでに画面内または通過済みの要素はそのまま表示
    if (rect.top < window.innerHeight + 60) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      setAnimateReady(true);
      setVisible(false);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px 120px 0px" }
    );

    observer.observe(el);

    // 万が一スクロールイベント等で Observer が発火しない環境でも表示を保証
    const handleScroll = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 120) {
        setVisible(true);
        observer.disconnect();
        window.removeEventListener("scroll", handleScroll);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${
        animateReady ? "transition-all duration-500 ease-out" : ""
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${className}`}
    >
      {children}
    </div>
  );
}
