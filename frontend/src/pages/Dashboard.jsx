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
  Star,
  ArrowUpRight,
} from "lucide-react";

// ─── Fake API helpers (simulates network delay + realistic data) ─────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fakeFetchStats() {
  await delay(600);
  return {
    totalBooks: 2_847,
    totalMembers: 1_235,
    activeLoans: 384,
    overdueBooks: 23,
    booksTrend: +5.2,
    membersTrend: +12.1,
    loansTrend: -2.4,
    overdueTrend: +8.3,
  };
}

async function fakeFetchRecentTransactions() {
  await delay(800);
  return [
    {
      id: 1,
      borrower: "Alice Johnson",
      book: "Clean Code",
      type: "checkout",
      date: "2026-02-18",
      avatar: "AJ",
    },
    {
      id: 2,
      borrower: "Bob Smith",
      book: "Design Patterns",
      type: "return",
      date: "2026-02-18",
      avatar: "BS",
    },
    {
      id: 3,
      borrower: "Carol Davis",
      book: "The Pragmatic Programmer",
      type: "checkout",
      date: "2026-02-17",
      avatar: "CD",
    },
    {
      id: 4,
      borrower: "Dan Wilson",
      book: "Refactoring",
      type: "return",
      date: "2026-02-17",
      avatar: "DW",
    },
    {
      id: 5,
      borrower: "Eve Martinez",
      book: "Introduction to Algorithms",
      type: "checkout",
      date: "2026-02-17",
      avatar: "EM",
    },
    {
      id: 6,
      borrower: "Frank Lee",
      book: "Structure and Interpretation",
      type: "return",
      date: "2026-02-16",
      avatar: "FL",
    },
    {
      id: 7,
      borrower: "Grace Kim",
      book: "Artificial Intelligence",
      type: "checkout",
      date: "2026-02-16",
      avatar: "GK",
    },
  ];
}

async function fakeFetchPopularBooks() {
  await delay(700);
  return [
    {
      id: 1,
      title: "Clean Code",
      author: "Robert C. Martin",
      borrows: 47,
      rating: 4.8,
      cover: "📘",
    },
    {
      id: 2,
      title: "Design Patterns",
      author: "Gang of Four",
      borrows: 39,
      rating: 4.6,
      cover: "📗",
    },
    {
      id: 3,
      title: "The Pragmatic Programmer",
      author: "Hunt & Thomas",
      borrows: 35,
      rating: 4.9,
      cover: "📕",
    },
    {
      id: 4,
      title: "Introduction to Algorithms",
      author: "Cormen et al.",
      borrows: 31,
      rating: 4.5,
      cover: "📙",
    },
    {
      id: 5,
      title: "Refactoring",
      author: "Martin Fowler",
      borrows: 28,
      rating: 4.7,
      cover: "📓",
    },
  ];
}

async function fakeFetchOverdueItems() {
  await delay(750);
  return [
    {
      id: 1,
      borrower: "Hank Brown",
      book: "Data Structures",
      dueDate: "2026-02-10",
      daysOverdue: 8,
      email: "hank@school.edu",
    },
    {
      id: 2,
      borrower: "Ivy Chen",
      book: "Operating Systems",
      dueDate: "2026-02-12",
      daysOverdue: 6,
      email: "ivy@school.edu",
    },
    {
      id: 3,
      borrower: "Jake Torres",
      book: "Computer Networks",
      dueDate: "2026-02-14",
      daysOverdue: 4,
      email: "jake@school.edu",
    },
    {
      id: 4,
      borrower: "Karen White",
      book: "Database Systems",
      dueDate: "2026-02-15",
      daysOverdue: 3,
      email: "karen@school.edu",
    },
  ];
}

async function fakeFetchCategoryBreakdown() {
  await delay(500);
  return [
    { name: "Computer Science", count: 642, percent: 78 },
    { name: "Mathematics", count: 389, percent: 65 },
    { name: "Engineering", count: 312, percent: 54 },
    { name: "Science Fiction", count: 287, percent: 48 },
    { name: "Literature", count: 245, percent: 42 },
    { name: "History", count: 198, percent: 35 },
  ];
}

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
        const [s, t, p, o, c] = await Promise.all([
          fakeFetchStats(),
          fakeFetchRecentTransactions(),
          fakeFetchPopularBooks(),
          fakeFetchOverdueItems(),
          fakeFetchCategoryBreakdown(),
        ]);
        setStats(s);
        setTransactions(t);
        setPopularBooks(p);
        setOverdueItems(o);
        setCategories(c);
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
                  {book.cover}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate pr-2">
                      {book.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
                      <Star className="h-3 w-3 fill-amber-500" />
                      {book.rating}
                    </div>
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
