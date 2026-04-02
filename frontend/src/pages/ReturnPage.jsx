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
import { ArrowLeftRight, CheckCircle, AlertCircle } from "lucide-react";
import { returnBook } from "@/services/transactionService";

export default function ReturnPage() {
  const [bookCopyId, setBookCopyId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!bookCopyId) {
      setError("Book Copy ID is required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await returnBook({
        bookCopyId: parseInt(bookCopyId, 10),
        notes: notes || undefined,
      });
      setResult(data);
      setBookCopyId("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.message || "Return failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Return Book</h1>
        <p className="text-muted-foreground">Process a book return.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Return Form
            </CardTitle>
            <CardDescription>
              Enter the book copy ID to process a return.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Any notes about this return"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Processing..." : "Return Book"}
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
