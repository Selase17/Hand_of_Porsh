import { prisma } from "@/lib/db";
import type { PaystackVerification } from "@/lib/paystack";

/**
 * Applies a Paystack payment result to the matching order. Called from both
 * the webhook (authoritative) and the verify-on-callback route (immediate UX
 * feedback, useful in local dev where Paystack can't reach a webhook URL).
 * Idempotent: an already-paid order is left untouched.
 */
export async function applyPaystackResult(
  reference: string,
  result: Pick<PaystackVerification, "status" | "channel"> | null,
) {
  const order = await prisma.order.findUnique({ where: { ref: reference } });
  if (!order) return null;
  if (order.paymentStatus === "paid") return order;

  if (!result || result.status !== "success") {
    return prisma.order.update({
      where: { ref: reference },
      data: { paymentStatus: "failed" },
    });
  }

  return prisma.order.update({
    where: { ref: reference },
    data: { paymentStatus: "paid", paymentChannel: result.channel },
  });
}
