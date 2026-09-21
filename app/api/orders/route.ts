import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateOrderRef } from "@/lib/orderRef";
import { initializePaystackTransaction } from "@/lib/paystack";

type CheckoutItem = { menuItemId: string; quantity: number };

type CheckoutBody = {
  customerName?: string;
  phone?: string;
  email?: string;
  deliveryAddress?: string;
  paymentMethod?: "paystack" | "cash";
  items?: CheckoutItem[];
};

export async function POST(req: NextRequest) {
  const body: CheckoutBody = await req.json();
  const { customerName, phone, email, deliveryAddress, paymentMethod, items } = body;

  if (!customerName || !phone || !deliveryAddress) {
    return NextResponse.json(
      { error: "Name, phone, and delivery address are required." },
      { status: 400 },
    );
  }
  if (paymentMethod !== "paystack" && paymentMethod !== "cash") {
    return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
  }
  if (paymentMethod === "paystack" && !email) {
    return NextResponse.json(
      { error: "Email is required to pay online." },
      { status: 400 },
    );
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }
  if (items.some((i) => !i.menuItemId || !Number.isInteger(i.quantity) || i.quantity <= 0)) {
    return NextResponse.json({ error: "Invalid cart items." }, { status: 400 });
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) } },
  });

  for (const requested of items) {
    const menuItem = menuItems.find((m) => m.id === requested.menuItemId);
    if (!menuItem) {
      return NextResponse.json({ error: "One of the items in your cart no longer exists." }, { status: 409 });
    }
    if (!menuItem.inStock) {
      return NextResponse.json({ error: `${menuItem.name} is out of stock.` }, { status: 409 });
    }
  }

  const orderItemsData = items.map((requested) => {
    const menuItem = menuItems.find((m) => m.id === requested.menuItemId)!;
    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: requested.quantity,
      priceAtOrder: menuItem.price,
    };
  });
  const totalPrice = orderItemsData.reduce(
    (sum, i) => sum + i.priceAtOrder * i.quantity,
    0,
  );

  let order = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    try {
      order = await prisma.order.create({
        data: {
          ref: generateOrderRef(),
          customerName,
          phone,
          email: email || null,
          deliveryAddress,
          paymentMethod,
          paymentStatus: paymentMethod === "cash" ? "cod_pending" : "pending",
          status: "received",
          totalPrice,
          items: { create: orderItemsData },
        },
      });
    } catch (e) {
      const isRefCollision =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!isRefCollision) throw e;
    }
  }
  if (!order) {
    return NextResponse.json({ error: "Could not create order. Please try again." }, { status: 500 });
  }

  if (paymentMethod === "cash") {
    return NextResponse.json({ ref: order.ref }, { status: 201 });
  }

  try {
    const callbackUrl = `${req.nextUrl.origin}/order/${order.ref}?verify=1`;
    const { authorizationUrl } = await initializePaystackTransaction({
      email: email!,
      amountPesewas: totalPrice,
      reference: order.ref,
      callbackUrl,
    });
    return NextResponse.json({ ref: order.ref, authorizationUrl }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        ref: order.ref,
        error:
          "Order received, but we couldn't start the payment. Please contact us with order " +
          order.ref +
          ".",
      },
      { status: 502 },
    );
  }
}
