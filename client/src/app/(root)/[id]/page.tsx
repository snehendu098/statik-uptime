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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getWebsiteStats, type WebsiteTick } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// WebsiteStats interface matching hub API response
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
  recentTicks: WebsiteTick[];
}

const Page = () => {
  const params = useParams();
  const { toast } = useToast();
  const [websiteStats, setWebsiteStats] = useState<WebsiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setUpdateTrigger] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const fetchWebsiteData = async () => {
    if (!params.id || typeof params.id !== "string") {
      toast({
        title: "Error",
        description: "Invalid website ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setRefreshing(true);
      const response = await getWebsiteStats(params.id);

      if (response.success && response.data) {
        setWebsiteStats({
          website: {
            id: response.data.website.id,
            url: response.data.website.url,
            disabled: response.data.website.disabled,
            checkIntervalMinutes: response.data.website.checkIntervalMinutes,
          },
          stats: response.data.stats,
          recentTicks: response.data.recentTicks,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch website stats",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching website stats:", error);
      toast({
        title: "Error",
        description: "Failed to load website data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchWebsiteData();
  }, [params.id]);

  // Update the display every second to refresh the "time ago" text
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh based on checkIntervalMinutes after the most recent tick
  useEffect(() => {
    if (
      !websiteStats ||
      !autoRefreshEnabled ||
      websiteStats.recentTicks.length === 0
    ) {
      return;
    }

    // Get the most recent tick (last item in array as it's sorted oldest to newest)
    const mostRecentTick =
      websiteStats.recentTicks[websiteStats.recentTicks.length - 1];
    const lastCheckTime = new Date(mostRecentTick.createdAt).getTime();
    const intervalMs = websiteStats.website.checkIntervalMinutes * 60 * 1000;
    const nextCheckTime = lastCheckTime + intervalMs;
    const now = Date.now();

    // Add 10 second buffer to ensure new tick has been created
    const bufferMs = 2 * 1000;
    const msUntilNextCheck = nextCheckTime - now + bufferMs;

    // If next check is overdue, refresh immediately
    if (msUntilNextCheck <= 0) {
      console.log("Check is overdue, refreshing immediately...");
      fetchWebsiteData();
      return;
    }

    console.log(
      `Auto-refresh scheduled in ${Math.floor(msUntilNextCheck / 1000)} seconds`,
    );

    // Schedule auto-refresh
    const timeoutId = setTimeout(() => {
      console.log("Auto-refreshing data...");
      fetchWebsiteData();
    }, msUntilNextCheck);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      clearTimeout(timeoutId);
    };
  }, [websiteStats, autoRefreshEnabled]);

  const handleRefresh = () => {
    fetchWebsiteData();
  };

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

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading website data...
          </p>
        </div>
      </div>
    );
  }

  if (!websiteStats) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold">Website not found</p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const lastChecked = websiteStats.recentTicks[
    websiteStats.recentTicks.length - 1
  ]?.createdAt
    ? formatTimeSince(
        websiteStats.recentTicks[websiteStats.recentTicks.length - 1].createdAt,
      )
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

        {/* Refresh Button */}
        <Button
          className="rounded-xl"
          variant={"secondary"}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCcw
            className={`w-4 aspect-square ${refreshing ? "animate-spin" : ""}`}
          />
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
