import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
import { ArrowLeft, BookOpen, Pencil, Check, X, Clock } from "lucide-react";
import { getBookById, updateBookCopy } from "@/services/bookService";
import {
  createReservation,
  getQueuePosition,
} from "@/services/reservationService";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";

const statusColor = {
  AVAILABLE: "default",
  BORROWED: "secondary",
  RESERVED: "outline",
  LOST: "destructive",
  UNAVAILABLE: "destructive",
};

export default function BookDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCopyId, setEditingCopyId] = useState(null);
  const [editValues, setEditValues] = useState({ barcode: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reserveMsg, setReserveMsg] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await getBookById(id);
        if (!cancelled) setBook(data.data);
      } catch (err) {
        if (!cancelled)
          setError(err.response?.data?.message || "Failed to load book");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch queue position when book is loaded and no copies available
  useEffect(() => {
    if (!book || book.availableCopies > 0 || !user) return;
    let cancelled = false;
    async function loadQueue() {
      try {
        const { data } = await getQueuePosition(book.id);
        if (!cancelled) setQueueInfo(data.data);
      } catch {
        // ignore
      }
    }
    loadQueue();
    return () => {
      cancelled = true;
    };
  }, [book, user]);

  async function handleReserve() {
    setReserving(true);
    setReserveMsg(null);
    try {
      await createReservation(Number(id));
      setReserveMsg({
        type: "success",
        text: "Reservation created! You'll be notified when a copy is available.",
      });
      // Refresh queue info
      const { data } = await getQueuePosition(Number(id));
      setQueueInfo(data.data);
    } catch (err) {
      setReserveMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to create reservation",
      });
    } finally {
      setReserving(false);
    }
  }

  function startEdit(copy) {
    setEditingCopyId(copy.id);
    setEditValues({
      barcode: copy.barcode || "",
      location: copy.location || "",
    });
  }

  function cancelEdit() {
    setEditingCopyId(null);
    setEditValues({ barcode: "", location: "" });
  }

  async function saveEdit(copyId) {
    setSaving(true);
    try {
      await updateBookCopy(id, copyId, {
        barcode: editValues.barcode || undefined,
        location: editValues.location || undefined,
      });
      // Refresh book data
      const { data } = await getBookById(id);
      setBook(data.data);
      setEditingCopyId(null);
    } catch {
      // keep editing on error
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" asChild>
          <Link to="/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{book.title}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Book Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Title</span>
              <span>{book.title}</span>
              <span className="font-medium text-muted-foreground">Author</span>
              <span>{book.author}</span>
              <span className="font-medium text-muted-foreground">ISBN</span>
              <span>{book.isbn || "N/A"}</span>
              <span className="font-medium text-muted-foreground">
                Category
              </span>
              <span>{book.category?.name || "Uncategorized"}</span>
              <span className="font-medium text-muted-foreground">
                Publisher
              </span>
              <span>{book.publisher || "N/A"}</span>
              <span className="font-medium text-muted-foreground">Year</span>
              <span>{book.publicationYear || "N/A"}</span>
            </div>
            {book.description && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm">{book.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{book.availableCopies}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">
                  {book.totalCopies}
                </p>
                <p className="text-sm text-muted-foreground">Total Copies</p>
              </div>
            </div>

            {/* Reservation section – shown when no copies available */}
            {book.availableCopies === 0 && book.totalCopies > 0 && (
              <div className="mb-4 rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  All copies are currently borrowed
                </p>
                {queueInfo?.position ? (
                  <p className="text-sm text-muted-foreground">
                    You are{" "}
                    <span className="font-semibold">#{queueInfo.position}</span>{" "}
                    in the reservation queue ({queueInfo.totalInQueue} total).
                  </p>
                ) : (
                  <Button
                    size="sm"
                    disabled={reserving}
                    onClick={handleReserve}
                  >
                    {reserving ? "Reserving…" : "Reserve This Book"}
                  </Button>
                )}
                {reserveMsg && (
                  <p
                    className={`text-sm mt-2 ${reserveMsg.type === "error" ? "text-destructive" : "text-emerald-600"}`}
                  >
                    {reserveMsg.text}
                  </p>
                )}
              </div>
            )}

            {book.copies && book.copies.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Copy ID</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {book.copies.map((copy) => (
                    <TableRow key={copy.id}>
                      <TableCell>#{copy.id}</TableCell>
                      {editingCopyId === copy.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editValues.barcode}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  barcode: e.target.value,
                                })
                              }
                              placeholder="Barcode"
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editValues.location}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  location: e.target.value,
                                })
                              }
                              placeholder="Location"
                              className="h-8 text-sm"
                            />
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{copy.barcode || "—"}</TableCell>
                          <TableCell>{copy.location || "—"}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <Badge variant={statusColor[copy.status] || "outline"}>
                          {copy.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingCopyId === copy.id ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={saving}
                              onClick={() => saveEdit(copy.id)}
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={cancelEdit}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(copy)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
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
    </div>
  );
}
