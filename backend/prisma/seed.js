const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
