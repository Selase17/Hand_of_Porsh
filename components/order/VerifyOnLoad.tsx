"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Fires once when the customer lands back from Paystack, to reconcile
 * payment status immediately instead of waiting on the webhook (which can't
 * reach localhost in dev). Renders nothing.
 */
export function VerifyOnLoad({ reference }: { reference: string }) {
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/payments/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .catch(() => {})
      .finally(() => router.refresh());
  }, [reference, router]);

  return null;
}
