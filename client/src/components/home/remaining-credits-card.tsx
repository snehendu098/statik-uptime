"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

export function RemainingCreditsCard() {
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState<string>("1000");

  return (
    <div className="p-6 border bg-card rounded-4xl overflow-hidden transition-all duration-300 ease-in-out">
      <div className="space-y-4">
        <p className="text-sm font-semibold text-muted-foreground">
          Remaining Credits
        </p>
        <p className="text-4xl font-semibold">5000</p>
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Cost Per Validation: 100
          </p>
          <Button
            size={"icon-sm"}
            className="rounded-xl"
            onClick={() => setShowBuyCredits(!showBuyCredits)}
          >
            <PlusIcon className="w-4 aspect-square" />
          </Button>
        </div>

        {/* Buy Credits Section */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showBuyCredits
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="rounded-xl flex-1"
                  min="1"
                  placeholder="1000"
                />
                <Button
                  className="rounded-xl"
                  onClick={() => {
                    // Handle buy credits
                    console.log("Buy credits:", creditAmount);
                  }}
                >
                  Buy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
