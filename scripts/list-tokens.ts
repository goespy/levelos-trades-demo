import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

(async () => {
  console.log("\n=== JOB PORTALS ===");
  const jobs = await prisma.job.findMany({ select: { name: true, status: true, portalToken: true } });
  for (const j of jobs) console.log(`/j/${j.portalToken}  -- ${j.name} [${j.status}]`);

  console.log("\n=== PAY LINKS (SENT/OVERDUE) ===");
  const invs = await prisma.invoice.findMany({
    where: { status: { in: ["SENT", "OVERDUE"] } },
    select: { number: true, payToken: true, amount: true, status: true },
  });
  for (const i of invs) console.log(`/pay/${i.payToken}  -- ${i.number} $${i.amount} [${i.status}]`);

  console.log("\n=== REVIEW REQUESTS ===");
  const revs = await prisma.review.findMany({ where: { status: "REQUESTED" }, select: { requestToken: true } });
  for (const r of revs) console.log(`/review/${r.requestToken}`);

  await prisma.$disconnect();
})();
