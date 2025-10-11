"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contract } from "@/lib/thirdweb-client";
import { updateCredits } from "@/lib/api";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { prepareContractCall, sendTransaction, toWei } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";

interface RemainingCreditsCardProps {
  credits?: number;
  fetch: () => Promise<void>;
}

export function RemainingCreditsCard({
  fetch,
  credits = 0,
}: RemainingCreditsCardProps) {
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState<string>("1000");
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();
  const router = useRouter();

  const handleClick = async () => {
    if (account) {
      try {
        setIsLoading(true);

        const transaction = prepareContractCall({
          contract,
          method:
            "function deposit(uint256 creditAmount) payable returns (uint256 creditsReceived)",
          params: [BigInt(creditAmount)],
          value: toWei(String(Number(creditAmount) / 10000)),
        });

        const txn = await sendTransaction({
          transaction,
          account,
        });

        if (txn.transactionHash) {
          // Sign a message to verify ownership
          const message = `Add ${creditAmount} credits`;
          const signedMessage = await account.signMessage({ message });

          // Save creditAmount to database
          const result = await updateCredits({
            pubKey: account.address,
            creditAmount: Number(creditAmount),
            transactionHash: txn.transactionHash,
            signedMessage,
          });

          if (result.success) {
            console.log("Credits updated successfully:", result.data);
            // Optionally trigger a refresh of the credits display
            await fetch();
          } else {
            console.error("Failed to update credits:", result.error);
          }
        }
      } catch (error) {
        console.error("Error purchasing credits:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-6 border bg-card rounded-4xl overflow-hidden transition-all duration-300 ease-in-out">
      <div className="space-y-4">
        <p className="text-sm font-semibold text-muted-foreground">
          Remaining Credits
        </p>
        <p className="text-4xl font-semibold">{credits.toLocaleString()}</p>
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Cost Per Validation: 10
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
                  onClick={handleClick}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Buy"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
