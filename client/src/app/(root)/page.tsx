"use client";

import { WebsitesTable } from "@/components/home/websites-table";
import { RemainingCreditsCard } from "@/components/home/remaining-credits-card";
import { CreateMonitorCard } from "@/components/home/create-monitor-card";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { getWebsitesByPubKey, type Website } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Home() {
  const account = useActiveAccount();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      if (!account?.address) {
        setWebsites([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await getWebsitesByPubKey(account.address);

        if (response.success && response.data) {
          setWebsites(response.data.websites);
          setCredits(response.data.user.credits);
        } else {
          setError(response.error || "Failed to fetch websites");
        }
      } catch (err) {
        console.error("Error fetching websites:", err);
        setError("Failed to fetch websites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebsites();
  }, [account?.address]);

  return (
    <div className="w-full">
      <div className="flex mb-6 items-center justify-between">
        <p className="text-3xl font-semibold mb-8">Monitors</p>
      </div>

      {!account ? (
        <div className="w-full text-center py-20">
          <p className="text-lg text-muted-foreground">
            Please connect your wallet to view your monitors
          </p>
        </div>
      ) : isLoading ? (
        <div className="w-full text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading monitors...</p>
        </div>
      ) : error ? (
        <div className="w-full text-center py-20">
          <p className="text-lg text-destructive">{error}</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-6 gap-6">
          <WebsitesTable websites={websites} />
          <div className="col-span-2 space-y-6">
            <RemainingCreditsCard credits={credits} />
            <CreateMonitorCard />
          </div>
        </div>
      )}
    </div>
  );
}
