import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  Trash2,
  EyeOff,
  FileCheck2,
} from "lucide-react";
import { PLANS, TRIAL_LIMITS } from "@/config/plans";
import { CtaLink } from "@/components/lp/CtaLink";
import { FadeInSection } from "@/components/lp/FadeInSection";
import { FaqAccordion } from "@/components/lp/FaqAccordion";

const EMPATHY_ITEMS = [
  "本当は腹が立っているのに、何もなかったように振る舞う。",
  "嫌われたくなくて、自分の気持ちを押し殺してしまう。",
  "誰かに話したいけれど、話した後のことを考えると話せない。",
  "人と比べてしまう自分が嫌になる。",
  "誰にも見せられない感情が、自分の中にある。",
  "何が嫌なのか、自分でもよく分からない。",
];

const THREE_STEPS = [
  {
    step: "STEP 1",
    title: "解放する",
    lead: "まずは、そのまま話してみる。",
    body: "心の中にあることを、自由に言葉にします。文章がまとまっていなくても構いません。怒りも、弱音も、そのまま残せます。",
  },
  {
    step: "STEP 2",
    title: "理解する",
    lead: "自分の気持ちを見つめてみる。",
    body: "AIが記録を整理し、感情や思考の傾向に気づくための問いかけをします。傾向の分析は、違和感があればあなた自身の言葉で訂正できます。",
  },
  {
    step: "STEP 3",
    title: "発見する",
    lead: "過去の自分と、今の自分を比べてみる。",
    body: "記録を積み重ねることで、自分の変化や繰り返している考え方に気づいていきます。過去の記録の振り返りや月間レポートで変化を確かめられます。",
  },
];

const PRIVACY_POINTS = [
  {
    icon: EyeOff,
    title: "他の利用者に公開されない、個人専用の空間",
    description:
      "SNSのような公開機能やいいね機能はありません。書いた本音はあなた以外の利用者には一切表示されません。",
  },
  {
    icon: Lock,
    title: "自分の記録を自分で管理できる設計",
    description:
      "記録した本音や対話内容は暗号化して保存し、いつでも一覧確認・編集・エクスポートができます。",
  },
  {
    icon: FileCheck2,
    title: "データ保存とAI送信の透明性",
    description:
      "AI機能を使う際は、応答に必要な範囲のみを外部AI（OpenAI API）へ送信することを事前に明示します。登録不要の無料体験では記録を永続保存しません。",
  },
  {
    icon: Trash2,
    title: "いつでも削除できる安心感",
    description:
      "個別の記録削除に加え、設定画面から保存データの全削除およびアカウントの完全削除をいつでも実行できます。",
  },
  {
    icon: ShieldCheck,
    title: "広告ターゲティングへの不使用方針",
    description:
      "個人の本音や感情データを広告配信やターゲティング、第三者への提供、無断でのAIモデル学習に利用しない方針です。",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-800 flex flex-col">
      {/* ヘッダー（静かで控えめなナビゲーション） */}
      <header className="fixed top-0 inset-x-0 z-30 bg-[#0B1324]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-medium tracking-[0.12em] text-slate-100"
          >
            <Image
              src="/images/lp-icon.jpg"
              alt="ほんね。"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span>ほんね。</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors px-2 py-1.5"
            >
              ログイン
            </Link>
            <CtaLink
              href="/try"
              location="header"
              className="text-xs sm:text-sm font-medium bg-white/12 hover:bg-white/20 text-white border border-white/20 px-3.5 sm:px-4 py-2 rounded-full transition-colors"
            >
              無料で話してみる
            </CtaLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ============================================================
            セクション1：ファーストビュー
        ============================================================ */}
        <section className="relative min-h-[92vh] sm:min-h-[88vh] flex items-center bg-[#0B1324] text-slate-100 overflow-hidden pt-20 pb-20">
          {/* 夜の窓辺・柔らかな光の背景ビジュアル */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <Image
              src="/images/hero-night-window.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-40"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(11,19,36,0.72) 0%, rgba(11,19,36,0.58) 45%, rgba(11,19,36,0.94) 100%)",
              }}
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8 w-full">
            <p className="text-[11px] sm:text-xs tracking-[0.22em] text-slate-300/80 mb-7">
              誰にも見せない自分と、AIと一緒に向き合う。
            </p>

            <h1 className="text-[28px] sm:text-5xl font-medium tracking-[0.03em] text-white leading-[1.55] sm:leading-[1.45] mb-8">
              誰にも見せなくていい。
              <br />
              誰にも説明しなくていい。
            </h1>

            <div className="text-[15px] sm:text-[17px] text-slate-200/90 leading-[2.0] space-y-5 max-w-xl mb-11">
              <p>
                本当は、誰かに話したいことがある。
                <br />
                でも、誰にも話せない。
              </p>
              <p>
                ここでは、無理に強がらなくていい。
                <br />
                きれいな言葉にしなくてもいい。
              </p>
              <p className="text-slate-100">
                あなたの本音を、AIと一緒に見つめてみませんか。
              </p>
            </div>

            <div className="space-y-3.5 max-w-sm">
              <CtaLink
                href="/try"
                location="hero"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-slate-100 text-[#0B1324] hover:bg-white px-8 py-4 rounded-full text-sm sm:text-[15px] font-medium tracking-wide shadow-lg shadow-black/25 transition-all"
              >
                自分の本音を話してみる
                <ArrowRight className="w-4 h-4" />
              </CtaLink>
              <p className="text-xs text-slate-300/80 pl-1">
                まずは無料でAIとの対話を体験できます。（登録不要・最大
                {TRIAL_LIMITS.maxAttempts}回）
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            セクション2：こんなことはありませんか？
        ============================================================ */}
        <section className="py-24 sm:py-32 px-6 bg-[#F7F8FA]">
          <FadeInSection className="max-w-2xl mx-auto">
            <p className="text-xs tracking-[0.18em] text-slate-400 text-center mb-4">
              EMPATHY
            </p>
            <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 text-center leading-relaxed mb-12">
              誰にも言えない気持ちを、
              <br className="sm:hidden" />
              抱えていませんか？
            </h2>

            <ul className="space-y-3.5 mb-12">
              {EMPATHY_ITEMS.map((text) => (
                <li
                  key={text}
                  className="bg-white border border-slate-200/80 rounded-2xl px-6 py-4.5 text-[14.5px] sm:text-[15.5px] text-slate-700 leading-relaxed flex items-start gap-3.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#1E3A5F]/60 mt-2.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <p className="text-center text-base sm:text-lg font-medium text-[#1E3A5F] leading-relaxed">
              そんな気持ちを、無理に消す必要はありません。
            </p>
          </FadeInSection>
        </section>

        {/* ============================================================
            セクション3：本音を話せる場所
        ============================================================ */}
        <section className="py-24 sm:py-32 px-6 bg-white border-y border-slate-200/70">
          <FadeInSection className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-relaxed">
              ここでは、どんな自分でもいい。
            </h2>

            <div className="space-y-6 text-[15px] sm:text-base text-slate-600 leading-[2.05]">
              <p>
                人に見せるための言葉ではなく、
                <br className="sm:hidden" />
                自分のための言葉を残す場所です。
              </p>
              <p className="text-slate-800 font-medium">
                怒り、嫉妬、不安、弱音、後悔、矛盾した気持ち。
              </p>
              <p>
                きれいにまとめる必要はありません。
                <br />
                誰かに評価されることも、
                <br className="sm:hidden" />
                無理に前向きになる必要もありません。
              </p>
              <p className="text-slate-800 pt-2">
                自分の言葉で、そのまま話してください。
              </p>
            </div>
          </FadeInSection>
        </section>

        {/* ============================================================
            セクション4：AIとの3つのステップ
        ============================================================ */}
        <section className="py-24 sm:py-32 px-6 bg-[#F7F8FA]">
          <FadeInSection className="max-w-4xl mx-auto">
            <div className="text-center mb-14 space-y-3">
              <p className="text-xs tracking-[0.18em] text-slate-400">
                HOW IT WORKS
              </p>
              <h2 className="text-2xl sm:text-3xl font-medium text-slate-900">
                自分と向き合う、3つのステップ
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {THREE_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="bg-white border border-slate-200/80 rounded-2xl p-7 flex flex-col"
                >
                  <span className="text-[11px] font-semibold tracking-[0.18em] text-[#1E3A5F]/75 mb-3">
                    {item.step}
                  </span>
                  <h3 className="text-xl font-medium text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-700 mb-4">
                    「{item.lead}」
                  </p>
                  <p className="text-sm text-slate-600 leading-[1.9]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </FadeInSection>
        </section>

        {/* ============================================================
            セクション5：AIは、あなたを否定しない
        ============================================================ */}
        <section className="py-24 sm:py-32 px-6 bg-[#111C33] text-slate-100">
          <FadeInSection className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
            <div className="md:col-span-6 space-y-6">
              <p className="text-xs tracking-[0.18em] text-slate-400">
                AI COACHING
              </p>
              <h2 className="text-2xl sm:text-3xl font-medium text-white leading-relaxed">
                正解を教えるのではなく、
                <br />
                自分で気づくために。
              </h2>
              <div className="space-y-4 text-sm sm:text-[15px] text-slate-300 leading-[2.0]">
                <p>
                  このAIは、あなたの人生を決める先生ではありません。
                </p>
                <p>
                  無理に励ましたり、正論を押しつけたり、性格を決めつけたりするものでもありません。
                </p>
                <p>
                  あなたの言葉を整理し、必要に応じて問いかけながら、自分の気持ちを理解する手助けをします。
                </p>
                <p className="text-white font-medium pt-1">
                  答えを決めるのは、あなた自身です。
                </p>
              </div>
            </div>

            {/* 静かな対話のイメージ例 */}
            <div className="md:col-span-6">
              <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-6 sm:p-7 space-y-5">
                <p className="text-[11px] tracking-[0.15em] text-slate-400">
                  対話のイメージ
                </p>
                <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-3.5 text-sm text-slate-100 leading-relaxed ml-6">
                  本当は、あの人の成功が面白くない。自分だけ取り残された気がする。
                </div>
                <div className="bg-[#0B1324]/80 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3.5 text-sm text-slate-200 leading-relaxed mr-6">
                  その人の成功を見たとき、羨ましいという気持ちと、自分が取り残されたという気持ちのどちらが強かったですか？
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ※ 否定や評価をせず、一度にひとつの問いかけで自分の本音に近づきます。医療行為や心理疾患の診断は行いません。
                </p>
              </div>
            </div>
          </FadeInSection>
        </section>

        {/* ============================================================
            セクション6：プライバシーへの配慮
        ============================================================ */}
        <section className="py-24 sm:py-32 px-6 bg-white border-b border-slate-200/70">
          <FadeInSection className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
              <p className="text-xs tracking-[0.18em] text-slate-400">
                PRIVACY
              </p>
              <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-relaxed">
                本音を話す場所だからこそ、
                <br className="sm:hidden" />
                プライバシーを大切に。
              </h2>
              <p className="text-sm sm:text-[15px] text-slate-600 leading-[1.9]">
                このサービスでは、個人の本音や感情を扱うため、プライバシーを重要な設計方針としています。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PRIVACY_POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="bg-[#F7F8FA] border border-slate-200/80 rounded-2xl p-6 space-y-2.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#1E3A5F]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-[15px] font-medium text-slate-900">
                      {point.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-[1.85]">
                      {point.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-6">
              <Link
                href="/privacy"
                className="text-slate-700 hover:text-slate-950 underline underline-offset-4"
              >
                プライバシーポリシーを確認する
              </Link>
              <Link
                href="/terms"
                className="text-slate-700 hover:text-slate-950 underline underline-offset-4"
              >
                利用規約を確認する
              </Link>
            </div>
          </FadeInSection>
        </section>

        {/* ============================================================
            セクション7：利用開始への誘導
        ============================================================ */}
        <section className="py-24 sm:py-28 px-6 bg-[#EEF2F6]">
          <FadeInSection className="max-w-2xl mx-auto text-center space-y-7">
            <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-relaxed">
              まずは、自分の本音を
              <br className="sm:hidden" />
              話してみませんか？
            </h2>
            <p className="text-[15px] sm:text-base text-slate-600 leading-[2.0]">
              誰かに話す必要はありません。
              <br />
              無理に答えを出す必要もありません。
              <br />
              まずは、自分の中にある気持ちを言葉にすることから始めてみてください。
            </p>
            <div className="pt-2 space-y-3">
              <CtaLink
                href="/try"
                location="mid_page"
                className="inline-flex items-center justify-center gap-2.5 bg-[#0F172A] text-white hover:bg-[#1E293B] px-8 py-4 rounded-full text-sm sm:text-[15px] font-medium transition-colors"
              >
                無料でAIとの対話を始める
                <ArrowRight className="w-4 h-4" />
              </CtaLink>
              <p className="text-xs text-slate-500">
                自分のペースで、いつでも利用できます。
              </p>
            </div>
          </FadeInSection>
        </section>

        {/* ============================================================
            セクション8：料金案内
        ============================================================ */}
        <section className="py-24 sm:py-32 px-6 bg-white border-y border-slate-200/70">
          <FadeInSection className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <p className="text-xs tracking-[0.18em] text-slate-400">
                PLANS
              </p>
              <h2 className="text-2xl sm:text-3xl font-medium text-slate-900">
                ご利用プランについて
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                まずは無料プランから、ご自身のペースで始められます。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 無料プラン */}
              <div className="rounded-2xl border border-slate-200 bg-[#F7F8FA] p-7 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">
                    まずは気軽に始める
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">
                    {PLANS.free.name}
                  </h3>
                  <p className="text-3xl font-medium text-slate-900 mt-3">
                    無料
                  </p>
                  <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                    {PLANS.free.description}
                  </p>
                  <ul className="space-y-2.5 text-sm text-slate-700 mb-8">
                    {PLANS.free.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <CtaLink
                  href="/signup"
                  location="pricing"
                  className="block text-center py-3 px-5 rounded-full text-sm font-medium bg-[#0F172A] text-white hover:bg-[#1E293B] transition-colors"
                >
                  無料でアカウントを作成する
                </CtaLink>
              </div>

              {/* 有料プラン（予定・想定価格として明示） */}
              <div className="rounded-2xl border border-[#1E3A5F]/30 bg-white p-7 flex flex-col justify-between">
                <div>
                  <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    提供予定・価格検討中
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 mt-2">
                    {PLANS.paid.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-medium text-slate-900">
                      月額 {PLANS.paid.priceJpy}円
                    </span>
                    <span className="text-xs text-slate-500">（想定・予定）</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                    {PLANS.paid.description}
                  </p>
                  <ul className="space-y-2.5 text-sm text-slate-700 mb-8">
                    {PLANS.paid.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className="text-[#1E3A5F] mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-200/70">
                  ※ 上記の月額480円は現時点での想定価格です。正式な料金や提供条件は公開時に確定・ご案内します。まずは無料体験または無料プランでお試しください。
                </p>
              </div>
            </div>
          </FadeInSection>
        </section>

        {/* ============================================================
            セクション9：よくある質問
        ============================================================ */}
        <section className="py-24 sm:py-32 px-6 bg-[#F7F8FA]">
          <FadeInSection className="max-w-2xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <p className="text-xs tracking-[0.18em] text-slate-400">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-medium text-slate-900">
                よくある質問
              </h2>
            </div>

            <FaqAccordion />
          </FadeInSection>
        </section>

        {/* ============================================================
            セクション10：最後のCTA
        ============================================================ */}
        <section className="py-28 sm:py-36 px-6 bg-[#0B1324] text-slate-100 text-center">
          <FadeInSection className="max-w-2xl mx-auto space-y-9">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-[0.04em] text-white leading-relaxed">
              誰にも見せない自分が、ここにいる。
            </h2>
            <div>
              <CtaLink
                href="/try"
                location="final_cta"
                className="inline-flex items-center justify-center gap-2.5 bg-slate-100 text-[#0B1324] hover:bg-white px-9 py-4 rounded-full text-sm sm:text-[15px] font-medium tracking-wide transition-colors"
              >
                自分の本音を話してみる
                <ArrowRight className="w-4 h-4" />
              </CtaLink>
            </div>
          </FadeInSection>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-[#090F1E] text-slate-400 border-t border-white/10 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="tracking-wider">© {new Date().getFullYear()} ほんね。</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/try" className="hover:text-slate-200 transition-colors">
              無料体験
            </Link>
            <Link href="/login" className="hover:text-slate-200 transition-colors">
              ログイン
            </Link>
            <Link
              href="/privacy"
              className="hover:text-slate-200 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-slate-200 transition-colors">
              利用規約
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
