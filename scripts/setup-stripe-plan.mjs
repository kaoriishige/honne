/**
 * Stripe に「ほんね。 プレミアムプラン（月額480円・JPY）」の Product と Price を作成する補助スクリプト
 *
 * 使い方（PowerShell）:
 *   $env:STRIPE_SECRET_KEY="sk_test_..." # 本番時は sk_live_...
 *   node scripts/setup-stripe-plan.mjs
 *
 * 出力された Price ID を STRIPE_PRICE_ID_PAID_MONTHLY に設定してください。
 */
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("エラー: STRIPE_SECRET_KEY 環境変数を設定してください。");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

async function run() {
  const product = await stripe.products.create({
    name: "ほんね。 プレミアムプラン",
    description:
      "AIとの深掘り対話（月150回）・詳細感情分析・月間レポート・過去と現在の比較",
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 480,
    currency: "jpy",
    recurring: {
      interval: "month",
    },
  });

  console.log("Product ID:", product.id);
  console.log("Price ID:", price.id);
  console.log(
    "この Price ID を .env.local および Netlify 環境変数の STRIPE_PRICE_ID_PAID_MONTHLY に設定してください。"
  );
}

run().catch((err) => {
  console.error("作成に失敗しました:", err.message);
  process.exit(1);
});
