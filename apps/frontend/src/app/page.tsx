"use client";


import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  
  // Refs for WebSocket management
  const wsRef = useRef<WebSocket | null>(null);
  const callbacksRef = useRef<{[callbackId: string]: (data: SignupOutgoingMessage) => void}>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isClient, setIsClient] = useState(false);

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
    console.log(`Validating ${url}`);
    const startTime = Date.now();
    
    try {
        const response = await fetch(url);
        const endTime = Date.now();
        const latency = endTime - startTime;
        const status = response.status;

        console.log(url);
        console.log(status);
        ws.send(JSON.stringify({
            type: 'validate',
            data: {
                callbackId,
                status: (status >= 200 && status < 400) ? 'Good' : 'Bad',
                latency,
                websiteId,
                validatorId,
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
                validatorId,
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
            setValidatorId(data.validatorId);
            console.log("Validator ID set:", data.validatorId);
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
                await validateHandler(ws, data.data);
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

  //Console log
//   useEffect(() => {
//   if (!walletAddress) return;
//   fetch("/api/routes", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ publicKey: walletAddress }),
//   })
//     .then((res) => res.json())
//     .then((data) => {
//       console.log("Pending payout amount:", data);
//     })
//     .catch((err) => {
//       console.error("Error fetching pending payout:", err);
//     });
// }, [walletAddress]);

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
  const website_number = 42;
  const exp_number = 2500;

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const maxRedeemAmount = Math.floor(exp_number / 1000);

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

  const handleRedeemClick = () => {
    if (exp_number < 1000) {
      alert("EXP must be over 1000 to redeem the code");
      return;
    }
    setIsRedeemOpen(true);
  };

  const handleConfirmRedeem = () => {
    console.log(`Redeeming ${redeemAmount[0]} amount`);
    setIsRedeemOpen(false);
    setRedeemAmount([0]);
  };

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
            <div className="w-8 h-8 bg-[#00bf63] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">S</span>
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
                  Validator: <span className="text-[#00bf63]">{validatorId}</span>
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
          <h1 className="text-3xl font-bold mb-2">
            Hello, {walletAddress ? truncateAddress(walletAddress) : 'Please connect your wallet'}
          </h1>
        </div>

        {/* Location Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-[#00bf63]" />
            <h2 className="text-xl font-semibold">Current Location</h2>
          </div>

          {currentLocation ? (
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <p className="text-gray-300">
                Latitude:{" "}
                <span className="text-[#00bf63] font-mono">
                  {currentLocation.lat}
                </span>
              </p>
              <p className="text-gray-300">
                Longitude:{" "}
                <span className="text-[#00bf63] font-mono">
                  {currentLocation.lng}
                </span>
              </p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <p className="text-gray-400">
                {locationPermission === "denied"
                  ? "Location access denied. Please enable location services."
                  : "Requesting location access..."}
              </p>
            </div>
          )}

          {/* Previous Locations */}
          {previousLocations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-300">
                Previous Locations
              </h3>
              <div className="space-y-2">
                {previousLocations.slice(0, 4).map((location, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div className="text-sm">
                      <span className="text-gray-400">
                        {location.lat}, {location.lng}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {location.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Websites Visited
              </CardTitle>
              <Globe className="h-4 w-4 text-[#00bf63]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00bf63]">
                {website_number}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                EXP Count
              </CardTitle>
              <Award className="h-4 w-4 text-[#00bf63]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00bf63]">
                {exp_number}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Redeem Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleRedeemClick}
            className="bg-[#00bf63] hover:bg-[#00a855] text-black font-semibold px-8 py-3 text-lg"
            disabled={!isConnected}
          >
            Add Redeem
          </Button>
        </div>
      </main>

      {/* Redeem Dialog */}
      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Redeem EXP
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <p className="text-gray-300">Choose how much you want to extract</p>

            <div className="space-y-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="px-2">
                      <Slider
                        value={redeemAmount}
                        onValueChange={setRedeemAmount}
                        max={maxRedeemAmount}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{redeemAmount[0]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex justify-between text-sm text-gray-400">
                <span>0</span>
                <span>{maxRedeemAmount}</span>
              </div>
            </div>

            <p className="text-center text-lg">
              Extract{" "}
              <span className="text-[#00bf63] font-semibold">
                {redeemAmount[0]}
              </span>{" "}
              amount
            </p>

            <Button
              onClick={handleConfirmRedeem}
              className="w-full bg-[#00bf63] hover:bg-[#00a855] text-black font-semibold"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}