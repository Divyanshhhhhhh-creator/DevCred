"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface TokenGraphProps {
  data: Array<{
    date: string;
    amount: number;
    price?: number;
  }>;
  onRangeChange?: (range: "1W" | "1M" | "1Y") => void;
}

export function TokenGraph({ data, onRangeChange }: TokenGraphProps) {
  const [selectedRange, setSelectedRange] = React.useState<"1W" | "1M" | "1Y">("1M");

  const handleRangeChange = (range: "1W" | "1M" | "1Y") => {
    setSelectedRange(range);
    if (onRangeChange) onRangeChange(range);
  };

  const handleExportCSV = () => {
    const csv = [
      ["Date", "Amount", "Price"],
      ...data.map((row) => [row.date, row.amount.toString(), row.price?.toString() || ""]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "token-data.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-surface-dark p-3 rounded-lg shadow-lg border border-border dark:border-border-dark">
          <p className="text-sm font-medium">{label ? formatDate(label) : ""}</p>
          <p className="text-sm text-primary">
            Amount: {payload[0].value.toLocaleString()}
          </p>
          {payload[1] && (
            <p className="text-sm text-green-600">
              Price: ${payload[1].value.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={selectedRange === "1W" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRangeChange("1W")}
          >
            1W
          </Button>
          <Button
            variant={selectedRange === "1M" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRangeChange("1M")}
          >
            1M
          </Button>
          <Button
            variant={selectedRange === "1Y" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRangeChange("1Y")}
          >
            1Y
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eff3f4" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#536471"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              yAxisId="left"
              stroke="#536471"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#536471"
              style={{ fontSize: "12px" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              stroke="#1DA1F2"
              strokeWidth={2}
              dot={false}
              name="Tokens"
            />
            {data[0]?.price !== undefined && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Price ($)"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
