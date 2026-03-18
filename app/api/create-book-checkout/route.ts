import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2026-02-25.clover" as any,
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://vms-memory.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const { personId, personName, userName } = await req.json();

    if (!personId || !personName) {
      return NextResponse.json(
        { error: "Missing personId or personName" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Memory Book — ${personName}`,
              description:
                "A beautifully formatted PDF book of all their stories, preserved forever.",
              images: [`${APP_URL}/icon-512x512.png`],
            },
            unit_amount: 299, // $2.99
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/book-success?personId=${encodeURIComponent(
        personId
      )}&personName=${encodeURIComponent(personName)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/profile`,
      metadata: {
        personId,
        personName,
        userName: userName || "",
        product: "memory_book",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
