import Link from "next/link";
import { Lock, MessageCircle, Compass, ShieldCheck, ArrowRight } from "lucide-react";
import { PLANS } from "@/config/plans";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
            本当の自分
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              ログイン
            </Link>
            <Link
              href="/try"
              className="text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors"
            >
              無料で体験する
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ヒーローセクション */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <p className="text-xs sm:text-sm tracking-widest text-slate-500 mb-4">
            誰にも見せなくていい。誰にも説明しなくていい。
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-tight mb-6">
            誰にも見せない、本当の自分。
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto mb-4">
            いい人を演じなくていい。正しいことを書かなくていい。
            <br className="hidden sm:inline" />
            誰かに理解してもらう必要もない。
            <br />
            ここでは、自分の本音と向き合えます。
          </p>
          <p className="text-sm text-slate-500 mb-10">
            ここでは、本当のことを書いていい。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/try"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-7 py-3.5 rounded-xl text-sm font-medium transition-colors"
            >
              無料で体験する（登録不要）
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 px-7 py-3.5 rounded-xl text-sm font-medium transition-colors"
            >
              ログインする
            </Link>
          </div>
        </section>

        {/* 4つの特徴 */}
        <section className="bg-white border-y border-slate-200 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">
                評価も、比較も、説教もない場所
              </h2>
              <p className="text-sm text-slate-600">
                「解放する」「理解する」「発見する」の3段階で、自分自身と静かに向き合えます。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 text-slate-700">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  本音を自由に記録できる
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  怒り、嫉妬、不安、孤独、後悔、欲望。きれいな言葉に整える必要はありません。今の気持ちをそのまま吐き出して残せます。
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 text-slate-700">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  AIと一緒に自分の感情を整理できる
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  AIは先生でも診断者でもありません。否定も説教もせず、決めつけずに「一つの問い」を返すことで、あなた自身の気づきを支えます。
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 text-slate-700">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  過去の記録から自分の傾向を発見できる
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  繰り返し出てくる悩みや、感情が揺れやすい場面を整理。過去と現在を比べることで、自分自身の変化に気づけます。
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 text-slate-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  他の利用者に公開されない個人専用サービス
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  SNSのような公開機能やいいね機能はありません。書いた記録は暗号化して保存され、あなた以外の誰にも見られません。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* プライバシーとAIへのデータ送信について */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">
              プライバシーとAIへのデータ送信について
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                本サービスでは、非常に個人的な記録を扱うため、厳格なプライバシー設計を行っています。
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>完全非公開・暗号化保存：</strong>
                  記録された本音や対話内容は暗号化して保存され、他の利用者への公開機能はありません。また、運営者が個人の本音を閲覧する管理機能も設けていません。
                </li>
                <li>
                  <strong>AIサービス（OpenAI API）への送信：</strong>
                  AI対話・感情分析・月間レポート機能を利用する際、応答生成に必要な範囲の文章のみを暗号化通信（HTTPS）でOpenAI APIへ送信します。送信された文章を広告配信や公開、AIモデルの再学習に利用することはありません。
                </li>
                <li>
                  <strong>データの管理権はあなたにあります：</strong>
                  記録のエクスポート、保存データの全削除、アカウント削除をいつでもご自身で実行できます。
                </li>
              </ul>
              <p className="pt-2">
                詳しくは{" "}
                <Link href="/privacy" className="text-slate-900 underline underline-offset-4">
                  プライバシーポリシー
                </Link>{" "}
                をご確認ください。
              </p>
            </div>
          </div>
        </section>

        {/* 料金プラン */}
        <section className="bg-white border-t border-slate-200 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
                シンプルな料金プラン
              </h2>
              <p className="text-sm text-slate-600">
                まずは無料プランから始められます。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[PLANS.free, PLANS.paid].map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 border ${
                    plan.id === "paid"
                      ? "border-slate-900 bg-slate-50/70"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <h3 className="text-base font-semibold text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">
                    {plan.billingCycleLabel}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 mb-5">
                    {plan.description}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block text-center py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                      plan.id === "paid"
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-white text-slate-800 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {plan.id === "paid" ? "アカウントを作成して始める" : "無料で始める"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} 本当の自分</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-800">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-slate-800">
              利用規約
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
