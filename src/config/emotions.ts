export const EMOTIONS = [
  {
    key: "anger",
    label: "怒り",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    activeClass: "bg-rose-700 text-white border-rose-700",
  },
  {
    key: "jealousy",
    label: "嫉妬",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    activeClass: "bg-amber-700 text-white border-amber-700",
  },
  {
    key: "anxiety",
    label: "不安",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    activeClass: "bg-indigo-700 text-white border-indigo-700",
  },
  {
    key: "loneliness",
    label: "孤独",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    activeClass: "bg-slate-700 text-white border-slate-700",
  },
  {
    key: "sadness",
    label: "悲しみ",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    activeClass: "bg-sky-700 text-white border-sky-700",
  },
  {
    key: "regret",
    label: "後悔",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
    activeClass: "bg-violet-700 text-white border-violet-700",
  },
  {
    key: "joy",
    label: "喜び",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    activeClass: "bg-emerald-700 text-white border-emerald-700",
  },
  {
    key: "dissatisfaction",
    label: "不満",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
    activeClass: "bg-orange-700 text-white border-orange-700",
  },
  {
    key: "desire",
    label: "欲望",
    badgeClass: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
    activeClass: "bg-fuchsia-700 text-white border-fuchsia-700",
  },
  {
    key: "other",
    label: "その他",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-300",
    activeClass: "bg-stone-700 text-white border-stone-700",
  },
] as const;

export type EmotionKey = (typeof EMOTIONS)[number]["key"];

export const EMOTION_KEYS: EmotionKey[] = EMOTIONS.map((e) => e.key);

export function getEmotionMeta(key: string) {
  return EMOTIONS.find((e) => e.key === key) ?? EMOTIONS[EMOTIONS.length - 1];
}
