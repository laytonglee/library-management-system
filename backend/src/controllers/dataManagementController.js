const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const prisma = require("../config/prisma");

// ── Export all data as JSON ────────────────────────────────────────────────────
async function exportData(req, res) {
  try {
    const [users, books, categories, bookCopies, transactions, policies, roles] = await Promise.all([
      prisma.user.findMany({ select: { id: true, fullName: true, username: true, email: true, isActive: true, createdAt: true, role: { select: { name: true } } } }),
      prisma.book.findMany({ include: { category: true } }),
      prisma.category.findMany(),
      prisma.bookCopy.findMany(),
      prisma.borrowingTransaction.findMany({ include: { borrower: { select: { email: true } }, bookCopy: { select: { barcode: true } } } }),
      prisma.borrowingPolicy.findMany({ include: { role: { select: { name: true } } } }),
      prisma.role.findMany(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      roles,
      categories,
      books,
      bookCopies,
      users,
      borrowingPolicies: policies,
      transactions,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="library-export-${Date.now()}.json"`);
    return res.json(exportData);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── Import books and categories from JSON ──────────────────────────────────────
async function importData(req, res) {
  try {
    const { categories = [], books = [] } = req.body;

    let importedCategories = 0;
    let importedBooks = 0;

    for (const cat of categories) {
      await prisma.category.upsert({
        where: { name: cat.name },
        update: { description: cat.description },
        create: { name: cat.name, description: cat.description },
      });
      importedCategories++;
    }

    for (const book of books) {
      const existing = book.isbn ? await prisma.book.findUnique({ where: { isbn: book.isbn } }) : null;
      if (existing) {
        await prisma.book.update({
          where: { id: existing.id },
          data: {
            title: book.title,
            author: book.author,
            publisher: book.publisher,
            publicationYear: book.publicationYear,
            description: book.description,
          },
        });
      } else {
        let categoryId = null;
        if (book.categoryName) {
          const cat = await prisma.category.findUnique({ where: { name: book.categoryName } });
          if (cat) categoryId = cat.id;
        }
        await prisma.book.create({
          data: {
            title: book.title,
            author: book.author,
            isbn: book.isbn || null,
            publisher: book.publisher || null,
            publicationYear: book.publicationYear || null,
            description: book.description || null,
            categoryId,
          },
        });
      }
      importedBooks++;
    }

    return res.json({
      success: true,
      message: `Import complete`,
      data: { importedCategories, importedBooks },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── Database backup via pg_dump ────────────────────────────────────────────────
async function backupDatabase(req, res) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ success: false, message: "DATABASE_URL not configured" });

  // Parse connection string
  let pgDumpArgs;
  try {
    const url = new URL(dbUrl);
    pgDumpArgs = [
      "-h", url.hostname,
      "-p", url.port || "5432",
      "-U", url.username,
      "-d", url.pathname.replace(/^\//, ""),
      "--no-password",
      "-F", "p",
    ];
  } catch {
    return res.status(500).json({ success: false, message: "Invalid DATABASE_URL format" });
  }

  // Find pg_dump binary
  const pgDumpCandidates = [
    "pg_dump",
    path.join(os.homedir(), "scoop", "apps", "postgresql", "current", "bin", "pg_dump.exe"),
    "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
  ];

  const tmpFile = path.join(os.tmpdir(), `library-backup-${Date.now()}.sql`);

  const tryDump = (candidates) => {
    const candidate = candidates[0];
    if (!candidate) {
      return res.status(500).json({ success: false, message: "pg_dump not found. Install PostgreSQL client tools." });
    }

    execFile(candidate, [...pgDumpArgs, "-f", tmpFile], { env: { ...process.env, PGPASSWORD: "" } }, (err) => {
      if (err) {
        if (candidates.length > 1) return tryDump(candidates.slice(1));
        return res.status(500).json({ success: false, message: `pg_dump failed: ${err.message}` });
      }

      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", `attachment; filename="library-backup-${Date.now()}.sql"`);
      const stream = fs.createReadStream(tmpFile);
      stream.pipe(res);
      stream.on("end", () => fs.unlink(tmpFile, () => {}));
      stream.on("error", () => res.status(500).json({ success: false, message: "Failed to stream backup file" }));
    });
  };

  tryDump(pgDumpCandidates);
}

module.exports = { exportData, importData, backupDatabase };
