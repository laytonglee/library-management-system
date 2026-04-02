import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Clock, CalendarClock } from "lucide-react";
import { getUserTransactions } from "@/services/transactionService";
import {
  getReservations,
  cancelReservation,
} from "@/services/reservationService";

const statusVariant = {
  ACTIVE: "default",
  RETURNED: "secondary",
  OVERDUE: "destructive",
};

const reservationVariant = {
  ACTIVE: "default",
  FULFILLED: "secondary",
  CANCELED: "outline",
  EXPIRED: "destructive",
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resLoading, setResLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [canceling, setCanceling] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (statusFilter !== "all") params.status = statusFilter;
        const { data } = await getUserTransactions(user.id);
        if (!cancelled) {
          setTransactions(data.data);
          setPagination(data.pagination);
        }
      } catch {
        // silently handle
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, page, statusFilter]);

  // Load reservations
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadRes() {
      setResLoading(true);
      try {
        const { data } = await getReservations();
        if (!cancelled) setReservations(data.data);
      } catch {
        // silently handle
      } finally {
        if (!cancelled) setResLoading(false);
      }
    }
    loadRes();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleCancelReservation(id) {
    setCanceling(id);
    try {
      await cancelReservation(id);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "CANCELED", canceledAt: new Date().toISOString() }
            : r,
        ),
      );
    } catch {
      // silently handle
    } finally {
      setCanceling(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">My Borrowing History</h1>
        <p className="text-muted-foreground">
          View your past and current book borrowings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transactions
            </CardTitle>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No borrowing history found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Checkout Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Link
                          to={`/books/${t.bookCopy.book.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.bookCopy.book.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.bookCopy.book.author}
                      </TableCell>
                      <TableCell>
                        {new Date(t.checkoutDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(t.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {t.returnDate
                          ? new Date(t.returnDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[t.status] || "outline"}>
                          {t.status}
                        </Badge>
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

      {/* My Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            My Reservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No reservations found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Reserved On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        to={`/books/${r.book.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.book.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.book.author}
                    </TableCell>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={reservationVariant[r.status] || "outline"}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={canceling === r.id}
                          onClick={() => handleCancelReservation(r.id)}
                        >
                          {canceling === r.id ? "Canceling…" : "Cancel"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
