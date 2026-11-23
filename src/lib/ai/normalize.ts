import type { AnalysisResult, MonthlyReportData } from "@/types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
  return cleaned.length > 0 ? cleaned : fallback;
}

export function normalizeAnalysisResult(raw: unknown): AnalysisResult {
  const obj =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const obs =
    typeof obj.observations === "object" && obj.observations !== null
      ? (obj.observations as Record<string, unknown>)
      : {};

  return {
    summary: asString(
      obj.summary,
      "記録をもとに、現時点で見えてきた感情や思考の傾向を整理しました。"
    ),
    observations: {
      frequentEmotions: asStringArray(obs.frequentEmotions, [
        "記録から特定の傾向を抽出中",
      ]),
      emotionChanges: asString(
        obs.emotionChanges,
        "記録が増えることで変化の傾向がより見えやすくなります。"
      ),
      recurringWorries: asStringArray(obs.recurringWorries, [
        "現時点では明確な繰り返しは抽出されていません",
      ]),
      relationshipThemes: asStringArray(obs.relationshipThemes, [
        "特筆すべき人間関係のテーマは未抽出です",
      ]),
      selfCriticalPatterns: asStringArray(obs.selfCriticalPatterns, [
        "強い自己否定の表現は特に見当たりませんでした",
      ]),
      triggerSituations: asStringArray(obs.triggerSituations, [
        "特定の引き金となる状況は記録を重ねることで見えてきます",
      ]),
      pastVsPresent: asString(
        obs.pastVsPresent,
        "比較できる期間の記録がまだ少ないため、今後の記録とあわせて振り返ることができます。"
      ),
    },
    hypotheses: asStringArray(obj.hypotheses, [
      "いくつかの感情が重なっている可能性がありますが、当てはまらない場合は訂正してください。",
    ]),
    checkQuestion: asString(
      obj.checkQuestion,
      "この整理の中で、しっくりくる部分や『少し違うな』と感じる部分はありますか？"
    ),
  };
}

export function normalizeMonthlyReport(raw: unknown): MonthlyReportData {
  const obj =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  return {
    frequentEmotions: asStringArray(obj.frequentEmotions, ["記録から抽出中"]),
    recurringWorries: asStringArray(obj.recurringWorries, [
      "今月は特定の悩みの繰り返しは目立ちませんでした",
    ]),
    comparisonWithPrevMonth: asString(
      obj.comparisonWithPrevMonth,
      "前月の記録がないため、今月の特徴を中心に整理しています。"
    ),
    thinkingPatterns: asStringArray(obj.thinkingPatterns, [
      "記録を続けることで、思考のクセが少しずつ見えてきます",
    ]),
    questionForSelf: asString(
      obj.questionForSelf,
      "今月の自分の中で、一番大切にしたかった気持ちは何でしたか？"
    ),
    reflectionForNextMonth: asString(
      obj.reflectionForNextMonth,
      "無理に答えを出そうとせず、来月もそのままの気持ちを言葉にしてみてください。"
    ),
  };
}
