import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, BookOpen, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { getBookById } from "@/services/bookService";

// fallback image
const FALLBACK_IMAGE = "https://m.media-amazon.com/images/I/61ozZNaPh+L.jpg";

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        // The service call
        const res = await getBookById(id);
        setBook(res.data.data);
      } catch (error) {
        console.error("Failed to fetch book:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBook();
  }, [id]);

  if (!book) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Book not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 size-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 size-4" />
        Back
      </Button>

      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* 📘 Cover */}
            <div className="flex justify-center">
              <img
                src={book.coverImageUrl || FALLBACK_IMAGE}
                alt={book.title}
                className="w-64 h-96 object-cover rounded-xl shadow"
              />
            </div>

            {/* 📖 Info */}
            <div className="md:col-span-2 space-y-5">
              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold">{book.title}</h1>
                <p className="text-muted-foreground text-lg">
                  by {book.author}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <BookOpen className="mr-1 size-3" />
                  {book.category?.name}
                </Badge>

                <Badge variant="outline">
                  <Calendar className="mr-1 size-3" />
                  {book.publicationYear}
                </Badge>

                <Badge variant="outline">
                  <Hash className="mr-1 size-3" />
                  {book.isbn}
                </Badge>

                <Badge
                  variant={book.availableCopies > 0 ? "default" : "destructive"}
                >
                  {book.availableCopies} / {book.totalCopies} available
                </Badge>
              </div>

              <Separator />

              {/* Publisher */}
              <div>
                <h3 className="font-semibold">Publisher</h3>
                <p className="text-muted-foreground">{book.publisher}</p>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {book.description}
                </p>
              </div>

              <Separator />

              {/* Dates */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {new Date(book.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(book.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
