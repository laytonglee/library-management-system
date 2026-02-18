export default function UsersPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <p className="text-muted-foreground">
        View, create, and manage user accounts and roles.
      </p>
      <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-xl" />
    </div>
  );
}
