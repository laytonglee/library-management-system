import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookCopy,
  Plus,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  searchBooks,
  createBook,
  deleteBook,
  getCategories,
  createCategory,
  deleteCategory,
  addBookCopy,
} from "@/services/bookService";

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");

  // Add-book form
  const [showAdd, setShowAdd] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    categoryId: "",
    publisher: "",
    publicationYear: "",
    description: "",
    totalCopies: "1",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Add-copy form
  const [addCopyBookId, setAddCopyBookId] = useState(null);
  const [newCopy, setNewCopy] = useState({ barcode: "", location: "" });
  const [copyLoading, setCopyLoading] = useState(false);

  // Category management
  const [newCategoryName, setNewCategoryName] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  async function loadBooks() {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await searchBooks(params);
      setBooks(data.data);
      setPagination(data.pagination);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const { data } = await getCategories();
      setCategories(data.data);
    } catch {
      // silently handle
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);
  useEffect(() => {
    loadBooks();
  }, [page]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadBooks();
  }

  async function handleAddBook(e) {
    e.preventDefault();
    setFeedback(null);
    setAddLoading(true);
    try {
      await createBook({
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn || undefined,
        categoryId: newBook.categoryId
          ? parseInt(newBook.categoryId, 10)
          : undefined,
        publisher: newBook.publisher || undefined,
        publicationYear: newBook.publicationYear
          ? parseInt(newBook.publicationYear, 10)
          : undefined,
        description: newBook.description || undefined,
        totalCopies: parseInt(newBook.totalCopies, 10) || 1,
      });
      setFeedback({ type: "success", message: "Book added successfully" });
      setNewBook({
        title: "",
        author: "",
        isbn: "",
        categoryId: "",
        publisher: "",
        publicationYear: "",
        description: "",
        totalCopies: "1",
      });
      setShowAdd(false);
      loadBooks();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to add book",
      });
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(bookId) {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      await deleteBook(bookId);
      loadBooks();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to delete book",
      });
    }
  }

  async function handleAddCopy(e) {
    e.preventDefault();
    setCopyLoading(true);
    setFeedback(null);
    try {
      await addBookCopy(addCopyBookId, {
        barcode: newCopy.barcode || undefined,
        location: newCopy.location || undefined,
      });
      setFeedback({ type: "success", message: "Copy added" });
      setAddCopyBookId(null);
      setNewCopy({ barcode: "", location: "" });
      loadBooks();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to add copy",
      });
    } finally {
      setCopyLoading(false);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCatLoading(true);
    setFeedback(null);
    try {
      await createCategory({ name: newCategoryName.trim() });
      setNewCategoryName("");
      setFeedback({ type: "success", message: "Category added" });
      loadCategories();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to add category",
      });
    } finally {
      setCatLoading(false);
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      setFeedback({ type: "success", message: "Category deleted" });
      loadCategories();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to delete category",
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalog Management</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage books in the library catalog.
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-2 h-4 w-4" />
          {showAdd ? "Cancel" : "Add Book"}
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type === "error" ? "destructive" : "default"}>
          {feedback.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      {/* Add Book Form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Book</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleAddBook}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newBook.title}
                  onChange={(e) =>
                    setNewBook({ ...newBook, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Author *</Label>
                <Input
                  value={newBook.author}
                  onChange={(e) =>
                    setNewBook({ ...newBook, author: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>ISBN</Label>
                <Input
                  value={newBook.isbn}
                  onChange={(e) =>
                    setNewBook({ ...newBook, isbn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newBook.categoryId}
                  onValueChange={(v) =>
                    setNewBook({ ...newBook, categoryId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Publisher</Label>
                <Input
                  value={newBook.publisher}
                  onChange={(e) =>
                    setNewBook({ ...newBook, publisher: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Publication Year</Label>
                <Input
                  type="number"
                  value={newBook.publicationYear}
                  onChange={(e) =>
                    setNewBook({ ...newBook, publicationYear: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Input
                  value={newBook.description}
                  onChange={(e) =>
                    setNewBook({ ...newBook, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Total Copies</Label>
                <Input
                  type="number"
                  min="1"
                  value={newBook.totalCopies}
                  onChange={(e) =>
                    setNewBook({ ...newBook, totalCopies: e.target.value })
                  }
                />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={addLoading}>
                  {addLoading ? "Adding..." : "Add Book"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookCopy className="h-5 w-5" />
            Books {pagination && `(${pagination.total})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No books found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Copies</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>{book.id}</TableCell>
                      <TableCell className="font-medium">
                        {book.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {book.author}
                      </TableCell>
                      <TableCell>{book.category?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {book.isbn || "—"}
                      </TableCell>
                      <TableCell>{book.totalCopies}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            book.availableCopies > 0 ? "default" : "destructive"
                          }
                        >
                          {book.availableCopies}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setAddCopyBookId(book.id);
                                setNewCopy({ barcode: "", location: "" });
                              }}
                            >
                              Add Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(book.id)}
                            >
                              Delete Book
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Add Copy Form */}
              {addCopyBookId && (
                <Card className="mt-4 border-dashed">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium mb-3">
                      Add copy to:{" "}
                      <span className="text-primary">
                        {books.find((b) => b.id === addCopyBookId)?.title}
                      </span>
                    </p>
                    <form
                      onSubmit={handleAddCopy}
                      className="flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Barcode</Label>
                        <Input
                          placeholder="e.g. BC-00123"
                          value={newCopy.barcode}
                          onChange={(e) =>
                            setNewCopy({ ...newCopy, barcode: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Location</Label>
                        <Input
                          placeholder="e.g. Shelf A3, Row 2"
                          value={newCopy.location}
                          onChange={(e) =>
                            setNewCopy({ ...newCopy, location: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={copyLoading}>
                          {copyLoading ? "Adding..." : "Add Copy"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAddCopyBookId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

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

      {/* Category Management */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Manage book categories</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="max-w-xs"
            />
            <Button
              type="submit"
              disabled={catLoading || !newCategoryName.trim()}
            >
              {catLoading ? "Adding..." : "Add Category"}
            </Button>
          </form>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">No categories yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="gap-1 pr-1">
                  {cat.name}{" "}
                  {cat._count?.books != null && `(${cat._count.books})`}
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                    title="Delete category"
                  >
                    <AlertCircle className="h-3 w-3 text-destructive" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
