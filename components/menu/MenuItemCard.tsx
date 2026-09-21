"use client";

import { useCart } from "@/lib/cart";
import { formatGHS } from "@/lib/money";

type MenuItemCardProps = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
};

export function MenuItemCard({
  id,
  name,
  description,
  price,
  imageUrl,
  inStock,
}: MenuItemCardProps) {
  const { addItem } = useCart();

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={name}
        className="h-40 w-full object-cover"
        loading="lazy"
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-semibold">{name}</h3>
        <p className="flex-1 text-sm text-zinc-600">{description}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-medium">{formatGHS(price)}</span>
          <button
            type="button"
            disabled={!inStock}
            onClick={() =>
              addItem({ menuItemId: id, name, price, imageUrl })
            }
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {inStock ? "Add to cart" : "Out of stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
