"use client";


import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin, Wallet, Globe, Award, Wifi, WifiOff } from "lucide-react";
import type { OutgoingMessage, SignupOutgoingMessage, ValidateOutgoingMessage } from "common/types";
import { v4 as uuidv4 } from 'uuid';
import Image from "next/image";

// Define types for location data
interface Location {
  lat: number;
  lng: number;
  timestamp: Date;
}

// Define types for Petra wallet
interface PetraWallet {
  connect(): Promise<{ address: string; publicKey: string }>;
  disconnect(): Promise<void>;
  account(): Promise<{ address: string; publicKey: string }>;
}

declare global {
  interface Window {
    aptos?: PetraWallet;
  }
}

export default function StatikDashboard() {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [previousLocations, setPreviousLocations] = useState<Location[]>([]);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState([0]);
  const [locationPermission, setLocationPermission] = useState<string>("prompt");
  
  // Wallet state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // WebSocket state
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [validatorId, setValidatorId] = useState<string | null>(null);
  const validatorIdRef = useRef<string | null>(null); // <-- add ref
  
  // Refs for WebSocket management
  const wsRef = useRef<WebSocket | null>(null);
  const callbacksRef = useRef<{[callbackId: string]: (data: SignupOutgoingMessage) => void}>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [data, setData] = useState<any>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if Petra is installed
  const isPetraInstalled = (): boolean => {
    return typeof window !== "undefined" && "aptos" in window;
  };

  const getAptosWallet = (): PetraWallet | null => {
    if (isPetraInstalled()) {
      return window.aptos!;
    } else {
      window.open("https://petra.app/", "_blank");
      return null;
    }
  };

  // WebSocket validation handler
  const validateHandler = async (ws: WebSocket, { url, callbackId, websiteId }: ValidateOutgoingMessage) => {
    if (!validatorIdRef.current) {
      console.error("ValidatorId not set, skipping validate response");
      return;
    }
    console.log(`Validating ${url}`);
    console.log(validatorId, validatorIdRef.current)
    const startTime = Date.now();
    
    try {
        const response = await fetch(url);
        const endTime = Date.now();
        const latency = endTime - startTime;
        const status = response.status;

        console.log(url);
        console.log(status);
        console.log({
            type: 'validate',
            data: {
                callbackId,
                status: (status >= 200 && status < 400) ? 'Good' : 'Bad',
                latency,
                websiteId,
                validatorId: validatorIdRef.current, // <-- always use ref
                statusCode: response.status
            },
        })
        ws.send(JSON.stringify({
            type: 'validate',
            data: {
                callbackId,
                status: (status >= 200 && status < 400) ? 'Good' : 'Bad',
                latency,
                websiteId,
                validatorId: validatorIdRef.current, // <-- always use ref
                statusCode: response.status
            },
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'validate',
            data: {
                callbackId,
                status:'Bad',
                latency: 1000,
                websiteId,
                validatorId: validatorIdRef.current, // <-- always use ref
                statusCode: 0
            },
        }));
        console.error(error);
    }
  };

  // WebSocket connection function
  const connectWebSocket = useCallback(() => {
    if (!isClient || !walletAddress) return;
    
    const publicKey = truncateAddress(walletAddress);
    const ws = new WebSocket("ws://localhost:8081");
    wsRef.current = ws;

    ws.onopen = async () => {
        console.log("WebSocket connected");
        setWsConnected(true);
        
        const callbackId = uuidv4();
        callbacksRef.current[callbackId] = (data: SignupOutgoingMessage) => {
          if (!validatorIdRef.current) {
            setValidatorId(data.validatorId); // <-- Store validatorId in state
            validatorIdRef.current = data.validatorId; // <-- Store in ref
            console.log("Validator ID set:", data.validatorId);
          }
        };
        
        ws.send(JSON.stringify({
            type: 'signup',
            data: {
                callbackId,
                ip: '127.0.0.1',
                publicKey: publicKey,
                location: "US"
            },
        }));
    };

    ws.onmessage = async (event) => {
        try {
            const data: OutgoingMessage = JSON.parse(event.data);
            if (data.type === 'signup') {
                callbacksRef.current[data.data.callbackId]?.(data.data);
                delete callbacksRef.current[data.data.callbackId];
            } else if (data.type === 'validate') {
                await validateHandler(ws, { ...data.data }); // Only pass known properties
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };

    ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setWsConnected(false);
        setValidatorId(null);
        
        // Attempt to reconnect after 3 seconds if not a manual disconnect
        if (event.code !== 1000 && isConnected) {
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log("Attempting to reconnect WebSocket...");
                connectWebSocket();
            }, 3000);
        }
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsConnected(false);
    };
  }, [isClient, walletAddress, isConnected]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
        wsRef.current.close(1000, "Manual disconnect");
        wsRef.current = null;
    }
    
    setWsConnected(false);
    setValidatorId(null);
    callbacksRef.current = {};
  }, []);

  // Connect to the Petra wallet
  const connectWallet = async () => {
    setIsLoading(true);

    try {
      const wallet = getAptosWallet();

      if (!wallet) {
        alert("Please install Petra wallet extension first!");
        setIsLoading(false);
        return;
      }

      const response = await wallet.connect();
      console.log("Wallet connected:", response);
      console.log("Wallet address:", response.address);

      setWalletAddress(response.address);
      setIsConnected(true);
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      if (error.code === 4001) {
        alert("User rejected the connection request.");
      } else {
        alert("Failed to connect to Petra wallet. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from the Petra wallet
  const disconnectWallet = async () => {
    try {
      // Disconnect WebSocket first
      disconnectWebSocket();
      
      const wallet = getAptosWallet();
      if (wallet) {
        await wallet.disconnect();
        setIsConnected(false);
        setWalletAddress("");
        console.log("Wallet disconnected");
      }
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  // Check connection status on component mount
  useEffect(() => {
    if (!isClient) return;
    
    const checkConnection = async () => {
      if (isPetraInstalled()) {
        try {
          const wallet = window.aptos!;
          const account = await wallet.account();
          if (account && account.address) {
            setWalletAddress(account.address);
            setIsConnected(true);
            console.log("Already connected to wallet:", account.address);
          }
        } catch (error) {
          console.log("Wallet not connected");
        }
      }
    };

    checkConnection();
  }, [isClient]);

  // Connect WebSocket when wallet is connected
  useEffect(() => {
    if (isConnected && walletAddress && !wsConnected) {
      connectWebSocket();
    } else if (!isConnected && wsConnected) {
      disconnectWebSocket();
    }
  }, [isConnected, walletAddress, wsConnected, connectWebSocket, disconnectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Mock data
  const exp_number = 2500;

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (!isClient) return;
    
    // Request location permission on component mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: Number.parseFloat(position.coords.latitude.toFixed(4)),
            lng: Number.parseFloat(position.coords.longitude.toFixed(4)),
          };
          setCurrentLocation(newLocation);
          setLocationPermission("granted");

          // Add to previous locations (mock data for demo)
          setPreviousLocations([
            { lat: 40.7128, lng: -74.006, timestamp: new Date("2024-01-15") },
            { lat: 34.0522, lng: -118.2437, timestamp: new Date("2024-01-10") },
            { lat: 51.5074, lng: -0.1278, timestamp: new Date("2024-01-05") },
          ]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationPermission("denied");
        }
      );
    }
  }, [isClient]);

  // Don't render until we're on the client
  if (!isClient) {
    return <div className="min-h-screen bg-[#000e02] text-white flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#000e02] text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Image src={"/logo.png"} height={40} width={40} alt="logo" />
            </div>
            <span className="text-xl font-semibold">Statik</span>
            
            {/* WebSocket Status Indicator */}
            <div className="flex items-center space-x-1 ml-4">
              {wsConnected ? (
                <Wifi className="w-4 h-4 text-[#00bf63]" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-400">
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {!isConnected ? (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="px-8 py-4 text-lg font-semibold text-black rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#00bf63",
                boxShadow: "0 4px 20px rgba(0, 191, 99, 0.3)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              {validatorId && (
                <div className="text-sm text-gray-400">
                  Validator Id: <span className="text-[#00bf63]">{validatorIdRef.current}</span>
                </div>
              )}
              <button
                onClick={disconnectWallet}
                className="px-6 py-3 text-white border-2 rounded-lg transition-all duration-300 hover:bg-red-600 hover:border-red-600"
                style={{
                  borderColor: "#00bf63",
                  backgroundColor: "transparent",
                }}
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          
        </div>

        {/* Stats Cards */}
        <div className="w-full h-full flex flex-col mb-10 items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">
            Hello, {walletAddress ? truncateAddress(walletAddress) : 'Please connect your wallet'}
          </h1>
          <div className="w-1/3 rounded-2xl relative aspect-square bg-neutral-700/20 flex items-center justify-center" >
            <p className="text-4xl font-bold">{exp_number}</p>
          </div>
            <Button className="rounded-full bg-green-500 text-black font-semibold text-xl p-4 hover:bg-green-400 w-1/3 mt-4" >Redeem</Button>
        </div>
      </main>
    </div>
  );
}