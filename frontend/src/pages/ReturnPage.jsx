import { useState, useEffect, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftRight, CheckCircle, AlertCircle, Search, X } from "lucide-react";
import { returnBook, getActiveTransactions } from "@/services/transactionService";

export default function ReturnPage() {
  const [allActive, setAllActive] = useState([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function loadActive() {
    setLoadingActive(true);
    try {
      const { data } = await getActiveTransactions();
      setAllActive(data.data || []);
    } catch {
      setAllActive([]);
    } finally {
      setLoadingActive(false);
    }
  }

  useEffect(() => { loadActive(); }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allActive;
    return allActive.filter((tx) =>
      tx.borrower.fullName.toLowerCase().includes(q) ||
      tx.borrower.email.toLowerCase().includes(q) ||
      tx.bookCopy.book.title.toLowerCase().includes(q) ||
      tx.bookCopy.book.author.toLowerCase().includes(q) ||
      (tx.bookCopy.barcode && tx.bookCopy.barcode.toLowerCase().includes(q))
    );
  }, [allActive, searchQuery]);

  async function handleReturn(e) {
    e.preventDefault();
    if (!selectedTx) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await returnBook({
        bookCopyId: selectedTx.bookCopy.id,
        notes: notes || undefined,
      });
      setResult(data);
      setSelectedTx(null);
      setNotes("");
      setSearchQuery("");
      await loadActive();
    } catch (err) {
      setError(err.response?.data?.message || "Return failed");
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Return Book</h1>
        <p className="text-muted-foreground">Process a book return.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — active loans list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Active Loans
            </CardTitle>
            <CardDescription>
              Search and select the transaction to return.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search by borrower, book title, author, or barcode…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {loadingActive ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                {allActive.length === 0 ? "No active loans." : "No results match your search."}
              </p>
            ) : (
              <div className="rounded-md border overflow-auto max-h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((tx) => {
                      const isOverdue = new Date(tx.dueDate) < now;
                      const isSelected = selectedTx?.id === tx.id;
                      return (
                        <TableRow
                          key={tx.id}
                          className={`cursor-pointer ${isSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                          onClick={() => setSelectedTx(isSelected ? null : tx)}
                        >
                          <TableCell className="font-medium">{tx.borrower.fullName}</TableCell>
                          <TableCell className="text-sm">{tx.bookCopy.book.title}</TableCell>
                          <TableCell>
                            <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs whitespace-nowrap">
                              {new Date(tx.dueDate).toLocaleDateString()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — return form + result */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Return Form
              </CardTitle>
              <CardDescription>
                {selectedTx
                  ? "Review the selected loan and confirm the return."
                  : "Select a loan from the list to proceed."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTx ? (
                <form onSubmit={handleReturn} className="space-y-4">
                  {/* Selected transaction summary */}
                  <div className="rounded-md border p-3 space-y-1 text-sm bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{selectedTx.bookCopy.book.title}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTx(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-muted-foreground">by {selectedTx.bookCopy.book.author}</p>
                    <p>Borrower: <span className="font-medium">{selectedTx.borrower.fullName}</span></p>
                    <p>Copy #{selectedTx.bookCopy.id}{selectedTx.bookCopy.barcode ? ` — ${selectedTx.bookCopy.barcode}` : ""}</p>
                    <p>
                      Due:{" "}
                      <span className={new Date(selectedTx.dueDate) < now ? "text-destructive font-medium" : ""}>
                        {new Date(selectedTx.dueDate).toLocaleDateString()}
                        {new Date(selectedTx.dueDate) < now && " (overdue)"}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Any notes about this return"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Processing..." : "Confirm Return"}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No loan selected. Click a row on the left to select it.
                </p>
              )}
            </CardContent>
          </Card>

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
                    {result.data.transaction.daysOverdue && (
                      <p className="text-destructive">
                        Days Overdue: {result.data.transaction.daysOverdue}
                      </p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
