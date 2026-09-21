"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatGHS } from "@/lib/money";

type PaymentMethod = "paystack" | "cash";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clear } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/menu" className="underline">
          Browse the menu
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          email: paymentMethod === "paystack" ? email : undefined,
          deliveryAddress,
          paymentMethod,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      clear();
      if (json.authorizationUrl) {
        window.location.href = json.authorizationUrl;
      } else {
        router.push(`/order/${json.ref}`);
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>

      <section className="mb-6 rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Order summary</h2>
        {items.map((item) => (
          <div key={item.menuItemId} className="flex justify-between text-sm py-1">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatGHS(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{formatGHS(totalPrice)}</span>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Name</span>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Phone</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Delivery address</span>
          <textarea
            required
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="rounded-md border px-3 py-2"
            rows={2}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Payment method</legend>

          <label className="flex items-center gap-2 rounded-md border p-3">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === "paystack"}
              onChange={() => setPaymentMethod("paystack")}
            />
            Pay now — Card / Mobile Money (Paystack)
          </label>

          {paymentMethod === "paystack" && (
            <label className="flex flex-col gap-1 pl-3">
              <span className="text-sm font-medium">Email (for payment receipt)</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border px-3 py-2"
              />
            </label>
          )}

          <label className="flex items-center gap-2 rounded-md border p-3">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === "cash"}
              onChange={() => setPaymentMethod("cash")}
            />
            Cash on delivery
          </label>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black py-3 font-medium text-white disabled:bg-zinc-400"
        >
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </form>
    </main>
  );
}
