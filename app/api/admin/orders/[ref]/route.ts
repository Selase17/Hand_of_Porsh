import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const PAYMENT_STATUSES = ["pending", "paid", "failed", "cod_pending"] as const;
const ORDER_STATUSES = ["received", "preparing", "out_for_delivery", "delivered"] as const;

type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];
type OrderStatusValue = (typeof ORDER_STATUSES)[number];

// Payment status and delivery status are independent fields — this route
// updates whichever one(s) are present in the body, leaving the other untouched.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const body = await req.json();
  const data: { paymentStatus?: PaymentStatusValue; status?: OrderStatusValue } = {};

  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }
    data.paymentStatus = body.paymentStatus as PaymentStatusValue;
  }
  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }
    data.status = body.status as OrderStatusValue;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({ where: { ref }, data });
    return NextResponse.json({ order });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    throw e;
  }
}
