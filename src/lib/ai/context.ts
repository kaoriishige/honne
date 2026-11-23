import { Timestamp } from "firebase-admin/firestore";
import { getEmotionMeta } from "@/config/emotions";
import { getAdminDb } from "@/lib/firebase/admin";
import { decryptText } from "@/lib/security/crypto";
import type { AnalysisResult, MonthlyReportData } from "@/types";

function safeDecrypt(val: unknown): string {
  if (typeof val !== "string" || !val) return "";
  try {
    return decryptText(val);
  } catch {
    return "";
  }
}

/**
 * ログイン本人専用の過去コンテキストを必要最小限だけ抽出し、
 * AIコーチングが過去の記録・最新の傾向・本人の訂正メモを踏まえて対話できるようにする。
 * ※ 他のユーザーのデータは一切参照しない。
 */
export async function buildPersonalAiContext(uid: string): Promise<string> {
  try {
    const userRef = getAdminDb().collection("users").doc(uid);

    const [entriesSnap, analysesSnap, reportsSnap] = await Promise.all([
      userRef
        .collection("entries")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get(),
      userRef
        .collection("analyses")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get(),
      userRef
        .collection("reports")
        .orderBy("targetMonth", "desc")
        .limit(1)
        .get(),
    ]);

    const sections: string[] = [];

    // 1. 直近の本音記録（最新5件・各120文字まで）
    if (!entriesSnap.empty) {
      const lines = entriesSnap.docs
        .reverse()
        .map((doc) => {
          const d = doc.data();
          const dateStr =
            d.createdAt instanceof Timestamp
              ? d.createdAt.toDate().toISOString().slice(0, 10)
              : "";
          const emotionLabel = getEmotionMeta(
            String(d.emotion ?? "other")
          ).label;
          const text = safeDecrypt(d.contentEncrypted)
            .replace(/\s+/g, " ")
            .slice(0, 120);
          return text ? `- [${dateStr} / ${emotionLabel}] ${text}` : "";
        })
        .filter(Boolean);

      if (lines.length > 0) {
        sections.push(`【本人の直近の本音記録】\n${lines.join("\n")}`);
      }
    }

    // 2. 最新の感情分析と本人による訂正メモ（訂正メモは最優先で尊重）
    if (!analysesSnap.empty) {
      const d = analysesSnap.docs[0].data();
      const rawJson = safeDecrypt(d.resultEncrypted);
      const correction = safeDecrypt(d.userCorrectionEncrypted);
      const analysisParts: string[] = [];

      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson) as Partial<AnalysisResult>;
          if (parsed.summary) {
            analysisParts.push(`前回の傾向整理：${parsed.summary.slice(0, 180)}`);
          }
          if (parsed.observations?.recurringWorries?.length) {
            analysisParts.push(
              `繰り返しの悩み：${parsed.observations.recurringWorries
                .slice(0, 3)
                .join(" / ")}`
            );
          }
        } catch {
          // ignore malformed json
        }
      }

      if (correction) {
        analysisParts.push(
          `★本人による訂正メモ（AIの過去推測より最優先で尊重すること）：${correction.slice(
            0,
            240
          )}`
        );
      }

      if (analysisParts.length > 0) {
        sections.push(`【前回の感情分析と本人の訂正】\n${analysisParts.join("\n")}`);
      }
    }

    // 3. 最新の月間レポートの思考パターン（ある場合のみ）
    if (!reportsSnap.empty) {
      const d = reportsSnap.docs[0].data();
      const rawReport = safeDecrypt(d.reportEncrypted);
      if (rawReport) {
        try {
          const parsed = JSON.parse(rawReport) as Partial<MonthlyReportData>;
          if (parsed.thinkingPatterns?.length) {
            sections.push(
              `【直近の月間レポート（${d.targetMonth ?? ""}）で気づいた思考パターン】\n- ${parsed.thinkingPatterns
                .slice(0, 3)
                .join("\n- ")}`
            );
          }
        } catch {
          // ignore
        }
      }
    }

    if (sections.length === 0) return "";
    return sections.join("\n\n").slice(0, 1300);
  } catch {
    // コンテキスト取得に失敗しても対話自体は継続する
    return "";
  }
}
