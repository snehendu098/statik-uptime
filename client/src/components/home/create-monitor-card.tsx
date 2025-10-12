"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Loader2 } from "lucide-react";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { signMessage } from "thirdweb/utils";
import { createWebsite } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type IntervalType = "1m" | "5m" | "10m" | "1h" | "custom";
type TimeUnit = "minutes" | "hours" | "days";

export function CreateMonitorCard() {
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>("5m");
  const [customValue, setCustomValue] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<TimeUnit>("minutes");
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const account = useActiveAccount();
  const { toast } = useToast();

  // Convert interval selection to minutes
  const getIntervalInMinutes = (): number => {
    if (selectedInterval === "custom") {
      const value = parseInt(customValue) || 5;
      switch (customUnit) {
        case "minutes":
          return value;
        case "hours":
          return value * 60;
        case "days":
          return value * 60 * 24;
        default:
          return 5;
      }
    }

    // Convert preset intervals
    switch (selectedInterval) {
      case "1m":
        return 1;
      case "5m":
        return 5;
      case "10m":
        return 10;
      case "1h":
        return 60;
      default:
        return 5;
    }
  };

  const handleCreateMonitor = async () => {
    // Validation
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a website URL",
        variant: "destructive",
      });
      return;
    }

    if (!account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (selectedInterval === "custom" && !customValue) {
      toast({
        title: "Error",
        description: "Please enter a custom interval value",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Format URL if needed
      let formattedUrl = url.trim();
      if (
        !formattedUrl.startsWith("http://") &&
        !formattedUrl.startsWith("https://")
      ) {
        formattedUrl = `https://${formattedUrl}`;
      }

      // Create message to sign
      const message = `Create website monitoring for ${formattedUrl}`;

      // Sign the message
      const signature = await signMessage({
        account,
        message,
      });

      // Get interval in minutes
      const checkIntervalMinutes = getIntervalInMinutes();

      // Call API to create website
      const response = await createWebsite({
        pubKey: account.address,
        url: formattedUrl,
        signedMessage: signature,
        checkIntervalMinutes,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Monitor created for ${formattedUrl}`,
        });

        // Reset form
        setUrl("");
        setSelectedInterval("5m");
        setCustomValue("");
        setCustomUnit("minutes");

        // Reload page to show new monitor
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create monitor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating monitor:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create monitor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 mt-6 border bg-card rounded-4xl overflow-hidden transition-all duration-300 ease-in-out">
      <div className="space-y-4">
        <p className="text-lg font-semibold">Create Monitor</p>

        <Input
          className="w-full rounded-2xl"
          placeholder="www.example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />

        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Interval</Label>

          {/* Interval Selection Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant={selectedInterval === "1m" ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setSelectedInterval("1m")}
            >
              1m
            </Button>
            <Button
              type="button"
              variant={selectedInterval === "5m" ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setSelectedInterval("5m")}
            >
              5m
            </Button>
            <Button
              type="button"
              variant={selectedInterval === "10m" ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setSelectedInterval("10m")}
            >
              10m
            </Button>
            <Button
              type="button"
              variant={selectedInterval === "1h" ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setSelectedInterval("1h")}
            >
              1h
            </Button>
            <Button
              type="button"
              variant={selectedInterval === "custom" ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setSelectedInterval("custom")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Custom Interval Input */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              selectedInterval === "custom"
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="pt-2">
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Enter value"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="rounded-xl flex-1"
                    min="1"
                  />
                  <Select
                    value={customUnit}
                    onValueChange={(value: TimeUnit) => setCustomUnit(value)}
                  >
                    <SelectTrigger className="rounded-xl w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Button
        className="rounded-xl mt-6 w-full"
        onClick={handleCreateMonitor}
        disabled={isLoading || !account}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Monitor"
        )}
      </Button>
      {!account && (
        <p className="text-sm text-muted-foreground text-center mt-2">
          Please connect your wallet to create a monitor
        </p>
      )}
    </div>
  );
}
