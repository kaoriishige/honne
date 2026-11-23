import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getEmotionMeta } from "@/config/emotions";
import { getPlanConfig } from "@/config/plans";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOrCreateUserProfile, verifyRequestAuth } from "@/lib/security/auth";
import { decryptText, encryptText } from "@/lib/security/crypto";
import {
  getOpenAIClient,
  getOpenAIModel,
  isOpenAIConfigured,
} from "@/lib/ai/client";
import { MONTHLY_REPORT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { normalizeMonthlyReport } from "@/lib/ai/normalize";
import { recordAiUsage } from "@/lib/ai/usage";
import type { MonthlyReportData, MonthlyReportItem } from "@/types";

function getPreviousMonth(targetMonth: string): string {
  const [yStr, mStr] = targetMonth.split("-");
  let y = Number(yStr);
  let m = Number(mStr) - 1;
  if (m === 0) {
    y -= 1;
    m = 12;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function getMonthRange(targetMonth: string): { start: Date; end: Date } {
  const [yStr, mStr] = targetMonth.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

export async function GET(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("reports")
      .orderBy("targetMonth", "desc")
      .limit(12)
      .get();

    const reports: MonthlyReportItem[] = [];
    for (const doc of snap.docs) {
      const d = doc.data();
      try {
        const parsed = JSON.parse(
          decryptText(String(d.reportEncrypted ?? ""))
        ) as MonthlyReportData;
        reports.push({
          targetMonth: String(d.targetMonth ?? doc.id),
          entryCount: Number(d.entryCount ?? 0),
          report: parsed,
          createdAt:
            d.createdAt instanceof Timestamp
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
        });
      } catch {
        // skip corrupted item
      }
    }

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json(
      { error: "月間レポートの取得に失敗しました。" },
      { status: 500 }
    );
  }
}

const createReportSchema = z.object({
  targetMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "対象月は YYYY-MM 形式で指定してください。"),
});

export async function POST(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const profile = await getOrCreateUserProfile(user);
    const planConfig = getPlanConfig(profile.plan);

    // サーバー側で有料プラン権限を厳密チェック
    if (!planConfig.limits.monthlyReportEnabled) {
      return NextResponse.json(
        {
          error: "月間レポートは有料プラン限定の機能です。",
          requiresPaidPlan: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "対象月を確認してください。" },
        { status: 400 }
      );
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "AI機能（OPENAI_API_KEY）がサーバーに設定されていないため、レポートを作成できません。",
        },
        { status: 503 }
      );
    }

    const targetMonth = parsed.data.targetMonth;
    const prevMonth = getPreviousMonth(targetMonth);
    const currentRange = getMonthRange(targetMonth);
    const prevRange = getMonthRange(prevMonth);

    const entriesCol = getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("entries");

    const [currentSnap, prevSnap] = await Promise.all([
      entriesCol
        .where("createdAt", ">=", Timestamp.fromDate(currentRange.start))
        .where("createdAt", "<", Timestamp.fromDate(currentRange.end))
        .orderBy("createdAt", "desc")
        .limit(40)
        .get(),
      entriesCol
        .where("createdAt", ">=", Timestamp.fromDate(prevRange.start))
        .where("createdAt", "<", Timestamp.fromDate(prevRange.end))
        .orderBy("createdAt", "desc")
        .limit(15)
        .get(),
    ]);

    if (currentSnap.empty) {
      return NextResponse.json(
        {
          error: `${targetMonth} の記録がまだないため、月間レポートを作成できません。`,
        },
        { status: 400 }
      );
    }

    const formatSnap = (
      snap: FirebaseFirestore.QuerySnapshot,
      charLimit: number
    ) =>
      snap.docs
        .reverse()
        .map((doc) => {
          const d = doc.data();
          const dateStr =
            d.createdAt instanceof Timestamp
              ? d.createdAt.toDate().toISOString().slice(0, 10)
              : "";
          const label = getEmotionMeta(String(d.emotion ?? "other")).label;
          let text = "";
          try {
            text = decryptText(String(d.contentEncrypted ?? "")).slice(
              0,
              charLimit
            );
          } catch {
            text = "";
          }
          return `[${dateStr} / ${label}] ${text}`;
        })
        .join("\n");

    const currentText = formatSnap(currentSnap, 260);
    const prevText = prevSnap.empty
      ? "（前月の記録なし）"
      : formatSnap(prevSnap, 160);

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.5,
      max_tokens: 1100,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MONTHLY_REPORT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `対象月: ${targetMonth}（${currentSnap.size}件）\n${currentText}\n\n比較用・前月(${prevMonth})の記録抜粋:\n${prevText}`,
        },
      ],
    });

    const rawJson = completion.choices[0]?.message?.content?.trim() || "{}";
    let rawParsed: unknown = {};
    try {
      rawParsed = JSON.parse(rawJson);
    } catch {
      rawParsed = {};
    }
    const reportData = normalizeMonthlyReport(rawParsed);

    const now = Timestamp.now();
    await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("reports")
      .doc(targetMonth)
      .set({
        targetMonth,
        entryCount: currentSnap.size,
        reportEncrypted: encryptText(JSON.stringify(reportData)),
        createdAt: now,
      });

    await recordAiUsage({
      uid: user.uid,
      kind: "analysis",
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    });

    const item: MonthlyReportItem = {
      targetMonth,
      entryCount: currentSnap.size,
      report: reportData,
      createdAt: now.toDate().toISOString(),
    };

    return NextResponse.json({ report: item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "月間レポートの作成に失敗しました。" },
      { status: 500 }
    );
  }
}
