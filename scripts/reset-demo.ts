import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting demo database...\n");

  console.log("Clearing existing data...");
  await prisma.agentStep.deleteMany();
  await prisma.investigationRun.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.knowledgeChunk.deleteMany();
  console.log("  Cleared");

  console.log("\nRe-seeding customers and tickets...");
  execSync("tsx scripts/seed-db.ts", { stdio: "inherit" });

  console.log("\nRe-ingesting knowledge base...");
  execSync("tsx scripts/ingest-docs.ts", { stdio: "inherit" });

  console.log("\nDemo reset complete!");
}

main()
  .catch((e) => {
    console.error("Reset failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
