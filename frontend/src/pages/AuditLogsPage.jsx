import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollText, Search } from "lucide-react";
import { getAuditLogs } from "@/services/auditService";

const actionColors = {
  CHECKOUT: "default",
  RETURN: "secondary",
  ADD_BOOK: "outline",
  EDIT_BOOK: "outline",
  ADD_COPY: "outline",
  LOGIN: "secondary",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionFilter, setActionFilter] = useState("all");

  async function loadLogs() {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (actionFilter !== "all") params.action = actionFilter;
      const { data } = await getAuditLogs(params);
      setLogs(data.data);
      setPagination(data.pagination);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Review system audit log entries.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CHECKOUT">Checkout</SelectItem>
            <SelectItem value="RETURN">Return</SelectItem>
            <SelectItem value="ADD_BOOK">Add Book</SelectItem>
            <SelectItem value="EDIT_BOOK">Edit Book</SelectItem>
            <SelectItem value="ADD_COPY">Add Copy</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            <p className="text-center text-muted-foreground py-8">
              No audit logs found.
            </p>
          ) : (
            <>
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
                      <TableCell>{log.id}</TableCell>
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
                          "System"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.targetType
                          ? `${log.targetType} #${log.targetId}`
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {log.ipAddress || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
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
