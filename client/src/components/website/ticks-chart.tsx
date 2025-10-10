"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart } from "lucide-react";

interface Tick {
  id: string;
  status: "Good" | "Bad" | "Unknown";
  latency: number;
  createdAt: string;
  validator?: {
    id: string;
    pubKey: string;
    location: string;
    ip: string;
  };
}

interface TicksChartProps {
  ticks: Tick[];
}

const chartConfig = {
  latency: {
    label: "Latency",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function TicksChart({ ticks }: TicksChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const chartData = ticks.map((tick, _index) => {
    const date = new Date(tick.createdAt);
    const timeLabel = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

    return {
      time: timeLabel,
      latency: Math.max(0, tick.latency),
      status: tick.status,
    };
  });

  return (
    <Card className="rounded-4xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Response Time</CardTitle>
            <CardDescription>
              Latency measurements over recent checks
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={() => setChartType("line")}
            >
              <LineChart className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[30vh] w-full">
          {chartType === "line" ? (
            <AreaChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="time" visibility={"hidden"} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}ms`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Time: ${value}`}
                    formatter={(value) => [`${value}ms Latency`]}
                  />
                }
              />
              <Area
                dataKey="latency"
                type="monotone"
                fill="var(--color-primary)"
                fillOpacity={0.4}
                stroke="var(--color-primary)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="time" visibility={"hidden"} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}ms`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Time: ${value}`}
                    formatter={(value) => [`${value}ms Latency`]}
                  />
                }
              />
              <Bar
                dataKey="latency"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
