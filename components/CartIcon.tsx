"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartIcon() {
  const { totalCount } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${totalCount} item${totalCount === 1 ? "" : "s"}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {totalCount > 0 && (
        <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-xs font-medium text-white dark:bg-white dark:text-black">
          {totalCount}
        </span>
      )}
    </Link>
  );
}
