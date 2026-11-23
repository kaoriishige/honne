import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/security/auth";
import type { CollectionReference } from "firebase-admin/firestore";

const deleteSchema = z.object({
  mode: z.enum(["data_only", "account"]),
});

async function deleteCollection(colRef: CollectionReference) {
  const snap = await colRef.limit(200).get();
  if (snap.empty) return;

  const batch = colRef.firestore.batch();
  for (const doc of snap.docs) {
    // conversations 配下の messages も削除
    const subCols = await doc.ref.listCollections();
    for (const sub of subCols) {
      await deleteCollection(sub);
    }
    batch.delete(doc.ref);
  }
  await batch.commit();

  if (snap.size >= 200) {
    await deleteCollection(colRef);
  }
}

export async function POST(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "削除モードが正しくありません。" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);

    // 記録・会話・分析・レポートを削除
    const targetSubCollections = [
      "entries",
      "conversations",
      "analyses",
      "reports",
    ];
    for (const name of targetSubCollections) {
      await deleteCollection(userRef.collection(name));
    }

    if (parsed.data.mode === "account") {
      // usage / payments / ユーザードキュメント / Firebase Auth アカウントも完全削除
      await deleteCollection(userRef.collection("usage"));
      await deleteCollection(userRef.collection("payments"));
      await userRef.delete();
      await getAdminAuth().deleteUser(user.uid);
    }

    return NextResponse.json({ deleted: true, mode: parsed.data.mode });
  } catch {
    return NextResponse.json(
      { error: "削除処理に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
