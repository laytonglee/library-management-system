// backend/src/services/importService.js
const prisma = require("../config/prisma");
const auditLogger = require("./auditLogger");

// Expected headers for book import CSV
const BOOK_HEADERS = ["title", "author", "isbn", "publisher", "publicationYear", "category", "description"];

function parseCsv(buffer) {
  const text = buffer.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());

  return lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current);

    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()]));
  });
}

async function importBooks(csvBuffer, actorId) {
  const rows = parseCsv(csvBuffer);
  if (rows.length === 0) {
    const err = new Error("CSV is empty or has no data rows");
    err.statusCode = 400;
    throw err;
  }

  const missing = BOOK_HEADERS.filter((h) => !Object.prototype.hasOwnProperty.call(rows[0], h));
  if (missing.length > 0) {
    const err = new Error(`CSV missing required columns: ${missing.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  let imported = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const { title, author, isbn, publisher, publicationYear, category, description } = row;

      if (!title || !author) {
        skipped++;
        continue;
      }

      let categoryId = null;
      if (category) {
        const cat = await tx.category.upsert({
          where: { name: category },
          update: {},
          create: { name: category },
          select: { id: true },
        });
        categoryId = cat.id;
      }

      const data = {
        title,
        author,
        isbn: isbn || null,
        publisher: publisher || null,
        publicationYear: publicationYear ? parseInt(publicationYear, 10) || null : null,
        categoryId,
        description: description || null,
      };

      if (isbn) {
        await tx.book.upsert({
          where: { isbn },
          update: { title, author, publisher: data.publisher, publicationYear: data.publicationYear,
                    categoryId, description: data.description },
          create: data,
        });
      } else {
        const existing = await tx.book.findFirst({ where: { title, author }, select: { id: true } });
        if (existing) {
          await tx.book.update({ where: { id: existing.id },
            data: { publisher: data.publisher, publicationYear: data.publicationYear,
                    categoryId, description: data.description } });
        } else {
          await tx.book.create({ data });
        }
      }

      imported++;
    }

    await auditLogger.log(tx, {
      actorId,
      action: "DATA_IMPORT",
      targetType: "book",
      details: { type: "books", rowCount: imported, skipped },
    });
  });

  return { imported, skipped };
}

function exportBooksCsv(books) {
  const headers = ["id", "title", "author", "isbn", "publisher", "publicationYear", "category", "description"];
  const rows = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    isbn: b.isbn ?? "",
    publisher: b.publisher ?? "",
    publicationYear: b.publicationYear ?? "",
    category: b.category?.name ?? "",
    description: b.description ?? "",
  }));

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? "");
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(",")
    ),
  ];
  return lines.join("\n");
}

async function exportBooks() {
  const books = await prisma.book.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true, title: true, author: true, isbn: true,
      publisher: true, publicationYear: true, description: true,
      category: { select: { name: true } },
    },
  });
  return exportBooksCsv(books);
}

module.exports = { importBooks, exportBooks };
