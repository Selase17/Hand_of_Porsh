import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { applyPaystackResult } from "@/lib/payments";

// Called from the order confirmation page when the customer lands back from
// Paystack, so the UI doesn't sit on "pending" waiting for the webhook (which
// needs a publicly reachable URL — not available in local dev). The webhook
// remains the authoritative source for marking an order paid; this is best-effort
// UX only, and is idempotent with it.
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const result = await verifyPaystackTransaction(reference);
    const order = await applyPaystackResult(reference, result);
    return NextResponse.json({ paymentStatus: order?.paymentStatus ?? null });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }
}
