"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "誰かに自分の本音を見られますか？",
    answer:
      "他の利用者に公開される機能はありません。あなた専用の非公開スペースとして設計されており、記録や対話内容は暗号化して保存されます。また、運営者が個人の本音本文を閲覧する管理機能も設けていません。",
  },
  {
    question: "何を話せばいいか分からなくても大丈夫ですか？",
    answer:
      "はい、大丈夫です。「なんだかモヤモヤする」「理由は分からないけれど疲れた」といった一言からでも始められます。AIが無理に急かさず、今の気持ちを少しずつ言葉にするための問いかけを行います。",
  },
  {
    question: "文章がまとまっていなくても使えますか？",
    answer:
      "はい。きれいな文章や正しい言葉に整える必要はありません。思いついた断片や、矛盾した気持ちのまま書いていただいて構いません。",
  },
  {
    question: "AIはどのように返答しますか？",
    answer:
      "利用者を否定したり、説教したり、無理に前向きにさせたりすることはありません。あなたの言葉をそのまま受け止め、決めつけずに原則として「一度にひとつの問い」を返すことで、自分の気持ちに気づく手助けをします。なお、AIは医療診断や治療を行うものではありません。",
  },
  {
    question: "利用料金はかかりますか？",
    answer:
      "登録不要の無料体験（最大3回）と、会員登録後に使える無料プランをご用意しています。より多くのAI対話や詳細な感情分析・月間レポートを使える有料プラン（月額480円想定・正式価格や提供条件は変更になる場合があります）も予定しています。",
  },
  {
    question: "記録を削除できますか？",
    answer:
      "はい。個別の記録の削除はもちろん、設定画面から「保存データの全削除」や「アカウントの完全削除」をいつでもご自身で実行できます。削除前に記録をファイルとしてエクスポートすることも可能です。",
  },
  {
    question: "スマートフォンでも利用できますか？",
    answer:
      "はい。スマートフォンのブラウザで快適に読み書きできるよう最適化しています。PCやタブレットからも同じアカウントでご利用いただけます。",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-200/80 border-y border-slate-200/80">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `faq-panel-${idx}`;
        const buttonId = `faq-button-${idx}`;

        return (
          <div key={item.question} className="py-1">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full py-5 text-left flex items-center justify-between gap-4 text-slate-900 hover:text-[#1E3A5F] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]/40 rounded-lg"
              >
                <span className="text-[15px] sm:text-base font-medium leading-relaxed">
                  <span className="text-slate-400 mr-2.5 font-normal">Q.</span>
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-slate-700" : ""
                  }`}
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-all duration-300 ease-out ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100 pb-5"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="text-sm text-slate-600 leading-[1.9] pl-6 pr-2">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
