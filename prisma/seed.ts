import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const items = [
  {
    name: "Jollof Rice & Chicken",
    description: "Smoky jollof rice served with grilled chicken.",
    price: 4500,
    category: "mains" as const,
    imageUrl: "https://placehold.co/400x300?text=Jollof+%26+Chicken",
    inStock: true,
  },
  {
    name: "Banku & Tilapia",
    description: "Fermented corn/cassava dough with grilled tilapia and pepper sauce.",
    price: 5000,
    category: "mains" as const,
    imageUrl: "https://placehold.co/400x300?text=Banku+%26+Tilapia",
    inStock: true,
  },
  {
    name: "Waakye Special",
    description: "Rice and beans with gari, egg, and stew.",
    price: 4000,
    category: "mains" as const,
    imageUrl: "https://placehold.co/400x300?text=Waakye",
    inStock: false,
  },
  {
    name: "Meat Pie",
    description: "Flaky pastry filled with seasoned minced meat.",
    price: 1200,
    category: "pastries" as const,
    imageUrl: "https://placehold.co/400x300?text=Meat+Pie",
    inStock: true,
  },
  {
    name: "Chicken Pie",
    description: "Buttery pastry filled with spiced shredded chicken.",
    price: 1300,
    category: "pastries" as const,
    imageUrl: "https://placehold.co/400x300?text=Chicken+Pie",
    inStock: true,
  },
  {
    name: "Sausage Roll",
    description: "Classic sausage wrapped in golden puff pastry.",
    price: 1000,
    category: "pastries" as const,
    imageUrl: "https://placehold.co/400x300?text=Sausage+Roll",
    inStock: true,
  },
  {
    name: "Spring Rolls (6pc)",
    description: "Crispy vegetable spring rolls with dipping sauce.",
    price: 1500,
    category: "snacks" as const,
    imageUrl: "https://placehold.co/400x300?text=Spring+Rolls",
    inStock: true,
  },
  {
    name: "Plantain Chips",
    description: "Lightly salted crispy plantain chips.",
    price: 800,
    category: "snacks" as const,
    imageUrl: "https://placehold.co/400x300?text=Plantain+Chips",
    inStock: true,
  },
];

async function main() {
  await prisma.menuItem.deleteMany();
  await prisma.menuItem.createMany({ data: items });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
