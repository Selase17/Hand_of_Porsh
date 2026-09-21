import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { CartIcon } from "@/components/CartIcon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hand of Porsh Catering",
  description: "Order food, pastries and snacks from Hand of Porsh Catering.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <header className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold">Hand of Porsh Catering</span>
            <CartIcon />
          </header>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
