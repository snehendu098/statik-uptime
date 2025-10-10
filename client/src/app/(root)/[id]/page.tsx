"use client";

import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/website/stat-card";
import { TicksChart } from "@/components/website/ticks-chart";
import {
  ArrowLeft,
  Activity,
  Zap,
  CheckCircle2,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

// Tick interface
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

// Mock data based on hub API response structure
interface WebsiteStats {
  website: {
    id: string;
    url: string;
    disabled: boolean;
    checkIntervalMinutes: number;
  };
  stats: {
    totalChecks: number;
    goodChecks: number;
    badChecks: number;
    uptimePercentage: number;
    averageLatency: number;
  };
  recentTicks: Tick[];
}

// Mock ticks data - Replace this with actual API data
const mockTicks: Tick[] = [
  {
    id: "tick-001",
    status: "Good",
    latency: 142,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    validator: {
      id: "val-1",
      pubKey: "0x1234567890abcdef1234567890abcdef12345678",
      location: "US-East",
      ip: "192.168.1.1",
    },
  },
  {
    id: "tick-002",
    status: "Good",
    latency: 138,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    validator: {
      id: "val-2",
      pubKey: "0xabcdef1234567890abcdef1234567890abcdef12",
      location: "EU-West",
      ip: "192.168.1.2",
    },
  },
  {
    id: "tick-003",
    status: "Good",
    latency: 156,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    validator: {
      id: "val-3",
      pubKey: "0xfedcba0987654321fedcba0987654321fedcba09",
      location: "Asia-Pacific",
      ip: "192.168.1.3",
    },
  },
  {
    id: "tick-004",
    status: "Bad",
    latency: 250,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    validator: {
      id: "val-4",
      pubKey: "0x9876543210fedcba9876543210fedcba98765432",
      location: "US-West",
      ip: "192.168.1.4",
    },
  },
  {
    id: "tick-005",
    status: "Good",
    latency: 145,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    validator: {
      id: "val-1",
      pubKey: "0x1234567890abcdef1234567890abcdef12345678",
      location: "US-East",
      ip: "192.168.1.1",
    },
  },
  {
    id: "tick-006",
    status: "Good",
    latency: 132,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    validator: {
      id: "val-2",
      pubKey: "0xabcdef1234567890abcdef1234567890abcdef12",
      location: "EU-West",
      ip: "192.168.1.2",
    },
  },
  {
    id: "tick-007",
    status: "Good",
    latency: 167,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    validator: {
      id: "val-3",
      pubKey: "0xfedcba0987654321fedcba0987654321fedcba09",
      location: "Asia-Pacific",
      ip: "192.168.1.3",
    },
  },
  {
    id: "tick-008",
    status: "Good",
    latency: 128,
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    validator: {
      id: "val-4",
      pubKey: "0x9876543210fedcba9876543210fedcba98765432",
      location: "US-West",
      ip: "192.168.1.4",
    },
  },
  {
    id: "tick-009",
    status: "Good",
    latency: 189,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    validator: {
      id: "val-1",
      pubKey: "0x1234567890abcdef1234567890abcdef12345678",
      location: "US-East",
      ip: "192.168.1.1",
    },
  },
  {
    id: "tick-010",
    status: "Good",
    latency: 143,
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    validator: {
      id: "val-2",
      pubKey: "0xabcdef1234567890abcdef1234567890abcdef12",
      location: "EU-West",
      ip: "192.168.1.2",
    },
  },
];

// Calculate stats from ticks data
const totalChecks = mockTicks.length;
const goodChecks = mockTicks.filter((t) => t.status === "Good").length;
const badChecks = mockTicks.filter((t) => t.status === "Bad").length;
const uptimePercentage = parseFloat(
  ((goodChecks / totalChecks) * 100).toFixed(2),
);
const averageLatency = parseFloat(
  (mockTicks.reduce((sum, t) => sum + t.latency, 0) / totalChecks).toFixed(2),
);

const mockWebsiteStats: WebsiteStats = {
  website: {
    id: "1",
    url: "https://example.com",
    disabled: false,
    checkIntervalMinutes: 5,
  },
  stats: {
    totalChecks,
    goodChecks,
    badChecks,
    uptimePercentage,
    averageLatency,
  },
  recentTicks: mockTicks,
};

const Page = () => {
  const params = useParams();
  const [websiteStats] = useState<WebsiteStats>(mockWebsiteStats);
  const [, setUpdateTrigger] = useState(0);

  // Update the display every second to refresh the "time ago" text
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const formatTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const remainingSecs = diffSecs % 60;

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ${remainingSecs}s ago`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    if (diffHours < 24) return `${diffHours}h ${remainingMins}m ago`;
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return `${diffDays}d ${remainingHours}h ago`;
  };

  const cleanUrl = (url: string) => {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  };

  const lastChecked = websiteStats.recentTicks[0]?.createdAt
    ? formatTimeSince(websiteStats.recentTicks[0].createdAt)
    : "Never";

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-x-4 flex">
          <Button variant={"outline"} className="rounded-xl" asChild>
            <Link href={"/"}>
              <ArrowLeft className="w-8 text-muted-foreground aspect-auto" />
            </Link>
          </Button>
          <p className="text-2xl font-semibold">
            {cleanUrl(websiteStats.website.url)}
          </p>
        </div>

        {/*Refresh Button*/}
        <Button className="rounded-xl" variant={"secondary"}>
          <RefreshCcw className="w-4 aspect-square" />
        </Button>
      </div>

      {/* Ticks Chart */}
      <TicksChart ticks={websiteStats.recentTicks} />

      {/* Uptime, Last Checked, Total Validations */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          title="Uptime"
          value={`${websiteStats.stats.uptimePercentage}%`}
          subtitle={`${websiteStats.stats.goodChecks} good / ${websiteStats.stats.badChecks} bad checks`}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Average Latency"
          value={`${websiteStats.stats.averageLatency}ms`}
          subtitle={`Checked every ${websiteStats.website.checkIntervalMinutes} minutes`}
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          title="Total Validations"
          value={websiteStats.stats.totalChecks.toLocaleString()}
          subtitle={`Last checked ${lastChecked}`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>
    </div>
  );
};

export default Page;
