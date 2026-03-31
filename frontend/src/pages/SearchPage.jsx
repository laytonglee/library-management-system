import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  BookOpen,
  Filter,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";

// ─── Fake API (matches GET /books and GET /categories responses) ─────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const MOCK_CATEGORIES = [
  { id: 1, name: "Computer Science" },
  { id: 2, name: "Mathematics" },
  { id: 3, name: "Engineering" },
  { id: 4, name: "Science Fiction" },
  { id: 5, name: "Literature" },
  { id: 6, name: "History" },
  { id: 7, name: "Physics" },
  { id: 8, name: "Biology" },
];

const MOCK_BOOKS = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    category_id: 1,
    category: "Computer Science",
    publisher: "Prentice Hall",
    publication_year: 2008,
    total_copies: 5,
    available_copies: 2,
  },
  {
    id: 2,
    title: "Design Patterns",
    author: "Erich Gamma et al.",
    isbn: "978-0201633610",
    category_id: 1,
    category: "Computer Science",
    publisher: "Addison-Wesley",
    publication_year: 1994,
    total_copies: 3,
    available_copies: 1,
  },
  {
    id: 3,
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "978-0262033848",
    category_id: 1,
    category: "Computer Science",
    publisher: "MIT Press",
    publication_year: 2009,
    total_copies: 4,
    available_copies: 0,
  },
  {
    id: 4,
    title: "The Pragmatic Programmer",
    author: "David Thomas & Andrew Hunt",
    isbn: "978-0135957059",
    category_id: 1,
    category: "Computer Science",
    publisher: "Addison-Wesley",
    publication_year: 2019,
    total_copies: 3,
    available_copies: 3,
  },
  {
    id: 5,
    title: "Refactoring",
    author: "Martin Fowler",
    isbn: "978-0134757599",
    category_id: 1,
    category: "Computer Science",
    publisher: "Addison-Wesley",
    publication_year: 2018,
    total_copies: 2,
    available_copies: 1,
  },
  {
    id: 6,
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    isbn: "978-1285741550",
    category_id: 2,
    category: "Mathematics",
    publisher: "Cengage Learning",
    publication_year: 2015,
    total_copies: 6,
    available_copies: 4,
  },
  {
    id: 7,
    title: "Linear Algebra Done Right",
    author: "Sheldon Axler",
    isbn: "978-3319110790",
    category_id: 2,
    category: "Mathematics",
    publisher: "Springer",
    publication_year: 2014,
    total_copies: 3,
    available_copies: 2,
  },
  {
    id: 8,
    title: "Discrete Mathematics",
    author: "Kenneth Rosen",
    isbn: "978-0073383095",
    category_id: 2,
    category: "Mathematics",
    publisher: "McGraw-Hill",
    publication_year: 2018,
    total_copies: 4,
    available_copies: 1,
  },
  {
    id: 9,
    title: "Engineering Mechanics: Statics",
    author: "Russell Hibbeler",
    isbn: "978-0133918922",
    category_id: 3,
    category: "Engineering",
    publisher: "Pearson",
    publication_year: 2015,
    total_copies: 3,
    available_copies: 2,
  },
  {
    id: 10,
    title: "Thermodynamics: An Engineering Approach",
    author: "Yunus Cengel",
    isbn: "978-0073398174",
    category_id: 3,
    category: "Engineering",
    publisher: "McGraw-Hill",
    publication_year: 2014,
    total_copies: 2,
    available_copies: 0,
  },
  {
    id: 11,
    title: "Dune",
    author: "Frank Herbert",
    isbn: "978-0441172719",
    category_id: 4,
    category: "Science Fiction",
    publisher: "Ace Books",
    publication_year: 1965,
    total_copies: 4,
    available_copies: 3,
  },
  {
    id: 12,
    title: "Neuromancer",
    author: "William Gibson",
    isbn: "978-0441569595",
    category_id: 4,
    category: "Science Fiction",
    publisher: "Ace Books",
    publication_year: 1984,
    total_copies: 2,
    available_copies: 2,
  },
  {
    id: 13,
    title: "Foundation",
    author: "Isaac Asimov",
    isbn: "978-0553293357",
    category_id: 4,
    category: "Science Fiction",
    publisher: "Bantam Books",
    publication_year: 1951,
    total_copies: 3,
    available_copies: 1,
  },
  {
    id: 14,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0061120084",
    category_id: 5,
    category: "Literature",
    publisher: "Harper Perennial",
    publication_year: 1960,
    total_copies: 5,
    available_copies: 3,
  },
  {
    id: 15,
    title: "1984",
    author: "George Orwell",
    isbn: "978-0451524935",
    category_id: 5,
    category: "Literature",
    publisher: "Signet Classics",
    publication_year: 1949,
    total_copies: 4,
    available_copies: 2,
  },
  {
    id: 16,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0743273565",
    category_id: 5,
    category: "Literature",
    publisher: "Scribner",
    publication_year: 1925,
    total_copies: 3,
    available_copies: 1,
  },
  {
    id: 17,
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "978-0062316097",
    category_id: 6,
    category: "History",
    publisher: "Harper",
    publication_year: 2015,
    total_copies: 4,
    available_copies: 2,
  },
  {
    id: 18,
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    isbn: "978-0393354324",
    category_id: 6,
    category: "History",
    publisher: "W.W. Norton",
    publication_year: 1997,
    total_copies: 2,
    available_copies: 1,
  },
  {
    id: 19,
    title: "University Physics",
    author: "Hugh D. Young",
    isbn: "978-0321696861",
    category_id: 7,
    category: "Physics",
    publisher: "Pearson",
    publication_year: 2015,
    total_copies: 5,
    available_copies: 3,
  },
  {
    id: 20,
    title: "Molecular Biology of the Cell",
    author: "Bruce Alberts",
    isbn: "978-0815344322",
    category_id: 8,
    category: "Biology",
    publisher: "W.W. Norton",
    publication_year: 2014,
    total_copies: 3,
    available_copies: 2,
  },
];

async function fakeFetchBooks({ q, category_id, status, page, limit }) {
  await delay(600);
  let filtered = [...MOCK_BOOKS];

  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(lower) ||
        b.author.toLowerCase().includes(lower) ||
        b.isbn.includes(q),
    );
  }
  if (category_id) {
    filtered = filtered.filter((b) => b.category_id === Number(category_id));
  }
  if (status === "available") {
    filtered = filtered.filter((b) => b.available_copies > 0);
  } else if (status === "unavailable") {
    filtered = filtered.filter((b) => b.available_copies === 0);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function fakeFetchCategories() {
  await delay(300);
  return MOCK_CATEGORIES;
}

// ─── Status badge helper ─────────────────────────────────────────────────────

function AvailabilityBadge({ available, total }) {
  if (available === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        Unavailable
      </Badge>
    );
  }
  if (available <= Math.ceil(total * 0.3)) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-500 text-amber-600"
      >
        Low ({available}/{total})
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      Available ({available}/{total})
    </Badge>
  );
}

// ─── Search Page ─────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Load categories once
  useEffect(() => {
    fakeFetchCategories().then(setCategories);
  }, []);

  // Fetch books when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fakeFetchBooks({
      q: query || undefined,
      category_id: categoryFilter !== "all" ? categoryFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      page,
      limit,
    }).then((res) => {
      if (cancelled) return;
      setBooks(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [query, categoryFilter, statusFilter, page]);

  const activeFilters =
    (categoryFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
    setQuery("");
    setPage(1);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Catalog</h1>
        <p className="text-muted-foreground">
          Browse and search for books by title, author, ISBN, or category.
        </p>
      </div>

      {/* ── Filters ── */}
      {/* <Card>
        <CardContent className="pt-6"> */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
      {/* </CardContent>
      </Card> */}

      {/* ── Results Table ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Books</CardTitle>
            <CardDescription>
              {loading
                ? "Searching..."
                : `${total} book${total !== 1 ? "s" : ""} found`}
            </CardDescription>
          </div>
          {activeFilters > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              {activeFilters} filter{activeFilters > 1 ? "s" : ""} active
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden md:table-cell">ISBN</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Publisher
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">Year</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(9)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : books.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-8 w-8" />
                        <p className="text-sm font-medium">No books found</p>
                        <p className="text-xs">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  books.map((book, index) => (
                    <TableRow key={book.id} className="group">
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/books/${book.id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {book.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{book.author}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {book.isbn}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{book.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {book.publisher}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                        {book.publication_year}
                      </TableCell>
                      <TableCell>
                        <AvailabilityBadge
                          available={book.available_copies}
                          total={book.total_copies}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/books/${book.id}`}>
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* ── Pagination ── */}
        {!loading && totalPages > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-medium">{total}</span> books
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-3 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
