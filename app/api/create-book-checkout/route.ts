import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL 
  || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://vms-memory.vercel.app");

export async function POST(req: NextRequest) {
  // Initialize inside handler so a missing env var doesn't crash the build
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: "2024-04-10" as any,
  });

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
