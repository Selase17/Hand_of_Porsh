import { createHmac } from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

type InitializeParams = {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
};

type InitializeResult = {
  authorizationUrl: string;
  accessCode: string;
};

export async function initializePaystackTransaction({
  email,
  amountPesewas,
  reference,
  callbackUrl,
}: InitializeParams): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountPesewas,
      currency: "GHS",
      reference,
      callback_url: callbackUrl,
      channels: ["card", "mobile_money"],
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to initialize Paystack transaction");
  }
  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
  };
}

export type PaystackVerification = {
  status: string; // "success" | "failed" | "abandoned" | ...
  reference: string;
  channel: string | null; // "card" | "mobile_money" | ...
  amount: number;
};

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerification> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${getSecretKey()}` } },
  );
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to verify Paystack transaction");
  }
  return {
    status: json.data.status,
    reference: json.data.reference,
    channel: json.data.channel ?? null,
    amount: json.data.amount,
  };
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const hash = createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  return hash === signature;
}
