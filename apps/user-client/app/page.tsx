"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Navbar } from "@/components/navbar"
import { Search, Plus, TrendingUp, AlertTriangle, CheckCircle, XCircle, X, HelpCircle } from "lucide-react"
import Link from "next/link"

interface MonitoredSite {
  id: string
  url: string
  status: "up" | "down" | "intermittent"
  uptime: number
  latency: number
}

const mockData: MonitoredSite[] = [
  { id: "1", url: "https://example.com", status: "up", uptime: 99.9, latency: 45 },
  { id: "2", url: "https://api.service.com", status: "up", uptime: 98.7, latency: 120 },
  { id: "3", url: "https://staging.app.com", status: "intermittent", uptime: 95.2, latency: 89 },
  { id: "4", url: "https://cdn.assets.com", status: "down", uptime: 87.3, latency: 0 },
  { id: "5", url: "https://blog.company.com", status: "up", uptime: 99.5, latency: 67 },
]

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sites] = useState<MonitoredSite[]>(mockData)
  const [mounted, setMounted] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [showAddWebsite, setShowAddWebsite] = useState(false)
  const [credits] = useState(150) // Mock user credits
  const [userName] = useState("H4B") // Mock user name

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    checkInterval: 5,
    intervalUnit: "min",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredSites = sites.filter((site) => site.url.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleAddWebsite = () => {
    setShowAddWebsite(!showAddWebsite)
    if (!showAddWebsite) {
      // Reset form when opening
      setFormData({
        name: "",
        url: "",
        checkInterval: 5,
        intervalUnit: "min",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log("Form submitted:", formData)

    // Close the form after submission
    setShowAddWebsite(false)

    // Reset form
    setFormData({
      name: "",
      url: "",
      checkInterval: 5,
      intervalUnit: "min",
    })
  }

  const handleClear = () => {
    setFormData({
      name: "",
      url: "",
      checkInterval: 5,
      intervalUnit: "min",
    })
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <CheckCircle className="w-4 h-4 text-[#00bf63]" />
      case "down":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "intermittent":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "up":
        return "Online"
      case "down":
        return "Offline"
      case "intermittent":
        return "Issues"
      default:
        return "Unknown"
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
      {/* Navbar */}
      <Navbar credits={credits} userName={userName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8 animate-slide-in-left">
          <h2 className="text-3xl font-bold text-white mb-2 transition-colors duration-300 hover:text-[#00bf63]">
            Hi, {userName}
          </h2>
          <p className="text-gray-400 transition-colors duration-300">Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-[#00bf63]/10 hover:-translate-y-2 hover:scale-105 animate-fade-in-up animation-delay-100 group cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Total Sites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white group-hover:text-[#00bf63] transition-colors duration-300">
                {sites.length}
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-[#00bf63] mr-1 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Active monitoring
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-[#00bf63]/10 hover:-translate-y-2 hover:scale-105 animate-fade-in-up animation-delay-200 group cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00bf63] group-hover:scale-110 transition-transform duration-300">
                {sites.filter((s) => s.status === "up").length}
              </div>
              <div className="flex items-center mt-2">
                <CheckCircle className="w-4 h-4 text-[#00bf63] mr-1 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Healthy
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-2 hover:scale-105 animate-fade-in-up animation-delay-300 group cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500 group-hover:scale-110 transition-transform duration-300">
                {sites.filter((s) => s.status === "intermittent").length}
              </div>
              <div className="flex items-center mt-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Needs attention
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm transform transition-all duration-500 hover:bg-gray-900/70 hover:border-gray-700 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 hover:scale-105 animate-fade-in-up animation-delay-400 group cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Offline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500 group-hover:scale-110 transition-transform duration-300">
                {sites.filter((s) => s.status === "down").length}
              </div>
              <div className="flex items-center mt-2">
                <XCircle className="w-4 h-4 text-red-500 mr-1 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Critical
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slide-in-right">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-all duration-300 group-focus-within:text-[#00bf63] group-focus-within:scale-110" />
            <Input
              placeholder="Search websites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-[#00bf63] focus:ring-2 focus:ring-[#00bf63]/20 transition-all duration-300 hover:border-gray-600 hover:bg-gray-750"
            />
          </div>
          <Button
            onClick={handleAddWebsite}
            className={`${
              showAddWebsite ? "bg-red-600 hover:bg-red-700" : "bg-[#00bf63] hover:bg-[#00a555]"
            } text-white font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95`}
          >
            {showAddWebsite ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2 transition-transform duration-300 hover:rotate-90" />
                Add Website
              </>
            )}
          </Button>
        </div>

        {/* Add Website Form */}
        {showAddWebsite && (
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm mb-6 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="w-5 h-5 mr-2 text-[#00bf63]" />
                Add New Website
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                      Website Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g., My Blog"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-[#00bf63] focus:ring-2 focus:ring-[#00bf63]/20 transition-all duration-300"
                      required
                    />
                  </div>

                  {/* URL Field */}
                  <div className="space-y-2">
                    <Label htmlFor="url" className="text-sm font-medium text-gray-300">
                      Website URL
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-[#00bf63] focus:ring-2 focus:ring-[#00bf63]/20 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Check Interval */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium text-gray-300">Check Interval</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-[#00bf63] transition-colors duration-200" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                          <p>After how long do you want to check your website status</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={formData.checkInterval}
                      onChange={(e) =>
                        setFormData({ ...formData, checkInterval: Number.parseInt(e.target.value) || 0 })
                      }
                      className="w-24 bg-gray-800 border-gray-700 text-white focus:border-[#00bf63] focus:ring-2 focus:ring-[#00bf63]/20 transition-all duration-300"
                      required
                    />
                    <Select
                      value={formData.intervalUnit}
                      onValueChange={(value) => setFormData({ ...formData, intervalUnit: value })}
                    >
                      <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white focus:border-[#00bf63] focus:ring-2 focus:ring-[#00bf63]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="sec" className="text-white hover:bg-gray-700">
                          seconds
                        </SelectItem>
                        <SelectItem value="min" className="text-white hover:bg-gray-700">
                          minutes
                        </SelectItem>
                        <SelectItem value="hr" className="text-white hover:bg-gray-700">
                          hours
                        </SelectItem>
                        <SelectItem value="days" className="text-white hover:bg-gray-700">
                          days
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300"
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#00bf63] hover:bg-[#00a555] text-[#000e02] font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#00bf63]/25 active:scale-95"
                  >
                    Add Website
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sites List */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm animate-fade-in-up animation-delay-500">
          <CardHeader>
            <CardTitle className="text-white transition-colors duration-300 hover:text-[#00bf63]">
              Monitored Websites
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors duration-300">
                      Website
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors duration-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors duration-300">
                      Uptime
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors duration-300">
                      Latency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSites.map((site, index) => (
                    <tr
                      key={site.id}
                      className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${
                        hoveredRow === site.id ? "bg-gray-800/30 shadow-lg" : ""
                      }`}
                      onMouseEnter={() => setHoveredRow(site.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="py-4 px-6">
                        <Link
                          href={`/site/${site.id}`}
                          className="text-white hover:text-[#00bf63] transition-all duration-300 transform hover:translate-x-1 inline-block"
                        >
                          {site.url}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(site.status)} transition-all duration-300 ${hoveredRow === site.id ? "scale-125 shadow-lg" : ""}`}
                          ></div>
                          <div className="transition-transform duration-300 hover:scale-110">
                            {getStatusIcon(site.status)}
                          </div>
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(site.status)} text-white border-0 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                          >
                            {getStatusText(site.status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`font-mono transition-all duration-300 ${
                            site.uptime >= 99
                              ? "text-[#00bf63]"
                              : site.uptime >= 95
                                ? "text-yellow-500"
                                : "text-red-500"
                          } ${hoveredRow === site.id ? "font-bold scale-105" : "text-white"}`}
                        >
                          {site.uptime}%
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`font-mono transition-all duration-300 ${
                            hoveredRow === site.id ? "text-[#00bf63] font-bold scale-105" : "text-white"
                          }`}
                        >
                          {site.latency > 0 ? `${site.latency}ms` : "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
