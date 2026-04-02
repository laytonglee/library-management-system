import { useState } from "react";
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
import { BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import { checkoutBook } from "@/services/transactionService";

export default function CheckoutPage() {
  const [borrowerId, setBorrowerId] = useState("");
  const [bookCopyId, setBookCopyId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!borrowerId || !bookCopyId) {
      setError("Borrower ID and Book Copy ID are required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await checkoutBook({
        borrowerId: parseInt(borrowerId, 10),
        bookCopyId: parseInt(bookCopyId, 10),
        notes: notes || undefined,
      });
      setResult(data);
      setBorrowerId("");
      setBookCopyId("");
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Checkout Form
            </CardTitle>
            <CardDescription>
              Enter the borrower ID and book copy ID to process a checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="borrowerId">Borrower ID</Label>
                <Input
                  id="borrowerId"
                  type="number"
                  placeholder="Enter borrower user ID"
                  value={borrowerId}
                  onChange={(e) => setBorrowerId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookCopyId">Book Copy ID</Label>
                <Input
                  id="bookCopyId"
                  type="number"
                  placeholder="Enter book copy ID"
                  value={bookCopyId}
                  onChange={(e) => setBookCopyId(e.target.value)}
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
  );
}
