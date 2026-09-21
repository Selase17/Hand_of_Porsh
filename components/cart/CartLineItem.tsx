"use client";

import { useCart, type CartItem } from "@/lib/cart";
import { formatGHS } from "@/lib/money";

export function CartLineItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-3 border-b py-3 last:border-b-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-16 w-16 shrink-0 rounded-md object-cover"
      />
      <div className="flex flex-1 flex-col gap-1">
        <span className="font-medium">{item.name}</span>
        <span className="text-sm text-zinc-600">
          {formatGHS(item.price)} each
        </span>
        <button
          type="button"
          onClick={() => removeItem(item.menuItemId)}
          className="w-fit text-sm text-zinc-500 underline"
        >
          Remove
        </button>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease quantity of ${item.name}`}
            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border font-medium"
          >
            −
          </button>
          <span className="w-6 text-center">{item.quantity}</span>
          <button
            type="button"
            aria-label={`Increase quantity of ${item.name}`}
            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border font-medium"
          >
            +
          </button>
        </div>
        <span className="font-medium">
          {formatGHS(item.price * item.quantity)}
        </span>
      </div>
    </div>
  );
}
