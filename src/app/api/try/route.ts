import { NextResponse } from "next/server";
import { z } from "zod";
import { TRIAL_LIMITS } from "@/config/plans";
import {
  getOpenAIClient,
  getOpenAIModel,
  isOpenAIConfigured,
} from "@/lib/ai/client";
import { TRIAL_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  CRISIS_RESPONSE_MESSAGE,
  checkCrisisRisk,
} from "@/lib/ai/safety";
import { checkTrialRateLimit } from "@/lib/security/rate-limit";

const trialSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "今の気持ちを少しでも書いてみてください。")
    .max(
      TRIAL_LIMITS.maxChars,
      `無料体験は${TRIAL_LIMITS.maxChars}文字以内で入力してください。`
    ),
  agreedToAiTransmission: z.literal(true, {
    message: "AIサービスへの送信に同意いただいたうえでご利用ください。",
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" },
        { status: 400 }
      );
    }

    const rate = checkTrialRateLimit(request);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error:
            "無料体験の上限回数（3回）に達しました。続けて利用するには無料アカウントを作成してください。",
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // 深刻な自傷・自殺シグナルの二重検知時は通常コーチングを止め安全案内を返す（永続保存なし）
    if (await checkCrisisRisk(parsed.data.content)) {
      const res = NextResponse.json({
        reply: CRISIS_RESPONSE_MESSAGE,
        isSafetyResponse: true,
        remaining: rate.remaining,
      });
      if (rate.nextCookieHeader) {
        res.headers.set("Set-Cookie", rate.nextCookieHeader);
      }
      return res;
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "AI機能（OPENAI_API_KEY）がサーバーに設定されていないため、現在応答を生成できません。",
        },
        { status: 503 }
      );
    }

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.7,
      max_tokens: 350,
      messages: [
        { role: "system", content: TRIAL_SYSTEM_PROMPT },
        { role: "user", content: parsed.data.content },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "今、そのお気持ちの中で一番引っかかっているのはどの部分でしょうか？";

    const res = NextResponse.json({
      reply,
      isSafetyResponse: false,
      remaining: rate.remaining,
    });
    if (rate.nextCookieHeader) {
      res.headers.set("Set-Cookie", rate.nextCookieHeader);
    }
    return res;
  } catch {
    return NextResponse.json(
      { error: "応答の生成中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
