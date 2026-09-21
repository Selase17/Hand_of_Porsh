"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatGHS } from "@/lib/money";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_OPTIONS,
  getPaymentStatusOptions,
} from "@/lib/orderDisplay";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
};

export type AdminOrder = {
  id: string;
  ref: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  totalPrice: number;
  createdAtLabel: string;
  items: OrderItem[];
};

export function OrderRow({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [status, setStatus] = useState(order.status);
  const [updating, setUpdating] = useState<"paymentStatus" | "status" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(field: "paymentStatus" | "status", value: string) {
    setError(null);
    setUpdating(field);
    const previous = field === "paymentStatus" ? paymentStatus : status;
    if (field === "paymentStatus") setPaymentStatus(value);
    else setStatus(value);

    const res = await fetch(`/api/admin/orders/${order.ref}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (!res.ok) {
      if (field === "paymentStatus") setPaymentStatus(previous);
      else setStatus(previous);
      setError("Update failed. Try again.");
    } else {
      router.refresh();
    }
    setUpdating(null);
  }

  const paymentOptions = getPaymentStatusOptions(order.paymentMethod);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{order.ref}</span>
        <span className="text-sm text-zinc-600">{order.createdAtLabel}</span>
      </div>
      <p className="text-sm text-zinc-600">
        {order.customerName} · {order.phone}
      </p>
      <p className="mb-3 text-sm text-zinc-600">{order.deliveryAddress}</p>

      <div className="mb-3 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatGHS(item.priceAtOrder * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t pt-1 font-medium">
          <span>Total</span>
          <span>{formatGHS(order.totalPrice)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Payment status</span>
          <select
            value={paymentStatus}
            disabled={updating === "paymentStatus"}
            onChange={(e) => update("paymentStatus", e.target.value)}
            className="rounded-md border px-2 py-1.5"
          >
            {paymentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Delivery status</span>
          <select
            value={status}
            disabled={updating === "status"}
            onChange={(e) => update("status", e.target.value)}
            className="rounded-md border px-2 py-1.5"
          >
            {ORDER_STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
