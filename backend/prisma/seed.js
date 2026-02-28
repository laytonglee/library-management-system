const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // ── 1. Seed Roles ──────────────────────────────────────────────────────────
  await prisma.role.createMany({
    data: [
      { name: "student" },
      { name: "teacher" },
      { name: "librarian" },
      { name: "admin" },
    ],
    skipDuplicates: true,
  });

  console.log("Roles seeded successfully.");

  // ── 2. Seed Borrowing Policies ─────────────────────────────────────────────
  const policies = [
    { roleName: "student", loanDurationDays: 14, maxBooksAllowed: 3 },
    { roleName: "teacher", loanDurationDays: 30, maxBooksAllowed: 5 },
    { roleName: "librarian", loanDurationDays: 30, maxBooksAllowed: 10 },
    { roleName: "admin", loanDurationDays: 30, maxBooksAllowed: 10 },
  ];

  for (const { roleName, loanDurationDays, maxBooksAllowed } of policies) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.warn(`Role "${roleName}" not found — skipping policy.`);
      continue;
    }

    await prisma.borrowingPolicy.upsert({
      where: { roleId: role.id },
      update: { loanDurationDays, maxBooksAllowed },
      create: { roleId: role.id, loanDurationDays, maxBooksAllowed },
    });
  }

  console.log("Borrowing policies seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
