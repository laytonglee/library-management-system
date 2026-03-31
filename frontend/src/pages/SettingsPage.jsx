export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground">
        Manage borrowing policies and system configuration.
      </p>
      <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-xl" />
    </div>
  );
}
