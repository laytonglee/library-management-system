import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Scatter,
  ErrorBar,
} from "recharts";
import { Loader2 } from "lucide-react";
import { getTransactions } from "@/services/transactionService";
import { getCategories } from "@/services/bookService";
import { getOverdueDistribution } from "@/services/reportService";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function ReportsPage() {
  const [rawData, setRawData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [distData, setDistData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [transRes, catRes, distRes] = await Promise.all([
          getTransactions(),
          getCategories(),
          getOverdueDistribution(),
        ]);

        if (transRes.data.success) setRawData(transRes.data.data);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (distRes.data.success) setDistData(distRes.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const categoryData = useMemo(() => {
    return categories.map((cat, index) => ({
      name: cat.name,
      value: cat._count?.books || 0,
    }));
  }, [categories]);

  const borrowingTrendData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const counts = {};
    rawData.forEach((item) => {
      if (!item.checkoutDate) return;
      const date = new Date(item.checkoutDate);
      const monthName = months[date.getMonth()];
      counts[monthName] = (counts[monthName] || 0) + 1;
    });
    return months
      .filter((m) => counts[m] !== undefined)
      .map((month) => ({ month, transactions: counts[month] }));
  }, [rawData]);

  const boxPlotData = useMemo(() => {
    if (distData.length === 0) return [];
    const values = distData.map((d) => d.daysOverdue).sort((a, b) => a - b);
    const n = values.length;
    const q1 = values[Math.floor(n * 0.25)];
    const q3 = values[Math.floor(n * 0.75)];

    return [
      {
        name: "Days Late",
        min: values[0],
        q1: q1,
        median: values[Math.floor(n * 0.5)],
        q3: q3,
        max: values[n - 1],
        box: [q1, q3],
      },
    ];
  }, [distData]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 bg-background">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Library Analytics
          </h1>
          <p className="text-muted-foreground">
            Real-time health of your inventory and loans.
          </p>
        </div>
        {loading && <Loader2 className="animate-spin text-primary" />}
      </div>

      {/* ROW 1: SAME AS BEFORE */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Borrowing Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={borrowingTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Overdue Severity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {distData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={boxPlotData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="max" fill="none">
                    <ErrorBar
                      dataKey="max"
                      stroke="#ef4444"
                      direction="y"
                      width={10}
                      strokeWidth={2}
                    />
                    <ErrorBar
                      dataKey="min"
                      stroke="#ef4444"
                      direction="y"
                      width={10}
                      strokeWidth={2}
                    />
                  </Bar>
                  <Bar
                    dataKey="q3"
                    fill="#fee2e2"
                    stroke="#ef4444"
                    barSize={40}
                  />
                  <Scatter
                    dataKey="median"
                    fill="white"
                    shape="line"
                    stroke="#b91c1c"
                    strokeWidth={3}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No overdue items to analyze.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: SINGLE COLUMN EXTENDED */}
      <div className="grid gap-6 grid-cols-1">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Book Distribution by Category</CardTitle>
            <CardDescription>Total inventory volume per genre.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                />
                {/* For vertical layout, X is the number and Y is the name */}
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
