import { useParams } from "react-router-dom";

export default function BookDetailPage() {
  const { id } = useParams();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Book Details</h1>
      <p className="text-muted-foreground">Viewing book #{id}</p>
      <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-xl" />
    </div>
  );
}
