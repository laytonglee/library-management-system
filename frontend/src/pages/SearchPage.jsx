import { useState, useEffect } from "react";
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
import { searchBooks, getCategories } from "@/services/bookService";

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
    getCategories()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  // Fetch books when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { page, limit };
    if (query) params.search = query;
    if (categoryFilter !== "all") params.categoryId = categoryFilter;
    if (statusFilter !== "all") params.availability = statusFilter;

    searchBooks(params)
      .then((res) => {
        if (cancelled) return;
        const { data, pagination } = res.data;
        setBooks(data);
        setTotal(pagination.total);
        setTotalPages(pagination.totalPages);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
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
                        <Badge variant="outline">{book.category?.name}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {book.publisher}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                        {book.publicationYear}
                      </TableCell>
                      <TableCell>
                        <AvailabilityBadge
                          available={book.availableCopies}
                          total={book.totalCopies}
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
