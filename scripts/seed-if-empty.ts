import { prisma } from "../src/lib/prisma";
import { execSync } from "node:child_process";
import path from "node:path";

async function main() {
  const count = await prisma.user.count().catch(() => 0);
  if (count > 0) {
    console.log(`[seed-if-empty] Skipping seed — ${count} users already exist.`);
    return;
  }
  console.log("[seed-if-empty] Empty database detected. Running seed…");
  const seedPath = path.resolve(process.cwd(), "prisma/seed.ts");
  execSync(`tsx ${seedPath}`, { stdio: "inherit" });
}

main()
  .catch((e) => {
    console.error("[seed-if-empty] Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
