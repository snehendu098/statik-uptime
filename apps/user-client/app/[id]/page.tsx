"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BarChart3, TrendingUp, Clock, Globe, Zap, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock data for the site
const siteData = {
  id: "1",
  url: "https://example.com",
  status: "up",
  uptime: 99.9,
  latency: 45,
  downtime: "2.4h",
}

const performanceData = [
  { time: "00:00", latency: 42, uptime: 100, responseTime: 38 },
  { time: "04:00", latency: 38, uptime: 100, responseTime: 35 },
  { time: "08:00", latency: 45, uptime: 99.8, responseTime: 41 },
  { time: "12:00", latency: 52, uptime: 100, responseTime: 48 },
  { time: "16:00", latency: 48, uptime: 100, responseTime: 44 },
  { time: "20:00", latency: 41, uptime: 100, responseTime: 37 },
]

const locations = [
  { name: "New York", lat: 40.7128, lng: -74.006, latency: 45, status: "good" },
  { name: "London", lat: 51.5074, lng: -0.1278, latency: 89, status: "good" },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, latency: 156, status: "warning" },
  { name: "Sydney", lat: -33.8688, lng: 151.2093, latency: 203, status: "warning" },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333, latency: 178, status: "good" },
]

export default function SiteDetail({ params }: { params: { id: string } }) {
  const [chartType, setChartType] = useState<"bar" | "line">("line")
  const [mounted, setMounted] = useState(false)
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChartTypeChange = (value: string) => {
    setIsAnimating(true)
    setTimeout(() => {
      setChartType(value as "bar" | "line")
      setIsAnimating(false)
    }, 150)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "bg-[#00bf63]"
      case "down":
        return "bg-red-500"
      case "intermittent":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getLocationStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-[#00bf63]"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#000e02] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00bf63]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#000e02] animate-fade-in">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95 hover:-translate-x-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-300" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-white transition-all duration-300 group-hover:text-[#00bf63]">
                Statik
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Site Header */}
        <div className="mb-8 animate-slide-in-left">
          <div className="flex items-center space-x-3 mb-2 group">
            <h2 className="text-3xl font-bold text-white transition-colors duration-300 group-hover:text-[#00bf63]">
              {siteData.url}
            </h2>
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(siteData.status)} transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg animate-pulse`}
            ></div>
          </div>
          <p className="text-gray-400 transition-colors duration-300">Real-time monitoring and performance metrics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-[#00bf63]/10 hover:-translate-y-2 hover:scale-105 animate-fade-in-up animation-delay-100 group cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center group-hover:text-gray-300 transition-colors duration-300">
                <TrendingUp className="w-4 h-4 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-[#00bf63]" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#00bf63] group-hover:scale-110 transition-transform duration-300">
                {siteData.uptime}%
              </div>
              <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors duration-300">
                Last 30 days
              </p>
              <div className="mt-2 flex items-center">
                <Shield className="w-3 h-3 text-[#00bf63] mr-1" />
                <span className="text-xs text-[#00bf63]">Excellent</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 hover:scale-105 animate-fade-in-up animation-delay-200 group cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center group-hover:text-gray-300 transition-colors duration-300">
                <Zap className="w-4 h-4 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-400" />
                Average Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white group-hover:scale-110 group-hover:text-blue-400 transition-all duration-300">
                {siteData.latency}ms
              </div>
              <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors duration-300">
                Response time
              </p>
              <div className="mt-2 flex items-center">
                <div className="w-3 h-3 bg-[#00bf63] rounded-full mr-1"></div>
                <span className="text-xs text-[#00bf63]">Fast</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 hover:scale-105 animate-fade-in-up animation-delay-300 group cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center group-hover:text-gray-300 transition-colors duration-300">
                <Clock className="w-4 h-4 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-red-400" />
                Downtime Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400 group-hover:scale-110 transition-transform duration-300">
                {siteData.downtime}
              </div>
              <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors duration-300">
                Last 30 days
              </p>
              <div className="mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                <span className="text-xs text-yellow-500">Minimal</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* World Map */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-[#00bf63]/10 animate-fade-in-up animation-delay-400">
            <CardHeader>
              <CardTitle className="text-white flex items-center transition-colors duration-300 hover:text-[#00bf63]">
                <Globe className="w-5 h-5 mr-2 transition-transform duration-300 hover:rotate-12" />
                Global Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-800 rounded-lg p-4 h-80 overflow-hidden">
                {/* Animated background grid */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div
                        key={i}
                        className="border border-[#00bf63] animate-pulse"
                        style={{ animationDelay: `${i * 50}ms` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Simplified world map representation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-600 text-center">
                    <Globe className="w-16 h-16 mx-auto mb-4 animate-spin-slow" />
                    <p className="text-sm">Interactive world map would be rendered here</p>
                    <p className="text-xs mt-2">Using MapChart.js with custom markers</p>
                  </div>
                </div>

                {/* Location markers overlay */}
                <div className="absolute top-4 right-4 space-y-2">
                  {locations.map((location, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 text-xs p-2 rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-105 hover:bg-gray-700/50 ${
                        hoveredLocation === location.name ? "bg-gray-700/50 scale-105" : ""
                      }`}
                      onMouseEnter={() => setHoveredLocation(location.name)}
                      onMouseLeave={() => setHoveredLocation(null)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div
                        className={`w-2 h-2 ${getLocationStatusColor(location.status)} rounded-full transition-all duration-300 ${
                          hoveredLocation === location.name ? "scale-150 shadow-lg" : ""
                        }`}
                      ></div>
                      <span
                        className={`text-white transition-all duration-300 ${
                          hoveredLocation === location.name ? "text-[#00bf63] font-semibold" : ""
                        }`}
                      >
                        {location.name}
                      </span>
                      <span
                        className={`text-gray-400 transition-all duration-300 font-mono ${
                          hoveredLocation === location.name ? "text-white font-semibold" : ""
                        }`}
                      >
                        {location.latency}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Charts */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-[#00bf63]/10 animate-fade-in-up animation-delay-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white transition-colors duration-300 hover:text-[#00bf63]">
                  Performance Metrics
                </CardTitle>
                <Tabs value={chartType} onValueChange={handleChartTypeChange}>
                  <TabsList className="bg-gray-800 p-1 rounded-lg">
                    <TabsTrigger
                      value="line"
                      className="data-[state=active]:bg-[#00bf63] data-[state=active]:text-[#000e02] transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-[#00bf63]/25 hover:bg-gray-700 data-[state=inactive]:hover:bg-gray-700 transform hover:scale-105 active:scale-95"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Line
                    </TabsTrigger>
                    <TabsTrigger
                      value="bar"
                      className="data-[state=active]:bg-[#00bf63] data-[state=active]:text-[#000e02] transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-[#00bf63]/25 hover:bg-gray-700 data-[state=inactive]:hover:bg-gray-700 transform hover:scale-105 active:scale-95"
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Bar
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  latency: {
                    label: "Latency (ms)",
                    color: "#00bf63",
                  },
                }}
                className={`h-80 transition-all duration-300 ${isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="latency"
                        stroke="#00bf63"
                        strokeWidth={3}
                        dot={{ fill: "#00bf63", strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: "#00bf63", strokeWidth: 2, fill: "#000e02" }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="latency"
                        fill="#00bf63"
                        radius={[4, 4, 0, 0]}
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
