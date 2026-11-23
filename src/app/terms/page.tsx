import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-800">
            ← トップへ戻る
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-3">
            利用規約
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            最終更新日：2026年11月22日
          </p>
        </div>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">1. 本サービスの目的</h2>
          <p>
            「本当の自分」（以下「本サービス」）は、利用者が自身の本音や感情を記録し、AIとの対話を通じて自己理解を深めるための個人向けWebサービスです。
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            2. 医療行為・診断ではないことの確認
          </h2>
          <p>
            本サービスのAIによる対話・感情分析・レポートは、医療行為、心理疾患の診断、治療、カウンセリング、または薬の処方ではありません。心身の不調や緊急の危機がある場合は、必ず医療機関や公的な専門相談窓口へご相談ください。
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            3. 有料プラン・解約
          </h2>
          <p>
            有料プランは月額制の自動継続課金です。解約は設定画面からいつでも手続きでき、解約手続き後も現在の請求期間終了まで有料機能をご利用いただけます。日割り返金は原則として行いません。
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">4. 禁止事項</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>不正アクセス、自動化ツール等による過剰なリクエスト送信</li>
            <li>本サービスの運営やセキュリティを妨害する行為</li>
            <li>法令または公序良俗に反する目的での利用</li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">5. 免責事項</h2>
          <p>
            AIの応答内容の正確性・完全性について保証するものではありません。最終的な判断や行動は利用者ご自身の責任にて行ってください。
          </p>
        </section>
      </div>
    </div>
  );
}
