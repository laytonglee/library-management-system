import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  getOverdue,
  getOverdueSummary,
  runOverdueCheck,
} from "@/services/transactionService";

export default function OverduePage() {
  const [overdueItems, setOverdueItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [overdueRes, summaryRes] = await Promise.all([
        getOverdue({ page, limit: 20 }),
        getOverdueSummary(),
      ]);
      setOverdueItems(overdueRes.data.data);
      setPagination(overdueRes.data.pagination);
      setSummary(summaryRes.data.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page]);

  async function handleRunCheck() {
    setChecking(true);
    try {
      await runOverdueCheck();
      await loadData();
    } catch {
      // silently handle
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Overdue Books</h1>
          <p className="text-muted-foreground">
            View all overdue transactions and summaries.
          </p>
        </div>
        <Button onClick={handleRunCheck} disabled={checking} variant="outline">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`}
          />
          {checking ? "Checking..." : "Run Overdue Check"}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">
                {summary.totalOverdue}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Days Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.averageDaysOverdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Max Days Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.maxDaysOverdue}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Overdue Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : overdueItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No overdue items found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.borrower.fullName}
                      </TableCell>
                      <TableCell>{item.bookCopy.book.title}</TableCell>
                      <TableCell>
                        {new Date(item.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {item.daysOverdue} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.borrower.email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center text-sm text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
