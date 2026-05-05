import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollText, X } from "lucide-react";
import { getAuditLogs } from "@/services/auditService";
import { toast } from "sonner";

const actionColors = {
  CHECKOUT: "default",
  RETURN: "secondary",
  ADD_BOOK: "outline",
  EDIT_BOOK: "outline",
  ADD_COPY: "outline",
  LOGIN: "secondary",
  LOGIN_FAILED: "destructive",
  OVERDUE_FLAG: "destructive",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionFilter, setActionFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadLogs() {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (actionFilter !== "all") params.action = actionFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const { data } = await getAuditLogs(params);
      setLogs(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, fromDate, toDate]);

  function clearFilters() {
    setActionFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  const hasFilters = actionFilter !== "all" || fromDate || toDate;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Review system audit log entries.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Action</Label>
              <Select
                value={actionFilter}
                onValueChange={(v) => { setActionFilter(v); setPage(1); }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  <SelectItem value="CHECKOUT">Checkout</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="ADD_BOOK">Add Book</SelectItem>
                  <SelectItem value="EDIT_BOOK">Edit Book</SelectItem>
                  <SelectItem value="ADD_COPY">Add Copy</SelectItem>
                  <SelectItem value="OVERDUE_FLAG">Overdue Flag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">From date</Label>
              <Input
                type="date"
                className="w-[160px]"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">To date</Label>
              <Input
                type="date"
                className="w-[160px]"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Audit Trail {pagination && `(${pagination.total} entries)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <ScrollText className="h-10 w-10 opacity-30" />
              <p className="text-sm">No audit logs found{hasFilters ? " for the selected filters" : ""}.</p>
              {hasFilters && (
                <Button variant="link" size="sm" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-xs">{log.id}</TableCell>
                        <TableCell>
                          <Badge variant={actionColors[log.action] || "outline"}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.actor ? (
                            <span>
                              {log.actor.fullName}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({log.actor.role?.name})
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.targetType ? `${log.targetType} #${log.targetId}` : "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {log.ipAddress || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="flex items-center text-sm text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
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
