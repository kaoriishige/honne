import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-800">
            ← トップへ戻る
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-3">
            プライバシーポリシー
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            最終更新日：2026年11月22日
          </p>
        </div>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">1. 基本方針</h2>
          <p>
            「ほんね。」（以下「本サービス」）は、利用者が誰にも見せない本音や感情を安心して記録できる個人専用サービスです。利用者のプライバシー保護を最優先とし、個人情報および記録データを厳格に取り扱います。
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            2. 収集する情報と利用目的
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>メールアドレス・認証情報：本人認証、ログイン、重要なお知らせの送付</li>
            <li>本音の記録・感情カテゴリ・AIとの対話内容：本人の振り返り、AIコーチング、感情分析、月間レポートの提供</li>
            <li>決済状態・契約履歴：有料プランの提供および課金管理</li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            3. データの暗号化とアクセス制限
          </h2>
          <p>
            利用者が記録した本音・AI対話・分析結果・月間レポートの本文は、通信経路（HTTPS）の暗号化に加え、アプリケーション層で暗号化したうえでデータベースに保存します。他の利用者に公開されることはなく、運営者が利用者の本音本文を閲覧する管理機能も設けません。
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            4. 外部サービスへのデータ送信について
          </h2>
          <p>本サービスは機能提供のため、以下の外部サービスを利用します。</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Firebase（Google LLC）：</strong>
              ユーザー認証および暗号化済みデータの保存のために利用します。
            </li>
            <li>
              <strong>OpenAI API（OpenAI, Inc.）：</strong>
              AIコーチング・感情分析・月間レポート・無料体験の応答生成のため、必要な範囲の入力テキストのみを送信します。本サービスは利用者の文章を無断で公開・広告利用せず、API経由で送信されたデータはモデルの学習に利用されない設定・契約範囲で利用します。
            </li>
            <li>
              <strong>Stripe（Stripe, Inc.）：</strong>
              有料プランの決済処理および定期課金管理のために利用します。クレジットカード情報はStripeが直接処理し、本サービスのサーバーには保存しません。
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            5. 広告・第三者提供の禁止
          </h2>
          <p>
            利用者の本音や感情データを、広告配信、ターゲティング広告、または第三者への販売・提供に利用することは一切ありません。
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            6. データのエクスポートおよび削除
          </h2>
          <p>
            利用者は設定画面からいつでも自身の記録データをエクスポートでき、また保存データの全削除およびアカウントの完全削除を実行できます。
          </p>
        </section>
      </div>
    </div>
  );
}
