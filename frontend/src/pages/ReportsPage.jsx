export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-muted-foreground">
        View inventory, usage, popular books, and overdue trend reports.
      </p>
      <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-xl" />
    </div>
  );
}
