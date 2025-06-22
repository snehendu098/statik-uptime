"use client"
import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, Clock, TrendingUp, Activity, BarChart3, LineChartIcon } from "lucide-react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Dot } from "recharts"
import Link from "next/link"
import { useUser } from "@civic/auth/react"
import axios from "axios"

// Utility: Convert ISO string to HH:MM (24-hour)
function formatToHHMM(isoString: string): string {
  const date = new Date(isoString)
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

// Custom dot component for line chart hover effects
const CustomDot = (props: any) => {
  const { cx, cy, payload, hoveredIndex, index } = props
  const isHovered = hoveredIndex === index
  const shouldShow = hoveredIndex === null || isHovered

  if (!shouldShow && hoveredIndex !== null) return null

  return (
    <Dot cx={cx} cy={cy} r={isHovered ? 6 : 4} fill={isHovered ? "#34D399" : "#10B981"} stroke="#000" strokeWidth={2} />
  )
}

export default function WebsiteDetails({ params }: { params: { id: string } }) {
  const websiteUrl = "https://example.com" // This would come from your data based on params.id
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [data, setData] = useState<any>(null)
  const {user} = useUser()

  const fetchData = async () => {
    const {data} = await axios.post("/api/logs", {
      email: user?.email,
      websiteId: params.id
    })
    console.log(JSON.stringify(data, null, 2))
    setData(data.creds)
  }

  useEffect(() => {
    if (user?.email) {
      fetchData()
    }
  }, [user?.email])

  // Prepare tick data for table
  const ticks = data?.ticks || []

  // Latency chart data from ticks (latest 12, oldest first)
  const latencyData = ticks
    .slice(-12)
    .map((tick: any) => ({
      time: formatToHHMM(tick.createdAt),
      latency: tick.latency,
      status: tick.status,
    }))

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.png" alt="Statik Logo" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">{data && data.url ? data.url : websiteUrl}</h1>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border mt-1">Active</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Charts and Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Latency Chart */}
              <Card className="bg-neutral-900 border-gray-800 rounded-3xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Response Time</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">Last 24 hours average latency</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Chart Type Tabs */}
                      <div className="flex items-center bg-neutral-800 rounded-full p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setChartType("bar")}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            chartType === "bar"
                              ? "bg-green-500 text-black hover:bg-green-600"
                              : "text-gray-400 hover:text-white hover:bg-neutral-700"
                          }`}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Bar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setChartType("line")}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            chartType === "line"
                              ? "bg-green-500 text-black hover:bg-green-600"
                              : "text-gray-400 hover:text-white hover:bg-neutral-700"
                          }`}
                        >
                          <LineChartIcon className="h-3 w-3 mr-1" />
                          Line
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">108ms</div>
                        <div className="text-sm text-gray-400">Avg Response Time</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "bar" ? (
                        <BarChart data={latencyData} onMouseLeave={() => setHoveredIndex(null)}>
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF", fontSize: 12 }}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#262626",
                              border: "1px solid #404040",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                            formatter={(value) => [`${value}ms`, "Response Time"]}
                            cursor={false}
                          />
                          <Bar
                            dataKey="latency"
                            radius={[4, 4, 0, 0]}
                            onMouseEnter={(_, index) => setHoveredIndex(index)}
                          >
                            {latencyData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  hoveredIndex === null ? "#10B981" : hoveredIndex === index ? "#34D399" : "#10B981"
                                }
                                fillOpacity={hoveredIndex === null ? 1 : hoveredIndex === index ? 1 : 0.3}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <LineChart
                          data={latencyData}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onMouseMove={(e) => {
                            if (e && e.activeTooltipIndex !== undefined) {
                              setHoveredIndex(e.activeTooltipIndex)
                            }
                          }}
                        >
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF", fontSize: 12 }}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#262626",
                              border: "1px solid #404040",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                            formatter={(value) => [`${value}ms`, "Response Time"]}
                            cursor={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="latency"
                            stroke="#10B981"
                            strokeWidth={3}
                            strokeOpacity={hoveredIndex === null ? 1 : 0.4}
                            dot={false}
                            activeDot={{
                              r: 6,
                              fill: "#34D399",
                              stroke: "#000",
                              strokeWidth: 2,
                            }}
                          />
                          {/* Render custom dots for hover effects */}
                          {latencyData.map((entry, index) => (
                            <CustomDot
                              key={`dot-${index}`}
                              cx={0}
                              cy={0}
                              payload={entry}
                              hoveredIndex={hoveredIndex}
                              index={index}
                            />
                          ))}
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Ticks Table */}
              <Card className="bg-neutral-900 border-gray-800 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white">Recent Checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="py-2 px-2 text-left">Time</th>
                          <th className="py-2 px-2 text-left">Status</th>
                          <th className="py-2 px-2 text-left">Latency (ms)</th>
                          <th className="py-2 px-2 text-left">Status Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticks.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500">No checks yet.</td>
                          </tr>
                        )}
                        {Array.from(ticks).toReversed().slice(0,10).map((tick: any) => (
                          <tr key={tick.id} className="border-b border-gray-800">
                            <td className="py-2 px-2">{formatToHHMM(tick.createdAt)}</td>
                            <td className="py-2 px-2">
                              <span className={
                                tick.status === "Good"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }>
                                {tick.status}
                              </span>
                            </td>
                            <td className="py-2 px-2">{tick.latency}</td>
                            <td className="py-2 px-2">{tick.statusCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              
            </div>

            {/* Right Column - AI Summary */}
            <div className="lg:col-span-2">
              <div className="grid col-span-3 gap-4 mb-6">
                {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-neutral-900 border-gray-800 rounded-3xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-2xl">
                        <TrendingUp className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Checks</p>
                        <p className="text-2xl font-bold text-white">1,247</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-gray-800 rounded-3xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-2xl">
                        <Clock className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Last Checked</p>
                        <p className="text-2xl font-bold text-white">2m ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-gray-800 rounded-3xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-2xl">
                        <Activity className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Uptime</p>
                        <p className="text-2xl font-bold text-white">99.8%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              </div>
              <Card className="bg-neutral-900 border-gray-800 h-fit rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-gray-300 space-y-4">
                      <div>
                        <h3 className="text-white font-semibold mb-2">Performance Overview</h3>
                        <p className="text-sm">
                          The website <strong className="text-green-400">example.com</strong> has been showing
                          consistent performance over the past 24 hours with an average response time of{" "}
                          <strong>108ms</strong>. The site maintains excellent uptime with only minor fluctuations
                          during peak hours.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-white font-semibold mb-2">Key Insights</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>
                            <strong>Peak Performance:</strong> Best response times observed between 6:00-8:00 AM
                            (85-90ms)
                          </li>
                          <li>
                            <strong>Traffic Patterns:</strong> Slight latency increases during business hours
                          </li>
                          <li>
                            <strong>Stability:</strong> No significant outages detected
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-white font-semibold mb-2">Recommendations</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>Consider implementing CDN for better global performance</li>
                          <li>Current monitoring interval is optimal</li>
                          <li>Response time threshold set appropriately at 500ms</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
      
