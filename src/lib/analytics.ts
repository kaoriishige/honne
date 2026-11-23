declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      targetOrEvent: string | Date,
      params?: Record<string, unknown>
    ) => void;
  }
}

export type CtaLocation =
  | "header"
  | "hero"
  | "mid_page"
  | "pricing"
  | "final_cta";

/**
 * CTAクリックを計測するヘルパー。
 * 将来 Google Analytics（NEXT_PUBLIC_GA_MEASUREMENT_ID）等を設定した際に自動でイベント送信される。
 */
export function trackCtaClick(location: CtaLocation, destination: string) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", "cta_click", {
      event_category: "engagement",
      event_label: location,
      cta_location: location,
      destination,
    });
  }
}
