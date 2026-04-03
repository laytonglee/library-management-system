import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import api from "@/services/api";

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, trend, trendLabel, color }) {
  const isPositive = trend >= 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">
          {title}
        </CardDescription>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
            {isPositive ? "+" : ""}
            {trend}%
          </span>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-30 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="h-100 rounded-xl bg-muted lg:col-span-4" />
        <div className="h-100 rounded-xl bg-muted lg:col-span-3" />
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get("/dashboard/stats");
        const d = res.data.data;
        setStats({
          ...d.stats,
          booksTrend: 0,
          membersTrend: 0,
          loansTrend: 0,
          overdueTrend: 0,
        });
        setTransactions(d.recentTransactions);
        setPopularBooks(d.popularBooks);
        setOverdueItems(d.overdueItems);
        setCategories(d.categoryBreakdown);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* ── Welcome ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your library
          today.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Books"
          value={stats.totalBooks}
          icon={BookOpen}
          trend={stats.booksTrend}
          trendLabel="from last month"
          color="bg-blue-500"
        />
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          trend={stats.membersTrend}
          trendLabel="from last month"
          color="bg-emerald-500"
        />
        <StatCard
          title="Active Loans"
          value={stats.activeLoans}
          icon={ArrowLeftRight}
          trend={stats.loansTrend}
          trendLabel="from last week"
          color="bg-violet-500"
        />
        <StatCard
          title="Overdue Books"
          value={stats.overdueBooks}
          icon={AlertTriangle}
          trend={stats.overdueTrend}
          trendLabel="from last week"
          color="bg-red-500"
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Left — Recent Activity + Overdue (tabbed) */}
        <Card className="lg:col-span-4">
          <Tabs defaultValue="recent">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Activity</CardTitle>
                <CardDescription>Recent library transactions</CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="overdue">
                  Overdue
                  {overdueItems.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-1.5 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
                    >
                      {overdueItems.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="recent" className="mt-0">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px]">
                                {tx.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {tx.borrower}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{tx.book}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.type === "checkout" ? "default" : "secondary"
                            }
                          >
                            {tx.type === "checkout" ? "Checkout" : "Return"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {tx.date}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>

            <TabsContent value="overdue" className="mt-0">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead className="text-right">Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {item.borrower}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{item.book}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {item.daysOverdue} days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {item.dueDate}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Right — Popular Books */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Popular Books</CardTitle>
              <CardDescription>Most borrowed this month</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/search">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {popularBooks.map((book, i) => (
              <div key={book.id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                  📚
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate pr-2">
                      {book.title}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate pr-2">
                      {book.author}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {book.borrows} borrows
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Category Breakdown ── */}
      <Card>
        <CardHeader>
          <CardTitle>Collection by Category</CardTitle>
          <CardDescription>Book availability across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">
                    {cat.count} books
                  </span>
                </div>
                <Progress value={cat.percent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {cat.percent}% available
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
