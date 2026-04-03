import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, userId, email, currency } = body;

    let priceId = "";

    // ===== DAYPASS =====
    if (plan === "daypass") {
      priceId =
        currency === "usd"
          ? process.env.STRIPE_PRICE_DAYPASS_USD!
          : process.env.STRIPE_PRICE_DAYPASS!;
    }

    // ===== STANDARD =====
    if (plan === "standard_monthly") {
      priceId =
        currency === "usd"
          ? process.env.STRIPE_PRICE_STANDARD_MONTHLY_USD!
          : process.env.STRIPE_PRICE_STANDARD_MONTHLY!;
    }

    if (plan === "standard_yearly") {
      priceId =
        currency === "usd"
          ? process.env.STRIPE_PRICE_STANDARD_YEARLY_USD!
          : process.env.STRIPE_PRICE_STANDARD_YEARLY!;
    }

    // ===== PRO =====
    if (plan === "pro_monthly") {
      priceId =
        currency === "usd"
          ? process.env.STRIPE_PRICE_PRO_MONTHLY_USD!
          : process.env.STRIPE_PRICE_PRO_MONTHLY!;
    }

    if (plan === "pro_yearly") {
      priceId =
        currency === "usd"
          ? process.env.STRIPE_PRICE_PRO_YEARLY_USD!
          : process.env.STRIPE_PRICE_PRO_YEARLY!;
    }

    // ===== PREMIUM =====
    if (plan === "premium_monthly") {
      priceId =
        currency === "usd"
          ? process.env.STRIPE_PRICE_PREMIUM_MONTHLY_USD!
          : process.env.STRIPE_PRICE_PREMIUM_MONTHLY!;
    }

    if (plan === "premium_yearly") {
      priceId =
        currency === "usd"
          ? process.env.STRIPE_PRICE_PREMIUM_YEARLY_USD!
          : process.env.STRIPE_PRICE_PREMIUM_YEARLY!;
    }

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    console.log("PLAN:", plan);
    console.log("CURRENCY:", currency);
    console.log("PRICE ID:", priceId);

    const session = await stripe.checkout.sessions.create({
      mode: plan === "daypass" ? "payment" : "subscription",
      payment_method_types: ["card"],
      customer_email: email,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata: {
        userId,
        plan,
      },

      success_url: "http://localhost:3000?success=true",
      cancel_url: "http://localhost:3000?canceled=true",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("CHECKOUT ERROR FULL:", err);
    if (err instanceof Error) {
      console.error("MESSAGE:", err.message);
    }
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}