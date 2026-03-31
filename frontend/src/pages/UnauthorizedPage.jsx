import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <ShieldAlert className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground text-center max-w-md">
        You do not have permission to view this page. If you believe this is a
        mistake, please contact your administrator.
      </p>
      <Button asChild variant="outline">
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
