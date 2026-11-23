import { getOpenAIClient, isOpenAIConfigured } from "@/lib/ai/client";

/**
 * 深刻な自傷・自殺リスクの検知と安全対応メッセージ
 * 1次チェック：日本語の直接・遠回し表現パターン（即時・無料）
 * 2次チェック：OpenAI Moderation API（無料・self-harm 系カテゴリ）
 * 該当する場合は通常のAIコーチングを行わず、専門相談窓口を案内する。
 */

const CRISIS_PATTERNS: RegExp[] = [
  /死にたい/,
  /死んでしまいたい/,
  /死のうと思/,
  /自殺(したい|しよう|する|を考える|方法)/,
  /消えてなくなりたい/,
  /いなくなりたい/,
  /生きている意味がない/,
  /生きていたくない/,
  /もう(全部|すべて|人生を?)終わりにしたい/,
  /首を吊/,
  /飛び降り(たい|よう)/,
  /飛び込み(たい|そう)/,
  /リストカット/,
  /手首を切/,
  /自傷(して|したい|する)/,
  /オーバードーズ/,
  /薬を大量に飲/,
  /命を絶/,
  /楽になりたい.*死/,
];

export function detectCrisisSignal(text: string): boolean {
  const normalized = text.replace(/\s+/g, "");
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export async function checkCrisisRisk(text: string): Promise<boolean> {
  // 1次チェック（即時パターン検知）
  if (detectCrisisSignal(text)) {
    return true;
  }

  // 2次チェック（OpenAI Moderation API・無料）
  if (!isOpenAIConfigured()) {
    return false;
  }

  try {
    const client = getOpenAIClient();
    const moderation = await client.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });
    const categories = moderation.results?.[0]?.categories;
    if (
      categories?.["self-harm"] ||
      categories?.["self-harm/intent"] ||
      categories?.["self-harm/instructions"]
    ) {
      return true;
    }
  } catch {
    // Moderation API の一時障害時は 1次チェック結果にフォールバックし通常応答を止めない
  }

  return false;
}

export const CRISIS_RESPONSE_MESSAGE = `今、とてもつらいお気持ちの中にいらっしゃることが伝わってきました。

このアプリは医療や緊急の支援を行うことができないため、ここでは通常の対話をいったん止めています。どうかお一人で抱え込まず、身近な信頼できる方や、以下の専門相談窓口・緊急サービスへ頼ってみてください。

【こころの相談窓口（日本国内）】
・よりそいホットライン（24時間無料）：0120-279-338
・こころの健康相談統一ダイヤル：0570-064-556
・いのちの電話：0570-783-556（10:00〜22:00） / 0120-783-556（16:00〜21:00）
・SNS相談（厚生労働省「まもろうよ こころ」）：https://www.mhlw.go.jp/mamorouyokokoro/

今すぐ命の危険を感じる場合は、迷わず 110番 または 119番 へご連絡ください。`;
