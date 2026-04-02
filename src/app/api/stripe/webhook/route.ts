import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";   // ← poprawiona ścieżka

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return new Response("Webhook error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    console.log("PAYMENT SUCCESS:", userId, plan);

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan,
        planExpiresAt:
          plan === "daypass"
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : null,
      },
    });

    console.log("PLAN SAVED TO DB");
  }

  return NextResponse.json({ received: true });
}