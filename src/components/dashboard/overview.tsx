"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Mock data - this would be fetched from the API in a real app
const data = [
  {
    name: "Jan",
    revenue: 580,
  },
  {
    name: "Feb",
    revenue: 690,
  },
  {
    name: "Mar",
    revenue: 1100,
  },
  {
    name: "Apr",
    revenue: 1200,
  },
  {
    name: "May",
    revenue: 900,
  },
  {
    name: "Jun",
    revenue: 1500,
  },
  {
    name: "Jul",
    revenue: 1800,
  },
  {
    name: "Aug",
    revenue: 1200,
  },
  {
    name: "Sep",
    revenue: 1700,
  },
  {
    name: "Oct",
    revenue: 1400,
  },
  {
    name: "Nov",
    revenue: 2100,
  },
  {
    name: "Dec",
    revenue: 1900,
  },
];

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          formatter={(value: number) => [`${value}`, "Revenue"]}
          cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
        />
        <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
