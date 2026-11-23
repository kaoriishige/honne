import { ImageResponse } from "next/og";

export const alt = "ほんね。｜誰にも見せない本音と向き合うAI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background:
            "linear-gradient(135deg, #090F1E 0%, #111C33 55%, #1A2B4C 100%)",
          color: "#F8FAFC",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: "0.18em",
            color: "#94A3B8",
            marginBottom: 28,
          }}
        >
          ほんね。
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 54,
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: "0.02em",
            marginBottom: 28,
          }}
        >
          <span>誰にも見せなくていい。</span>
          <span>誰にも説明しなくていい。</span>
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#CBD5E1",
            lineHeight: 1.6,
          }}
        >
          誰にも見せない自分と、AIと一緒に向き合う。
        </div>
      </div>
    ),
    { ...size }
  );
}
