import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/security/auth";
import { decryptText } from "@/lib/security/crypto";

function safeDecrypt(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  try {
    return decryptText(value);
  } catch {
    return "";
  }
}

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return null;
}

export async function GET(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);

    const [entriesSnap, conversationsSnap, analysesSnap, reportsSnap] =
      await Promise.all([
        userRef.collection("entries").orderBy("createdAt", "desc").get(),
        userRef.collection("conversations").orderBy("createdAt", "desc").get(),
        userRef.collection("analyses").orderBy("createdAt", "desc").get(),
        userRef.collection("reports").orderBy("createdAt", "desc").get(),
      ]);

    const entries = entriesSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        emotion: d.emotion,
        content: safeDecrypt(d.contentEncrypted),
        createdAt: toIso(d.createdAt),
        updatedAt: toIso(d.updatedAt),
      };
    });

    const conversations = await Promise.all(
      conversationsSnap.docs.map(async (doc) => {
        const d = doc.data();
        const msgsSnap = await doc.ref
          .collection("messages")
          .orderBy("createdAt", "asc")
          .get();
        return {
          id: doc.id,
          title: safeDecrypt(d.titleEncrypted),
          createdAt: toIso(d.createdAt),
          messages: msgsSnap.docs.map((m) => ({
            role: m.data().role,
            content: safeDecrypt(m.data().contentEncrypted),
            createdAt: toIso(m.data().createdAt),
          })),
        };
      })
    );

    const analyses = analysesSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        type: d.type,
        result: safeDecrypt(d.resultEncrypted),
        userCorrection: safeDecrypt(d.userCorrectionEncrypted) || null,
        createdAt: toIso(d.createdAt),
      };
    });

    const reports = reportsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        targetMonth: d.targetMonth,
        report: safeDecrypt(d.reportEncrypted),
        createdAt: toIso(d.createdAt),
      };
    });

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      service: "本当の自分",
      entries,
      conversations,
      analyses,
      reports,
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="hontouno-jibun-export-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "データのエクスポートに失敗しました。" },
      { status: 500 }
    );
  }
}
