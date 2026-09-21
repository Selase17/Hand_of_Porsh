import { prisma } from "@/lib/db";
import { OrderRow, type AdminOrder } from "@/components/admin/OrderRow";
import { LogoutButton } from "@/components/admin/LogoutButton";

// Always reflects live order state — never statically prerendered (also
// avoids needing a DATABASE_URL at `next build` time).
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const dateFormatter = new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const adminOrders: AdminOrder[] = orders.map((order) => ({
    id: order.id,
    ref: order.ref,
    customerName: order.customerName,
    phone: order.phone,
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    totalPrice: order.totalPrice,
    createdAtLabel: dateFormatter.format(order.createdAt),
    items: order.items,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <LogoutButton />
      </div>

      {adminOrders.length === 0 ? (
        <p className="text-zinc-600">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {adminOrders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}
