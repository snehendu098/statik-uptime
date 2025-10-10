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
import { Settings } from "lucide-react";
import { useState } from "react";

type IntervalType = "1m" | "5m" | "10m" | "1h" | "custom";
type TimeUnit = "seconds" | "minutes" | "hours" | "days";

export function CreateMonitorCard() {
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>("5m");
  const [customValue, setCustomValue] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<TimeUnit>("minutes");

  return (
    <div className="p-6 mt-6 border bg-card rounded-4xl overflow-hidden transition-all duration-300 ease-in-out">
      <div className="space-y-4">
        <p className="text-lg font-semibold">Create Monitor</p>

        <Input className="w-full rounded-2xl" placeholder="www.example.com" />

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
                      <SelectItem value="seconds">Seconds</SelectItem>
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
      <Button className="rounded-xl mt-6 w-full">Create Monitor</Button>
    </div>
  );
}
