"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "@/components/common/navbar";
import { useState, useEffect } from "react";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { contract } from "@/lib/thirdweb-client";
import { getValidatorByPubKey, resetValidatorPayouts } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const account = useActiveAccount();
  const [pendingPayout, setPendingPayouts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch pending payouts when account changes
  const fetchPendingPayouts = async () => {
    if (!account?.address) {
      setPendingPayouts(0);
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const response = await getValidatorByPubKey(account.address);

      if (response.success && response.data) {
        setPendingPayouts(response.data.pendingPayouts);
      } else {
        setError(response.error || "Failed to fetch pending payouts");
      }
    } catch (err) {
      console.error("Error fetching pending payouts:", err);
      setError("Failed to fetch pending payouts");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchPendingPayouts();
  }, [account?.address]);

  const handleClick = async () => {
    if (!account) return;

    setIsLoading(true);

    try {
      // 1. Prepare and send the contract transaction
      const transaction = prepareContractCall({
        contract,
        method:
          "function cashOut(uint256 creditAmount) returns (uint256 amountU2U)",
        params: [BigInt(pendingPayout)],
      });

      const txn = await sendTransaction({ transaction, account });

      toast({
        title: "Transaction Successful",
        description: `Successfully withdrew ${pendingPayout} credits`,
      });

      // 2. Sign message to reset payouts on hub
      const message = `Reset pending payouts for validator ${account.address}`;
      const signedMessage = await account.signMessage({ message });

      // 3. Reset payouts on the hub
      const resetResponse = await resetValidatorPayouts({
        pubKey: account.address,
        signedMessage,
      });

      if (!resetResponse.success) {
        throw new Error(resetResponse.error || "Failed to reset payouts");
      }

      // 4. Refetch pending payouts to get updated data
      await fetchPendingPayouts();

      toast({
        title: "Credits Withdrawn",
        description: "Your pending payouts have been reset to 0",
      });
    } catch (err) {
      console.error("Error during withdrawal:", err);
      toast({
        title: "Withdrawal Failed",
        description:
          err instanceof Error ? err.message : "Failed to withdraw credits",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen">
      <Navbar />
      <div className="flex items-center w-full h-full justify-center">
        {!account ? (
          <div className="w-full text-center py-20">
            <p className="text-lg text-muted-foreground">
              Please connect your wallet to claim your credits
            </p>
          </div>
        ) : isFetching ? (
          <div className="w-full text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading credits...</p>
          </div>
        ) : error ? (
          <div className="w-full text-center py-20">
            <p className="text-lg text-destructive">{error}</p>
          </div>
        ) : (
          <Card className="min-w-96 px-8 rounded-3xl">
            <CardTitle className="flex items-center space-x-2">
              <div className="flex flex-col">
                <p className="text-2xl font-semibold">STATIK CREDITS</p>
                <p className="text-sm text-muted-foreground">
                  Claim your credits
                </p>
              </div>
            </CardTitle>
            <CardDescription></CardDescription>
            <CardContent>
              <div className="flex w-full space-x-2 items-center justify-center">
                <Image src={"/logo.png"} alt="img" height={40} width={50} />
                <p className="text-6xl font-semibold">{pendingPayout}</p>
              </div>
            </CardContent>
            <CardFooter className="mt-8">
              <Button
                className="w-full rounded-2xl"
                size={"lg"}
                onClick={handleClick}
                disabled={isLoading || pendingPayout === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
