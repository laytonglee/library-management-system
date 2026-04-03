import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings2, Pencil, Check, X, BookOpen, Clock } from "lucide-react";
import {
  getBorrowingPolicies,
  updateBorrowingPolicy,
} from "@/services/userService";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("librarian", "admin");

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    loanDurationDays: 0,
    maxBooksAllowed: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  async function loadPolicies() {
    setLoading(true);
    try {
      const { data } = await getBorrowingPolicies();
      setPolicies(data.data);
    } catch {
      setError("Failed to load borrowing policies");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(policy) {
    setEditingId(policy.roleId);
    setEditValues({
      loanDurationDays: policy.loanDurationDays,
      maxBooksAllowed: policy.maxBooksAllowed,
    });
    setError(null);
    setSuccessMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({ loanDurationDays: 0, maxBooksAllowed: 0 });
  }

  async function saveEdit(roleId) {
    if (editValues.loanDurationDays < 1 || editValues.maxBooksAllowed < 1) {
      setError("Values must be at least 1");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await updateBorrowingPolicy(roleId, {
        loanDurationDays: Number(editValues.loanDurationDays),
        maxBooksAllowed: Number(editValues.maxBooksAllowed),
      });
      setPolicies((prev) =>
        prev.map((p) => (p.roleId === roleId ? data.data : p)),
      );
      setEditingId(null);
      setSuccessMsg("Policy updated successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update policy");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage borrowing policies and system configuration.
        </p>
      </div>

      {/* Borrowing Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Borrowing Policies
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure loan duration and maximum books allowed per role.
          </p>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          {successMsg && (
            <p className="text-sm text-emerald-600 mb-4">{successMsg}</p>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : policies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No borrowing policies configured.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Loan Duration (days)
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      Max Books Allowed
                    </span>
                  </TableHead>
                  {canEdit && <TableHead className="w-20"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.roleId}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-sm">
                        {policy.role?.name || `Role ${policy.roleId}`}
                      </Badge>
                    </TableCell>

                    {editingId === policy.roleId ? (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              value={editValues.loanDurationDays}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  loanDurationDays: e.target.value,
                                })
                              }
                              className="h-8 w-24 text-sm"
                            />
                            <span className="text-sm text-muted-foreground">
                              days
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={editValues.maxBooksAllowed}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  maxBooksAllowed: e.target.value,
                                })
                              }
                              className="h-8 w-24 text-sm"
                            />
                            <span className="text-sm text-muted-foreground">
                              books
                            </span>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <span className="font-medium">
                            {policy.loanDurationDays}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            days
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {policy.maxBooksAllowed}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            books
                          </span>
                        </TableCell>
                      </>
                    )}

                    {canEdit && (
                      <TableCell>
                        {editingId === policy.roleId ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={saving}
                              onClick={() => saveEdit(policy.roleId)}
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
                            onClick={() => startEdit(policy)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Policy Summary Cards */}
      {!loading && policies.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {policies.map((policy) => (
            <Card key={policy.roleId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {policy.role?.name || `Role ${policy.roleId}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Duration</span>
                    <span className="font-medium">
                      {policy.loanDurationDays} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Books</span>
                    <span className="font-medium">
                      {policy.maxBooksAllowed}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
