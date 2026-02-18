export default function CatalogPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Catalog Management</h1>
      <p className="text-muted-foreground">
        Add, edit, and manage books in the library catalog.
      </p>
      <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-xl" />
    </div>
  );
}
