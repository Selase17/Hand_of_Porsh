import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { applyPaystackResult } from "@/lib/payments";

// Paystack webhook events reference: https://paystack.com/docs/payments/webhooks/
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    await applyPaystackResult(event.data.reference, {
      status: "success",
      channel: event.data.channel ?? null,
    });
  } else if (event.event === "charge.failed") {
    await applyPaystackResult(event.data.reference, {
      status: "failed",
      channel: event.data.channel ?? null,
    });
  }

  // Paystack just needs a 200 acknowledging receipt.
  return new Response("ok", { status: 200 });
}
