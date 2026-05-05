import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Database, Download, Upload, HardDrive, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function DataManagementPage() {
  const [importing, setImporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  async function handleExport() {
    try {
      const response = await api.get("/data-management/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `library-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully.");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImportError("");
    setImportResult(null);
    setImporting(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Support both the export format (with books/categories) and a simple { books, categories } shape
      const payload = {
        categories: json.categories || [],
        books: (json.books || []).map((b) => ({
          ...b,
          categoryName: b.category?.name || b.categoryName || null,
        })),
      };

      const { data } = await api.post("/data-management/import", payload);
      setImportResult(data.data);
      toast.success(`Import complete: ${data.data.importedBooks} books, ${data.data.importedCategories} categories.`);
    } catch (err) {
      const msg = err.response?.data?.message || (err instanceof SyntaxError ? "Invalid JSON file." : "Import failed.");
      setImportError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }

  async function handleBackup() {
    setBackingUp(true);
    try {
      const response = await api.get("/data-management/backup", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/sql" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `library-backup-${new Date().toISOString().split("T")[0]}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Database backup downloaded.");
    } catch (err) {
      const msg = err.response?.data?.message || "Backup failed.";
      toast.error(msg);
    } finally {
      setBackingUp(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Data Management</h1>
        <p className="text-muted-foreground">Export, import, and back up library data.</p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <p className="text-sm ml-2">
          These operations affect all library data. Use with caution. Only administrators can access this page.
        </p>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download all books, categories, users, and transactions as a JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import books and categories from a JSON file. Existing records are updated by ISBN.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              disabled={importing}
              onClick={() => document.getElementById("import-file").click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importing..." : "Choose JSON File"}
            </Button>
            <input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport} />

            {importResult && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                {importResult.importedBooks} books, {importResult.importedCategories} categories imported.
              </div>
            )}
            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-5 w-5" />
              Database Backup
            </CardTitle>
            <CardDescription>
              Download a full SQL backup via pg_dump. Requires PostgreSQL client tools on the server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              disabled={backingUp}
              onClick={handleBackup}
            >
              <Database className="h-4 w-4 mr-2" />
              {backingUp ? "Generating..." : "Download SQL Backup"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Format guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import File Format</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted rounded p-3 overflow-x-auto">{`{
  "categories": [
    { "name": "Fiction", "description": "Fictional works" }
  ],
  "books": [
    {
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "categoryName": "Fiction",
      "publisher": "Scribner",
      "publicationYear": 1925
    }
  ]
}`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
