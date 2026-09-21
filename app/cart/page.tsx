"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatGHS } from "@/lib/money";
import { CartLineItem } from "@/components/cart/CartLineItem";

export default function CartPage() {
  const { items, totalPrice } = useCart();

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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Your Cart</h1>
      <div>
        {items.map((item) => (
          <CartLineItem key={item.menuItemId} item={item} />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-semibold">{formatGHS(totalPrice)}</span>
      </div>
      <Link
        href="/checkout"
        className="mt-4 block w-full rounded-md bg-black py-3 text-center font-medium text-white"
      >
        Proceed to checkout
      </Link>
    </main>
  );
}
