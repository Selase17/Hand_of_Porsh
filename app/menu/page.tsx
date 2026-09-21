import { prisma } from "@/lib/db";
import { MenuItemCard } from "@/components/menu/MenuItemCard";

const CATEGORY_LABELS = {
  mains: "Mains",
  pastries: "Pastries",
  snacks: "Snacks",
} as const;

const CATEGORY_ORDER = ["mains", "pastries", "snacks"] as const;

// Always reflects live stock/prices — never statically prerendered (also
// avoids needing a DATABASE_URL at `next build` time).
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const menuItems = await prisma.menuItem.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Menu</h1>
      {CATEGORY_ORDER.map((category) => {
        const items = menuItems.filter((item) => item.category === category);
        if (items.length === 0) return null;

        return (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  imageUrl={item.imageUrl}
                  inStock={item.inStock}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
