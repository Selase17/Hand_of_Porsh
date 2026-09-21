export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  paystack: "Paystack (Card / Mobile Money)",
  cash: "Cash on delivery",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  cod_pending: "Pending — pay on delivery",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  received: "Received",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

export const ORDER_STATUS_OPTIONS = [
  "received",
  "preparing",
  "out_for_delivery",
  "delivered",
] as const;

/**
 * Payment status options scoped to the order's payment method, so the admin
 * view only offers states that make sense for how the customer is paying
 * (e.g. a cash order can't be "failed" the way a Paystack charge can).
 */
export function getPaymentStatusOptions(
  paymentMethod: string,
): { value: string; label: string }[] {
  if (paymentMethod === "cash") {
    return [
      { value: "cod_pending", label: "Pending cash on delivery" },
      { value: "paid", label: "Paid cash" },
    ];
  }
  return [
    { value: "pending", label: "Pending (Paystack)" },
    { value: "paid", label: "Paid via Paystack" },
    { value: "failed", label: "Payment failed (Paystack)" },
  ];
}
