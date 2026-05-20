import { PrismaClient } from "@prisma/client";
import customers from "../data/customers.json";
import tickets from "../data/tickets.json";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding customers...");
  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {},
      create: customer,
    });
  }

  console.log("Seeding tickets...");
  for (const ticket of tickets) {
    await prisma.ticket.upsert({
      where: { externalId: ticket.externalId },
      update: {},
      create: ticket,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
