import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Loader2, FileText, Download } from "lucide-react";
import {
  getInventoryReport,
  getUsageReport,
  getPopularBooksReport,
  getOverdueTrendsReport,
} from "@/services/reportService";

const COLORS = [
  "#378ADD",
  "#1D9E75",
  "#BA7517",
  "#D85A30",
  "#7F77DD",
  "#D4537E",
];

const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0]?.includes &&
    args[0].includes(
      "The width(-1) and height(-1) of chart should be greater than 0",
    )
  ) {
    return; // Ignore this specific warning
  }
  originalWarn(...args);
};

// ── Shared components ──────────────────────────────────────────────────────

function MiniBar({ value, max, color = "#378ADD" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

function MetricCard({ label, value, danger }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className="text-2xl font-medium"
        style={danger ? { color: "#A32D2D" } : undefined}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function Badge({ children, variant = "blue" }) {
  const map = {
    blue: { background: "#E6F1FB", color: "#0C447C" },
    green: { background: "#EAF3DE", color: "#27500A" },
    amber: { background: "#FAEEDA", color: "#633806" },
    red: { background: "#FCEBEB", color: "#A32D2D" },
  };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={map[variant]}
    >
      {children}
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight border-b pb-2 mb-4">
      {children}
    </h2>
  );
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground gap-2 text-sm">
      <Loader2 className="animate-spin w-4 h-4" /> Loading…
    </div>
  );
}

// ── Section: Inventory ─────────────────────────────────────────────────────

function InventorySection({ data, loading }) {
  if (loading) return <SectionLoader />;
  if (!data) return null;

  const statusEntries = Object.entries(data.statusBreakdown || {});
  const maxVal = Math.max(...statusEntries.map(([, v]) => v), 1);
  const chartData = statusEntries.map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Total books"
          value={data.totalBooks?.toLocaleString()}
        />
        <MetricCard
          label="Total copies"
          value={data.totalCopies?.toLocaleString()}
        />
        {statusEntries.slice(0, 2).map(([k, v]) => (
          <MetricCard
            key={k}
            label={k}
            value={v?.toLocaleString()}
            danger={k.toLowerCase().includes("overdue")}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status breakdown</CardTitle>
            <CardDescription>Copy count by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Count
                  </th>
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium w-2/5">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {statusEntries.map(([k, v]) => {
                  const isOverdue = k.toLowerCase().includes("overdue");
                  const isOut =
                    k.toLowerCase().includes("out") ||
                    k.toLowerCase().includes("borrowed");
                  const variant = isOverdue ? "red" : isOut ? "blue" : "green";
                  const barColor = isOverdue
                    ? "#E24B4A"
                    : isOut
                      ? "#378ADD"
                      : "#639922";
                  return (
                    <tr key={k} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        <Badge variant={variant}>{k}</Badge>
                      </td>
                      <td className="py-2 px-3">{v?.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <MiniBar value={v} max={maxVal} color={barColor} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Copy distribution</CardTitle>
            <CardDescription>Visual breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[220px] min-w-0 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Section: Borrowing ─────────────────────────────────────────────────────

function BorrowingSection({ data, loading }) {
  if (loading) return <SectionLoader />;
  if (!data) return null;

  const monthEntries = Object.entries(data.byMonth || {});
  const categoryEntries = Object.entries(data.byCategory || {});
  const maxMonth = Math.max(...monthEntries.map(([, v]) => v), 1);
  const chartData = monthEntries.map(([k, v]) => ({ month: k, checkouts: v }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Total checkouts"
          value={data.totalCheckouts?.toLocaleString()}
        />
        {monthEntries.length > 0 && (
          <MetricCard
            label="Latest month"
            value={monthEntries[monthEntries.length - 1]?.[1]?.toLocaleString()}
          />
        )}
        {categoryEntries.length > 0 && (
          <MetricCard label="Top category" value={categoryEntries[0]?.[0]} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checkouts over time</CardTitle>
          <CardDescription>Monthly borrowing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[220px] min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="checkouts"
                  stroke="#378ADD"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By month</CardTitle>
            <CardDescription>Checkout count per month</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Month
                  </th>
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Checkouts
                  </th>
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium w-2/5">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthEntries.map(([k, v]) => (
                  <tr key={k} className="border-b last:border-0">
                    <td className="py-2 px-3 text-muted-foreground">{k}</td>
                    <td className="py-2 px-3">{v?.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <MiniBar value={v} max={maxMonth} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By category</CardTitle>
            <CardDescription>Checkouts per book category</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Category
                  </th>
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Checkouts
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryEntries.map(([k, v]) => (
                  <tr key={k} className="border-b last:border-0">
                    <td className="py-2 px-3">{k}</td>
                    <td className="py-2 px-3">{v?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Section: Popular Books ─────────────────────────────────────────────────

function PopularSection({ data, loading }) {
  if (loading) return <SectionLoader />;
  if (!data || data.length === 0)
    return (
      <p className="text-sm text-muted-foreground py-4">No data available.</p>
    );

  const chartData = data.map((item) => {
    const words = (item.book?.title ?? "").split(" ");
    return {
      title: words.slice(0, 3).join(" ") + (words.length > 3 ? "…" : ""),
      borrows: item.borrowCount,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most borrowed books</CardTitle>
          <CardDescription>Ranked by total borrow count</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  #
                </th>
                <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Title
                </th>
                <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium hidden sm:table-cell">
                  Author
                </th>
                <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium hidden md:table-cell">
                  Category
                </th>
                <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Borrows
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">
                    {item.book?.title ?? item.title}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell">
                    {item.book?.author ?? item.author}
                  </td>
                  <td className="py-2 px-3 hidden md:table-cell">
                    <Badge variant="blue">
                      {item.book?.category?.name ?? item.category}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">{item.borrowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Borrow count chart</CardTitle>
          <CardDescription>Top titles by popularity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[220px] min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="borrows" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section: Overdue Trends ────────────────────────────────────────────────

function OverdueSection({ data, loading }) {
  if (loading) return <SectionLoader />;
  if (!data || data.length === 0)
    return (
      <p className="text-sm text-muted-foreground py-4">No data available.</p>
    );

  const maxOverdue = Math.max(...data.map((r) => r.overdueCount ?? 0), 1);
  const last = data[data.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Latest overdue count"
          value={last?.overdueCount?.toLocaleString()}
          danger
        />
        <MetricCard
          label="Avg days overdue"
          value={last?.avgDaysOverdue?.toFixed(1)}
        />
        <MetricCard label="Months tracked" value={data.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdue trends</CardTitle>
            <CardDescription>Month-by-month overdue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Month
                  </th>
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Overdue
                  </th>
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Avg days late
                  </th>
                  <th className="text-left py-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium w-1/3">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-3 text-muted-foreground">
                      {row.month}
                    </td>
                    <td className="py-2 px-3">
                      {row.overdueCount?.toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      {row.avgDaysOverdue?.toFixed(1)}
                    </td>
                    <td className="py-2 px-3">
                      <MiniBar
                        value={row.overdueCount ?? 0}
                        max={maxOverdue}
                        color="#E24B4A"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdue chart</CardTitle>
            <CardDescription>Count and avg days late over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[220px] min-w-0 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="overdueCount"
                    name="Overdue count"
                    stroke={COLORS[3]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgDaysOverdue"
                    name="Avg days overdue"
                    stroke={COLORS[0]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── CSV builder ────────────────────────────────────────────────────────────

function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

function buildMergedCsv(inventory, borrowing, popular, overdue) {
  const parts = [];

  if (inventory) {
    parts.push("# INVENTORY");
    parts.push(
      rowsToCsv([
        { metric: "totalBooks", value: inventory.totalBooks },
        { metric: "totalCopies", value: inventory.totalCopies },
        ...Object.entries(inventory.statusBreakdown || {}).map(([k, v]) => ({
          metric: k,
          value: v,
        })),
      ]),
    );
  }

  if (borrowing) {
    parts.push("\n# BORROWING SUMMARY");
    parts.push(
      rowsToCsv([
        { metric: "totalCheckouts", value: borrowing.totalCheckouts },
      ]),
    );
    parts.push("\n# BORROWING BY MONTH");
    parts.push(
      rowsToCsv(
        Object.entries(borrowing.byMonth || {}).map(([month, checkouts]) => ({
          month,
          checkouts,
        })),
      ),
    );
    parts.push("\n# BORROWING BY CATEGORY");
    parts.push(
      rowsToCsv(
        Object.entries(borrowing.byCategory || {}).map(
          ([category, checkouts]) => ({ category, checkouts }),
        ),
      ),
    );
  }

  if (popular?.length) {
    parts.push("\n# POPULAR BOOKS");
    parts.push(
      rowsToCsv(
        popular.map((item) => ({
          title: item.book?.title,
          author: item.book?.author,
          category: item.book?.category?.name,
          borrowCount: item.borrowCount,
        })),
      ),
    );
  }

  if (overdue?.length) {
    parts.push("\n# OVERDUE TRENDS");
    parts.push(
      rowsToCsv(
        overdue.map((r) => ({
          month: r.month,
          overdueCount: r.overdueCount,
          avgDaysOverdue: r.avgDaysOverdue,
        })),
      ),
    );
  }

  return parts.join("\n");
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState({
    inventory: null,
    borrowing: null,
    popular: null,
    overdue: null,
  });
  const [loading, setLoading] = useState({
    inventory: true,
    borrowing: true,
    popular: true,
    overdue: true,
  });
  const [exporting, setExporting] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    Promise.allSettled([
      getInventoryReport(),
      getUsageReport(),
      getPopularBooksReport(),
      getOverdueTrendsReport(),
    ]).then(([inv, bor, pop, ovr]) => {
      setData({
        inventory:
          inv.status === "fulfilled" && inv.value?.data?.success
            ? inv.value.data.data
            : null,
        borrowing:
          bor.status === "fulfilled" && bor.value?.data?.success
            ? bor.value.data.data
            : null,
        popular:
          pop.status === "fulfilled" && pop.value?.data?.success
            ? pop.value.data.data.books
            : null,
        overdue:
          ovr.status === "fulfilled" && ovr.value?.data?.success
            ? ovr.value.data.data.trends
            : null,
      });
      setLoading({
        inventory: false,
        borrowing: false,
        popular: false,
        overdue: false,
      });
    });
  }, []);

  const anyLoading = Object.values(loading).some(Boolean);

  // CSV
  const handleCsvExport = () => {
    const csv = buildMergedCsv(
      data.inventory,
      data.borrowing,
      data.popular,
      data.overdue,
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "library-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF
  const handlePdfExport = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const PW = pdf.internal.pageSize.getWidth(); // 595
      const PH = pdf.internal.pageSize.getHeight(); // 842
      const ML = 40,
        MR = 40,
        MT = 40;
      const CW = PW - ML - MR; // 515
      let y = MT;

      // ── Helpers ────────────────────────────────────────────────────────────

      function checkPage(needed = 20) {
        if (y + needed > PH - 30) {
          pdf.addPage();
          y = MT;
        }
      }

      function sectionTitle(text) {
        checkPage(40);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(30, 30, 30);
        pdf.text(text, ML, y);
        y += 4;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(ML, y, ML + CW, y);
        y += 14;
      }

      function label(text, x, yy, size = 7.5) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(size);
        pdf.setTextColor(120, 120, 120);
        pdf.text(text, x, yy);
      }

      function value(text, x, yy, size = 18, color = [20, 20, 20]) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        pdf.text(String(text ?? "—"), x, yy);
      }

      function metricBox(lbl, val, x, yy, w, danger = false) {
        pdf.setFillColor(248, 248, 248);
        pdf.roundedRect(x, yy, w, 46, 3, 3, "F");
        label(lbl, x + 8, yy + 13);
        value(val, x + 8, yy + 34, 16, danger ? [163, 45, 45] : [20, 20, 20]);
      }

      function tableHeader(cols, x, yy, rowH = 18) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(x, yy, CW, rowH, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        let cx = x + 6;
        cols.forEach(({ text, w }) => {
          pdf.text(text.toUpperCase(), cx, yy + 12);
          cx += w;
        });
        return yy + rowH;
      }

      function tableRow(cols, vals, x, yy, rowH = 16, shade = false) {
        if (shade) {
          pdf.setFillColor(252, 252, 252);
          pdf.rect(x, yy, CW, rowH, "F");
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(40, 40, 40);
        let cx = x + 6;
        cols.forEach(({ w }, i) => {
          const txt = String(vals[i] ?? "—");
          pdf.text(txt, cx, yy + 11);
          cx += w;
        });
        pdf.setDrawColor(230, 230, 230);
        pdf.line(x, yy + rowH, x + CW, yy + rowH);
        return yy + rowH;
      }

      function miniBarRow(pct, x, yy, color = [55, 138, 221]) {
        const bx = x,
          by = yy + 4,
          bw = 80,
          bh = 5;
        pdf.setFillColor(220, 220, 220);
        pdf.roundedRect(bx, by, bw, bh, 2, 2, "F");
        pdf.setFillColor(...color);
        pdf.roundedRect(bx, by, Math.max(2, (bw * pct) / 100), bh, 2, 2, "F");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`${pct}%`, bx + bw + 4, yy + 10);
      }

      // ── Header ─────────────────────────────────────────────────────────────

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(20, 20, 20);
      pdf.text("Library Analytics", ML, y);
      y += 14;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        ML,
        y,
      );
      y += 24;

      // ── INVENTORY ──────────────────────────────────────────────────────────

      if (data.inventory) {
        const inv = data.inventory;
        sectionTitle("Inventory");

        const statusEntries = Object.entries(inv.statusBreakdown || {});
        const colW = CW / 4 - 4;
        const boxes = [
          { label: "Total books", value: inv.totalBooks?.toLocaleString() },
          { label: "Total copies", value: inv.totalCopies?.toLocaleString() },
          ...statusEntries.slice(0, 2).map(([k, v]) => ({
            label: k,
            value: v?.toLocaleString(),
            danger: k.toLowerCase().includes("overdue"),
          })),
        ];
        boxes.forEach((b, i) => {
          metricBox(b.label, b.value, ML + i * (colW + 5), y, colW, b.danger);
        });
        y += 58;

        if (statusEntries.length) {
          checkPage(30 + statusEntries.length * 16);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(40, 40, 40);
          pdf.text("Status Breakdown", ML, y);
          y += 8;

          const cols = [
            { text: "Status", w: 160 },
            { text: "Count", w: 80 },
            { text: "Share", w: CW - 240 },
          ];
          y = tableHeader(cols, ML, y);
          const maxVal = Math.max(...statusEntries.map(([, v]) => v), 1);
          statusEntries.forEach(([k, v], i) => {
            checkPage(18);
            const pct = Math.round((v / maxVal) * 100);
            // draw row bg + text
            y = tableRow(
              cols,
              [k, v?.toLocaleString(), ""],
              ML,
              y,
              18,
              i % 2 === 1,
            );
            // draw mini bar in the Share column
            miniBarRow(pct, ML + 240, y - 14);
          });
          y += 16;
        }
      }

      // ── BORROWING ──────────────────────────────────────────────────────────

      if (data.borrowing) {
        const bor = data.borrowing;
        checkPage(120);
        sectionTitle("Borrowing Activity");

        const monthEntries = Object.entries(bor.byMonth || {});
        const categoryEntries = Object.entries(bor.byCategory || {});
        const colW = CW / 3 - 4;

        const mboxes = [
          {
            label: "Total checkouts",
            value: bor.totalCheckouts?.toLocaleString(),
          },
          {
            label: "Latest month",
            value: monthEntries[monthEntries.length - 1]?.[1]?.toLocaleString(),
          },
          { label: "Top category", value: categoryEntries[0]?.[0] },
        ];
        mboxes.forEach((b, i) => {
          metricBox(b.label, b.value, ML + i * (colW + 6), y, colW);
        });
        y += 58;

        // By Month table
        if (monthEntries.length) {
          checkPage(30 + monthEntries.length * 16);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(40, 40, 40);
          pdf.text("Checkouts by Month", ML, y);
          y += 8;
          const maxMonth = Math.max(...monthEntries.map(([, v]) => v), 1);
          const cols = [
            { text: "Month", w: 120 },
            { text: "Checkouts", w: 100 },
            { text: "Volume", w: CW - 220 },
          ];
          y = tableHeader(cols, ML, y);
          monthEntries.forEach(([k, v], i) => {
            checkPage(18);
            const pct = Math.round((v / maxMonth) * 100);
            y = tableRow(
              cols,
              [k, v?.toLocaleString(), ""],
              ML,
              y,
              18,
              i % 2 === 1,
            );
            miniBarRow(pct, ML + 220, y - 14);
          });
          y += 16;
        }

        // By Category table
        if (categoryEntries.length) {
          checkPage(30 + categoryEntries.length * 16);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(40, 40, 40);
          pdf.text("Checkouts by Category", ML, y);
          y += 8;
          const cols = [
            { text: "Category", w: 300 },
            { text: "Checkouts", w: CW - 300 },
          ];
          y = tableHeader(cols, ML, y);
          categoryEntries.forEach(([k, v], i) => {
            checkPage(16);
            y = tableRow(
              cols,
              [k, v?.toLocaleString()],
              ML,
              y,
              16,
              i % 2 === 1,
            );
          });
          y += 16;
        }
      }

      // ── POPULAR BOOKS ──────────────────────────────────────────────────────

      if (data.popular?.length) {
        checkPage(60);
        sectionTitle("Popular Books");
        const cols = [
          { text: "#", w: 24 },
          { text: "Title", w: 180 },
          { text: "Author", w: 140 },
          { text: "Category", w: 100 },
          { text: "Borrows", w: CW - 444 },
        ];
        y = tableHeader(cols, ML, y);
        data.popular.forEach((item, i) => {
          checkPage(16);
          y = tableRow(
            cols,
            [
              i + 1,
              item.book?.title ?? item.title ?? "—",
              item.book?.author ?? item.author ?? "—",
              item.book?.category?.name ?? item.category ?? "—",
              item.borrowCount,
            ],
            ML,
            y,
            16,
            i % 2 === 1,
          );
        });
        y += 16;
      }

      // ── OVERDUE TRENDS ─────────────────────────────────────────────────────

      if (data.overdue?.length) {
        checkPage(60);
        sectionTitle("Overdue Trends");
        const last = data.overdue[data.overdue.length - 1];
        const colW = CW / 3 - 4;
        const oboxes = [
          {
            label: "Latest overdue count",
            value: last?.overdueCount?.toLocaleString(),
            danger: true,
          },
          {
            label: "Avg days overdue",
            value: last?.avgDaysOverdue?.toFixed(1),
          },
          { label: "Months tracked", value: data.overdue.length },
        ];
        oboxes.forEach((b, i) => {
          metricBox(b.label, b.value, ML + i * (colW + 6), y, colW, b.danger);
        });
        y += 58;

        const maxOverdue = Math.max(
          ...data.overdue.map((r) => r.overdueCount ?? 0),
          1,
        );
        const cols = [
          { text: "Month", w: 100 },
          { text: "Overdue", w: 80 },
          { text: "Avg days late", w: 100 },
          { text: "Trend", w: CW - 280 },
        ];
        y = tableHeader(cols, ML, y);
        data.overdue.forEach((row, i) => {
          checkPage(18);
          const pct = Math.round(((row.overdueCount ?? 0) / maxOverdue) * 100);
          y = tableRow(
            cols,
            [
              row.month,
              row.overdueCount?.toLocaleString(),
              row.avgDaysOverdue?.toFixed(1),
              "",
            ],
            ML,
            y,
            18,
            i % 2 === 1,
          );
          miniBarRow(pct, ML + 280, y - 14, [226, 75, 74]);
        });
        y += 16;
      }

      // ── Footer on every page ───────────────────────────────────────────────

      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(160, 160, 160);
        pdf.text("Library Management System", ML, PH - 16);
        pdf.text(`Page ${i} of ${pageCount}`, PW - MR, PH - 16, {
          align: "right",
        });
      }

      pdf.save("library-report.pdf");
    } catch (e) {
      console.error("PDF export error:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    // KEY FIX: w-0 forces this flex child to start at 0 width and only grow
    // into available space (respecting the sidebar). Without it, flex-1 sizes
    // to content and blows past the parent boundary.
    <div className="flex flex-1 flex-col gap-8 p-6 bg-background">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Library analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive overview of inventory, loans, and trends.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(anyLoading || exporting) && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Export all
          </span>
          <button
            onClick={handleCsvExport}
            disabled={anyLoading || exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handlePdfExport}
            disabled={anyLoading || exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Full page content — captured by PDF */}
      <div ref={pageRef} className="flex flex-col gap-10 w-full min-w-0">
        <section>
          <SectionTitle>Inventory</SectionTitle>
          <InventorySection data={data.inventory} loading={loading.inventory} />
        </section>

        <section>
          <SectionTitle>Borrowing activity</SectionTitle>
          <BorrowingSection data={data.borrowing} loading={loading.borrowing} />
        </section>

        <section>
          <SectionTitle>Popular books</SectionTitle>
          <PopularSection data={data.popular} loading={loading.popular} />
        </section>

        <section>
          <SectionTitle>Overdue trends</SectionTitle>
          <OverdueSection data={data.overdue} loading={loading.overdue} />
        </section>
      </div>
    </div>
  );
}
