import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle, AlertCircle, X } from "lucide-react";
import { checkoutBook } from "@/services/transactionService";
import { searchBorrowers } from "@/services/userService";
import { searchBooks, getBookCopies } from "@/services/bookService";

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Borrower Search ──────────────────────────────────────────────────────────
function BorrowerSearch({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchBorrowers(debouncedQuery)
      .then(({ data }) => setResults(data.data || []))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  // close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <span className="flex-1">
          <span className="font-medium">{value.fullName}</span>
          <span className="text-muted-foreground ml-2">{value.email}</span>
        </span>
        <Badge variant="secondary" className="text-xs">
          {value.role?.name}
        </Badge>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="Search by name, username, or email…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (query.trim() || searching) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {searching && (
            <div className="p-2 space-y-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
          {!searching && results.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No users found.</p>
          )}
          {!searching &&
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(user);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="flex-1">
                  <span className="font-medium">{user.fullName}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {user.email}
                  </span>
                </span>
                <Badge variant="outline" className="text-xs">
                  {user.role?.name}
                </Badge>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Book + Copy Search ───────────────────────────────────────────────────────
function BookCopySearch({ value, onChange }) {
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const debouncedQuery = useDebounce(bookQuery);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setBookResults([]);
      return;
    }
    setSearchingBooks(true);
    searchBooks({ search: debouncedQuery, limit: 8, availability: "available" })
      .then(({ data }) => setBookResults(data.data || []))
      .catch(() => setBookResults([]))
      .finally(() => setSearchingBooks(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectBook(book) {
    setSelectedBook(book);
    setBookQuery("");
    setOpen(false);
    setLoadingCopies(true);
    getBookCopies(book.id)
      .then(({ data }) => setCopies(data.data || []))
      .catch(() => setCopies([]))
      .finally(() => setLoadingCopies(false));
  }

  function clearAll() {
    setSelectedBook(null);
    setCopies([]);
    onChange(null);
  }

  // A copy has been selected — show the final selection
  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="flex-1">
            <span className="font-medium">{selectedBook?.title}</span>
            <span className="text-muted-foreground ml-2 text-xs">
              Copy #{value.id}
              {value.barcode ? ` · ${value.barcode}` : ""}
              {value.location ? ` · ${value.location}` : ""}
            </span>
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Book search input */}
      {!selectedBook && (
        <div ref={containerRef} className="relative">
          <Input
            placeholder="Search by title, author, or ISBN…"
            value={bookQuery}
            onChange={(e) => {
              setBookQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {open && (bookQuery.trim() || searchingBooks) && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
              {searchingBooks && (
                <div className="p-2 space-y-1">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}
              {!searchingBooks && bookResults.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">
                  No available books found.
                </p>
              )}
              {!searchingBooks &&
                bookResults.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectBook(book)}
                  >
                    <span className="flex-1">
                      <span className="font-medium">{book.title}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {book.author}
                      </span>
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {book.availableCopies} available
                    </Badge>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Copy picker */}
      {selectedBook && (
        <div className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{selectedBook.title}</p>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Change book
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Select an available copy:
          </p>
          {loadingCopies && <Skeleton className="h-8 w-full" />}
          {!loadingCopies &&
            copies.filter((c) => c.status === "AVAILABLE").length === 0 && (
              <p className="text-xs text-muted-foreground">
                No available copies.
              </p>
            )}
          {!loadingCopies &&
            copies
              .filter((c) => c.status === "AVAILABLE")
              .map((copy) => (
                <button
                  key={copy.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent text-left border"
                  onClick={() => onChange(copy)}
                >
                  <span className="flex-1">
                    Copy #{copy.id}
                    {copy.barcode ? ` — ${copy.barcode}` : ""}
                    {copy.location ? ` · ${copy.location}` : ""}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Available
                  </Badge>
                </button>
              ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!selectedBorrower) {
      setError("Please select a borrower");
      return;
    }
    if (!selectedCopy) {
      setError("Please select a book copy");
      return;
    }

    setLoading(true);
    try {
      const { data } = await checkoutBook({
        borrowerId: selectedBorrower.id,
        bookCopyId: selectedCopy.id,
        notes: notes || undefined,
      });
      setResult(data);
      setSelectedBorrower(null);
      setSelectedCopy(null);
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Checkout Book</h1>
        <p className="text-muted-foreground">Check out a book to a borrower.</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Checkout Form
            </CardTitle>
            <CardDescription>
              Search for a borrower and select an available book copy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Borrower</Label>
                <BorrowerSearch
                  value={selectedBorrower}
                  onChange={setSelectedBorrower}
                />
              </div>
              <div className="space-y-2">
                <Label>Book Copy</Label>
                <BookCopySearch
                  value={selectedCopy}
                  onChange={setSelectedCopy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any notes about this checkout"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Processing..." : "Checkout Book"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">{result.message}</p>
                {result.data?.transaction && (
                  <div className="mt-2 text-sm space-y-1">
                    <p>Borrower: {result.data.transaction.borrower.fullName}</p>
                    <p>Book: {result.data.transaction.bookCopy.book.title}</p>
                    <p>
                      Due:{" "}
                      {new Date(
                        result.data.transaction.dueDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
