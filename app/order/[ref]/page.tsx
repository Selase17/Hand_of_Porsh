import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatGHS } from "@/lib/money";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  ORDER_STATUS_LABEL,
} from "@/lib/orderDisplay";
import { VerifyOnLoad } from "@/components/order/VerifyOnLoad";

// Always reflects live order/payment state — never statically prerendered
// (also avoids needing a DATABASE_URL at `next build` time).
export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ verify?: string }>;
}) {
  const { ref } = await params;
  const { verify } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { ref },
    include: { items: true },
  });

  if (!order) notFound();

  const shouldVerify = verify === "1" && order.paymentMethod === "paystack" && order.paymentStatus === "pending";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      {shouldVerify && <VerifyOnLoad reference={order.ref} />}

      <h1 className="mb-1 text-2xl font-semibold">Thank you!</h1>
      <p className="mb-6 text-zinc-600">Order {order.ref}</p>

      <section className="mb-6 rounded-lg border p-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatGHS(item.priceAtOrder * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{formatGHS(order.totalPrice)}</span>
        </div>
      </section>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-600">Payment method</dt>
        <dd>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</dd>

        <dt className="text-zinc-600">Payment status</dt>
        <dd>{PAYMENT_STATUS_LABEL[order.paymentStatus]}</dd>

        <dt className="text-zinc-600">Order status</dt>
        <dd>{ORDER_STATUS_LABEL[order.status]}</dd>

        <dt className="text-zinc-600">Delivery address</dt>
        <dd>{order.deliveryAddress}</dd>
      </dl>
    </main>
  );
}
