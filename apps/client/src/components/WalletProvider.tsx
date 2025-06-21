"use client";

import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren, useState } from "react";
import { Button } from "@/components/ui/button";

interface WalletConnectProps {
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
}

export function WalletConnectButton({ onConnected, onDisconnected }: WalletConnectProps) {
  const { connect, disconnect, account, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await connect("Petra");
      if (account?.address) {
        onConnected?.(account.address.toString());
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onDisconnected?.();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  return (
    <>
      {!connected ? (
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 rounded-full text-black font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Connecting...
            </span>
          ) : (
            "Connect Wallet"
          )}
        </Button>
      ) : (
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="rounded-full border-gray-700 bg-neutral-900 hover:bg-neutral-800 text-white"
        >
          {account?.address ? 
            `${account.address.toString().slice(0, 6)}...${account.address.toString().slice(-4)}` 
            : "Connected"}
        </Button>
      )}
    </>
  );
}

interface WalletProviderProps extends WalletConnectProps {
  children: React.ReactNode;
}

export default function WalletProvider({ children, ...props }: WalletProviderProps) {
  return (
    <AptosWalletAdapterProvider 
      autoConnect={true}
      onError={(error) => {
        console.log("Wallet error:", error);
      }}
    >
      {children}
      <WalletConnectButton {...props} />
    </AptosWalletAdapterProvider>
  );
}