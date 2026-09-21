import { randomBytes } from "crypto";

/** Public-facing order number, also used as the Paystack transaction reference. */
export function generateOrderRef(): string {
  return `HOP-${randomBytes(4).toString("hex").toUpperCase()}`;
}
